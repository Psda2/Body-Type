import json
import os
from typing import Optional, Dict, Any

# Simple JSON file-based database
DB_FILE = os.path.join(os.path.dirname(__file__), "../local_db.json")

def _load_db():
    """Load database from JSON file"""
    if not os.path.exists(DB_FILE):
        return {"users": [], "measurements": []}
    with open(DB_FILE, 'r') as f:
        return json.load(f)

def _save_db(data):
    """Save database to JSON file"""
    with open(DB_FILE, 'w') as f:
        json.dump(data, f, indent=2)

class LocalCollection:
    """Simple collection that mimics MongoDB collection interface"""
    
    def __init__(self, collection_name: str):
        self.collection_name = collection_name
    
    async def find_one(self, query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Find one document matching the query"""
        db = _load_db()
        collection = db.get(self.collection_name, [])
        
        for doc in collection:
            match = True
            for key, value in query.items():
                if doc.get(key) != value:
                    match = False
                    break
            if match:
                return doc
        return None
    
    async def find(self, query: Dict[str, Any]) -> 'SimpleCursor':
        """Find all documents matching the query"""
        db = _load_db()
        collection = db.get(self.collection_name, [])
        
        results = []
        for doc in collection:
            match = True
            for key, value in query.items():
                if doc.get(key) != value:
                    match = False
                    break
            if match:
                results.append(doc)
        
        # Return a cursor-like object that supports to_list, sort, and limit
        return SimpleCursor(results)
    
    async def insert_one(self, document: Dict[str, Any]):
        """Insert a document"""
        db = _load_db()
        if self.collection_name not in db:
            db[self.collection_name] = []
        
        # Add a simple ID if not present
        if "_id" not in document:
            document["_id"] = str(len(db[self.collection_name]) + 1)
        
        db[self.collection_name].append(document)
        _save_db(db)
        return document
    
    async def update_one(self, query: Dict[str, Any], update: Dict[str, Any]):
        """Update one document"""
        db = _load_db()
        collection = db.get(self.collection_name, [])
        
        for i, doc in enumerate(collection):
            match = True
            for key, value in query.items():
                if doc.get(key) != value:
                    match = False
                    break
            if match:
                # Apply update
                if "$set" in update:
                    doc.update(update["$set"])
                collection[i] = doc
                _save_db(db)
                return
    
    async def delete_one(self, query: Dict[str, Any]):
        """Delete one document"""
        db = _load_db()
        collection = db.get(self.collection_name, [])
        
        for i, doc in enumerate(collection):
            match = True
            for key, value in query.items():
                if doc.get(key) != value:
                    match = False
                    break
            if match:
                collection.pop(i)
                db[self.collection_name] = collection
                _save_db(db)
                return


class SimpleCursor:
    """Cursor-like object that mimics MongoDB cursor interface"""
    
    def __init__(self, data):
        self.data = data
        self._sort_field = None
        self._sort_direction = 1
        self._limit_count = None
    
    def sort(self, field: str, direction: int = 1):
        """Sort the results by a field. Direction: 1 for ascending, -1 for descending"""
        self._sort_field = field
        self._sort_direction = direction
        return self
    
    def limit(self, count: int):
        """Limit the number of results"""
        self._limit_count = count
        return self
    
    async def to_list(self, length=None):
        """Convert cursor to list with applied sort and limit"""
        results = self.data.copy()
        
        # Apply sorting if specified
        if self._sort_field:
            try:
                results.sort(
                    key=lambda x: x.get(self._sort_field, ''),
                    reverse=(self._sort_direction == -1)
                )
            except:
                pass  # If sorting fails, just return unsorted
        
        # Apply limit
        if self._limit_count is not None:
            results = results[:self._limit_count]
        elif length is not None:
            results = results[:length]
        
        return results


# Create collections
users_collection = LocalCollection("users")
measurements_collection = LocalCollection("measurements")
meal_plans_collection = LocalCollection("meal_plans")
chat_history_collection = LocalCollection("chat_history")

def get_database():
    """Return a mock database object"""
    return {
        "users": users_collection,
        "measurements": measurements_collection,
        "meal_plans": meal_plans_collection,
        "chat_history": chat_history_collection
    }
