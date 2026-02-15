import asyncio
import sys
import os

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.local_database import meal_plans_collection, get_database
from app.models import MealPlan
from datetime import datetime

async def verify_meal_plans():
    print("Verifying meal plan persistence...")
    
    # Mock data
    user_email = "test@example.com"
    plan_data = {"day_1": {"breakfast": "Oatmeal"}}
    
    # Clean up any existing test data
    await meal_plans_collection.delete_one({"user_email": user_email})
    
    # 1. Simulate saving a plan
    new_plan = {
        "user_email": user_email,
        "created_at": datetime.now().isoformat(),
        "plan_data": plan_data,
        "goal": "Healthy Living",
        "active": True
    }
    
    await meal_plans_collection.insert_one(new_plan)
    print("Meal plan saved.")
    
    # 2. Simulate retrieving current plan
    cursor = await meal_plans_collection.find({"user_email": user_email, "active": True})
    cursor.sort("created_at", -1)
    plans = await cursor.to_list(length=1)
    
    if plans and plans[0]["plan_data"] == plan_data:
        print("SUCCESS: Retrieved correct meal plan.")
    else:
        print("FAILURE: Could not retrieve correct meal plan.")
        print(f"Retrieved: {plans}")

if __name__ == "__main__":
    asyncio.run(verify_meal_plans())
