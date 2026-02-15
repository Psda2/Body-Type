from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from pydantic import BaseModel
from typing import List, Optional
from .services import model
from .services import rag
from .services import chatbot
from .services import vector_store
from .auth import (
    create_access_token,
    get_current_user,
    verify_password,
    get_password_hash,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    users_collection
)
from .database import meal_plans_collection, measurements_collection
from .models import UserCreate, UserInDB, Token, UserBase, MealPlan

app = FastAPI(title="Body Type & Meal Plan API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class BodyMeasurements(BaseModel):
    gender: str # "male" or "female"
    weight_kg: float
    height_cm: float
    waist_cm: float
    hip_cm: float
    chest_cm: float
    shoulder_breadth_cm: float
    wrist_cm: float
    
class MealPlanRequest(BaseModel):
    profile: dict
    plan_days: int = 1

class ChatRequest(BaseModel):
    query: str

@app.get("/")
def root():
    return {"message": "Body Type API is running"}

@app.post("/register", response_model=UserBase)
async def register(user: UserCreate):
    existing_user = await users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    user_dict = user.dict()
    user_dict["hashed_password"] = hashed_password
    del user_dict["password"]
    
    await users_collection.insert_one(user_dict)
    return user_dict

@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    try:
        print(f"Login attempt for: {form_data.username}")
        user = await users_collection.find_one({"email": form_data.username})
        print(f"User found: {user is not None}")
        
        if not user or not verify_password(form_data.password, user["hashed_password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user["email"]}, expires_delta=access_token_expires
        )
        print(f"Token created successfully for {user['email']}")
        return {"access_token": access_token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR in login endpoint: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/users/me", response_model=UserBase)
async def read_users_me(current_user: UserInDB = Depends(get_current_user)):
    return current_user

@app.post("/users/profile")
async def update_user_profile(profile_data: dict, current_user: UserInDB = Depends(get_current_user)):
    try:
        # Filter allowed fields
        allowed_fields = ["full_name", "age", "gender", "lifestyle", "fitness_level", "goal"]
        update_dict = {k: v for k, v in profile_data.items() if k in allowed_fields}
        
        if not update_dict:
            return {"message": "No valid fields provided for update"}
            
        await users_collection.update_one(
            {"email": current_user.email},
            {"$set": update_dict}
        )
        
        return {"message": "Profile updated successfully", "updated_fields": list(update_dict.keys())}
    except Exception as e:
        print(f"Error updating profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/body-type/predict")
async def predict_body_type(data: BodyMeasurements, current_user: UserInDB = Depends(get_current_user)):
    # Convert gender to 0/1 for model
    gender_numeric = 1 if data.gender.lower() == "male" else 0
    
    model_input = data.dict()
    model_input['gender'] = gender_numeric
    
    try:
        result = model.predict_somatotype(model_input)
        
        # Calculate BMI: weight (kg) / (height (m))^2
        height_m = data.height_cm / 100
        bmi = round(data.weight_kg / (height_m ** 2), 1)
        
        # Store measurement in database for history tracking
        from datetime import datetime
        measurement_record = {
            "user_email": current_user.email,
            "date": datetime.now().isoformat(),
            "gender": data.gender,
            "weight_kg": data.weight_kg,
            "height_cm": data.height_cm,
            "waist_cm": data.waist_cm,
            "hip_cm": data.hip_cm,
            "chest_cm": data.chest_cm,
            "shoulder_breadth_cm": data.shoulder_breadth_cm,
            "wrist_cm": data.wrist_cm,
            "bmi": bmi,
            "body_type": result.get("body_type", ""),
            "somatotype": result.get("somatotype", {})
        }
        
        # Save to measurements collection
        from .database import measurements_collection
        await measurements_collection.insert_one(measurement_record)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/measurements/history")
async def get_measurement_history(current_user: UserInDB = Depends(get_current_user)):
    from .database import measurements_collection
    try:
        # LocalDB find is async, need to await it
        cursor = await measurements_collection.find({"user_email": current_user.email})
        cursor.sort("date", -1)
        history = await cursor.to_list(length=100)
        
        # Convert ObjectId to string for JSON serialization
        for item in history:
            item["id"] = str(item["_id"])
            del item["_id"]
            
        return history
    except Exception as e:
        print(f"Error in history: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/meal-plan/generate")
async def generate_meal_plan(request: MealPlanRequest, current_user: UserInDB = Depends(get_current_user)):
    # Check if a recent plan exists (optional, but good for "one time generated")
    # For now, we will always generate a new one if requested, and mark it as active.
    # We could mark old ones as inactive if we wanted, but simple sorting by date works.

    # Ensure gender_str is present in profile for RAG retrieval
    if "gender_str" not in request.profile:
        g = request.profile.get("gender")
        if isinstance(g, str):
            request.profile["gender_str"] = g
        elif g == 1:
            request.profile["gender_str"] = "male"
        else:
            request.profile["gender_str"] = "female"
            
    plan_data = rag.generate_meal_plan(request.profile, request.plan_days)
    
    # Save to database
    from datetime import datetime
    new_plan = {
        "user_email": current_user.email,
        "created_at": datetime.now().isoformat(),
        "plan_data": plan_data,
        "goal": request.profile.get("goal", "Healthy Living"),
        "active": True
    }
    
    await meal_plans_collection.insert_one(new_plan)
    
    return plan_data

@app.get("/meal-plan/current")
async def get_current_meal_plan(current_user: UserInDB = Depends(get_current_user)):
    try:
        # Check if user has measurements first
        history = await measurements_collection.find({"user_email": current_user.email})
        # Use to_list to check if empty
        measurements = await history.to_list(length=1)
        if not measurements:
            return {"message": "No body analysis found. Please complete analysis first.", "plan": None}

        # Find plans for user
        cursor = await meal_plans_collection.find({"user_email": current_user.email, "active": True})
        # Sort by creation date descending
        cursor.sort("created_at", -1)
        plans = await cursor.to_list(length=1)
        
        if not plans:
            return {"message": "No active meal plan found", "plan": None}
            
        return plans[0]["plan_data"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def chat_endpoint(request: ChatRequest, current_user: UserInDB = Depends(get_current_user)):
    try:
        response = await chatbot.get_chat_response(request.query, current_user.email)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/chat/history")
async def get_chat_history_endpoint(current_user: UserInDB = Depends(get_current_user)):
    try:
        history = await chatbot.get_chat_history(current_user.email)
        return {"history": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/documents/ingest")
def ingest_documents_endpoint(current_user: UserInDB = Depends(get_current_user)):
    try:
        result = vector_store.ingest_documents()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/tips/daily")
def get_daily_tips_endpoint(current_user: UserInDB = Depends(get_current_user)):
    try:
        from .services import tips
        daily_tips = tips.get_daily_tips()
        return {"tips": daily_tips}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

