from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from .vector_store import get_retriever
from ..database import measurements_collection, meal_plans_collection, chat_history_collection
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "../../.env"))

async def get_chat_history(email: str, limit: int = 20):
    """Fetches chat history for a specific user."""
    cursor = await chat_history_collection.find({"user_email": email})
    cursor = cursor.sort("timestamp", -1)
    messages = await cursor.to_list(length=limit)
    # Return in chronological order
    return messages[::-1]

async def save_chat_message(email: str, text: str, is_user: bool):
    """Saves a chat message to the database."""
    message = {
        "user_email": email,
        "text": text,
        "is_user": is_user,
        "timestamp": datetime.now().isoformat()
    }
    await chat_history_collection.insert_one(message)

async def get_user_history_context(email: str):
    """Fetches the last 5 relevant measurements for the user."""
    cursor = await measurements_collection.find({"user_email": email})
    cursor = cursor.sort("date", -1).limit(5)
    measurements = await cursor.to_list(length=5)
    
    if not measurements:
        return "No historical measurement data available for this user."
    
    history_str = "User Measurement History (Most recent first):\n"
    for m in measurements:
        # Handle both datetime objects and ISO format strings
        date_value = m.get("date", "")
        if isinstance(date_value, str):
            date_str = date_value[:10]  # Extract YYYY-MM-DD from ISO format
        else:
            date_str = date_value.strftime("%Y-%m-%d") if hasattr(date_value, 'strftime') else str(date_value)
        
        history_str += f"- Date: {date_str}, Weight: {m.get('weight_kg')}kg, Waist: {m.get('waist_cm')}cm, BMI: {m.get('bmi')}\n"
        
    return history_str

async def get_active_meal_plan(email: str):
    """Fetches the current active meal plan for the user."""
    cursor = await meal_plans_collection.find({"user_email": email, "active": True})
    cursor = cursor.sort("created_at", -1)
    plans = await cursor.to_list(length=1)
    
    if not plans:
        return "No active meal plan found."
        
    plan_data = plans[0].get("plan_data", {})
    goal = plans[0].get("goal", "Unknown Goal")
    
    meal_plan_str = f"Active Meal Plan (Goal: {goal}):\n"
    
    # Extract just the first day as a summary if available
    mp = plan_data.get("meal_plan", {})
    if mp:
        first_day_key = list(mp.keys())[0]
        day = mp[first_day_key]
        meal_plan_str += f"Sample Day ({first_day_key}):\n"
        meal_plan_str += f"- Breakfast: {day.get('breakfast', {}).get('main', 'N/A')}\n"
        meal_plan_str += f"- Lunch: {day.get('lunch', {}).get('main', 'N/A')}\n"
        meal_plan_str += f"- Dinner: {day.get('dinner', {}).get('main', 'N/A')}\n"
        meal_plan_str += f"- Snacks: {day.get('snacks', {}).get('main', 'N/A')}\n"
    
    return meal_plan_str

async def get_chat_response(query: str, user_email: str):
    """
    Generates a response to the user's query using RAG, User History, and Chat History.
    """
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
    retriever = get_retriever()

    # Save User Query
    await save_chat_message(user_email, query, True)

    # Get User History (Measurements)
    user_history = await get_user_history_context(user_email)
    
    # Get Meal Plan
    meal_plan = await get_active_meal_plan(user_email)

    # Get Recent Chat Context (last 10 messages)
    chat_history = await get_chat_history(user_email, 10)
    chat_context = ""
    if chat_history:
        chat_context = "Recent Conversation:\n"
        for msg in chat_history:
            role = "User" if msg["is_user"] else "Assistant"
            chat_context += f"{role}: {msg['text']}\n"

    def format_docs(docs):
        return "\n\n".join(doc.page_content for doc in docs)

    system_prompt = (
        "You are an assistant for question-answering tasks and fitness tracking. "
        "Use the following pieces of retrieved context, the user's personal history, "
        "and the recent conversation history to answer the question. "
        "If you don't know the answer, say that you don't know. "
        "Use three sentences maximum and keep the answer concise."
        "\n\n"
        "--- User History ---\n"
        "{user_history}\n"
        "--------------------\n\n"
        "--- Active Meal Plan ---\n"
        "{meal_plan}\n"
        "------------------------\n\n"
        "--- Recent Conversation ---\n"
        "{chat_history_context}\n"
        "---------------------------\n\n"
        "--- Context ---\n"
        "{context}\n"
        "---------------\n"
    )

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system_prompt),
            ("human", "{question}"),
        ]
    )

    rag_chain = (
        {
            "context": retriever | format_docs, 
            "question": RunnablePassthrough(), 
            "user_history": lambda x: user_history,
            "meal_plan": lambda x: meal_plan,
            "chat_history_context": lambda x: chat_context
        }
        | prompt
        | llm
        | StrOutputParser()
    )

    # Use ainvoke for async compatibility if possible, or invoke
    response = rag_chain.invoke(query)
    
    # Save Assistant Response
    await save_chat_message(user_email, response, False)
    
    return response
