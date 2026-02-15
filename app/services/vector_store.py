import os
import shutil
from typing import List
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "../../.env"))

DOCS_DIR = os.path.join(os.path.dirname(__file__), "../documents")
DB_DIR = os.path.join(os.path.dirname(__file__), "../../faiss_index")

def load_documents() -> List[Document]:
    """Loads PDF and Text documents from the documents directory."""
    documents = []
    if not os.path.exists(DOCS_DIR):
        os.makedirs(DOCS_DIR)
        return []

    for filename in os.listdir(DOCS_DIR):
        file_path = os.path.join(DOCS_DIR, filename)
        if filename.endswith(".pdf"):
            loader = PyPDFLoader(file_path)
            documents.extend(loader.load())
        elif filename.endswith(".txt"):
            loader = TextLoader(file_path, encoding='utf-8')
            documents.extend(loader.load())
    return documents

def split_documents(documents: List[Document]) -> List[Document]:
    """Splits documents into smaller chunks."""
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len,
        is_separator_regex=False,
    )
    return text_splitter.split_documents(documents)

def get_vector_store():
    """Returns the FAISS vector store. Loads from disk if available."""
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    if os.path.exists(DB_DIR):
        return FAISS.load_local(DB_DIR, embeddings, allow_dangerous_deserialization=True)
    else:
        # Return an empty store (hacky, better to just handle ingestion properly)
        # Ideally, we should not call this if DB doesn't exist, or handle empty case.
        # But for RAG, we usually assume ingestion happens first.
        # Let's return None or raise error if not found.
        # Or better: create a dummy index.
        return None

def ingest_documents():
    """Ingests documents into the vector store."""
    if os.path.exists(DB_DIR):
        shutil.rmtree(DB_DIR)

    documents = load_documents()
    if not documents:
        return {"status": "skipped", "message": "No documents found to ingest."}

    chunks = split_documents(documents)
    
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    vector_store = FAISS.from_documents(chunks, embeddings)
    vector_store.save_local(DB_DIR)
    
    return {"status": "success", "message": f"Ingested {len(documents)} documents into {len(chunks)} chunks."}

def get_retriever():
    """Returns a retriever from the vector store."""
    vector_store = get_vector_store()
    if vector_store is None:
        raise ValueError("Vector store not found. Please ingest documents first.")
    return vector_store.as_retriever(search_type="similarity", search_kwargs={"k": 5})
