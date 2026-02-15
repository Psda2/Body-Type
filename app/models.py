from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    disabled: Optional[bool] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    lifestyle: Optional[str] = None
    fitness_level: Optional[str] = None
    goal: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    hashed_password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class Measurement(BaseModel):
    user_email: str
    date: datetime
    gender: str
    weight_kg: float
    height_cm: float
    waist_cm: float
    hip_cm: float
    chest_cm: float
    shoulder_breadth_cm: float
    wrist_cm: float
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_email": "test@example.com",
                "date": "2023-10-01T10:00:00",
                "weight_kg": 75.5,
                "height_cm": 175.0,
                "waist_cm": 85.0,
                "hip_cm": 100.0,
                "chest_cm": 95.0,
                "shoulder_breadth_cm": 40.0,
                "wrist_cm": 16.0
            }
        }

class MealPlan(BaseModel):
    user_email: str
    created_at: datetime
    plan_data: dict
    goal: str
    active: bool = True
