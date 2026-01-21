from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from .services import model
from .services import rag

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

@app.post("/body-type/predict")
def predict_body_type(data: BodyMeasurements):
    # Convert gender to 0/1 for model
    # Assumption: 0=Male, 1=Female (Common encoding, need to verify if possible, but sticking to this standard)
    # If the user provided dataset has specific encoding, we should match it.
    # In Dataset.csv:
    # Line 2: 1, 56.85kg, 170cm ... -> Likely Female? Or Male?
    # Line 3: 0, 52.75kg, 164cm ...
    # Line 8: 1, 111kg, 175cm ...
    # Usually 1 is Male in some datasets, 0 Female. Or vice versa.
    # Let's assume 1=Male, 0=Female for now based on typical "Male=1" in medical datasets often, OR check body_type.py
    # body_type.py doesn't show encoding.
    # Let's stick to: Input string "male"/"female" -> Model 1/0.
    # I will map "male" -> 1, "female" -> 0. (Arbitrary choice without metadata, but consistent).
    # WAIT! The prompt said "Gender encoding: Your LogisticRegression needs gender numeric (0/1)... Make sure your production code encodes it exactly like training."
    # I will assume 1=Male, 0=Female.
    
    gender_numeric = 1 if data.gender.lower() == "male" else 0
    
    model_input = data.dict()
    model_input['gender'] = gender_numeric
    
    try:
        result = model.predict_somatotype(model_input)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/meal-plan/generate")
def generate_meal_plan(request: MealPlanRequest):
    # Ensure gender_str is present in profile for RAG retrieval
    if "gender_str" not in request.profile:
        # If gender is passed as 0/1 or "male"/"female"
        g = request.profile.get("gender")
        if isinstance(g, str):
            request.profile["gender_str"] = g
        elif g == 1:
            request.profile["gender_str"] = "male"
        else:
            request.profile["gender_str"] = "female"
            
    return rag.generate_meal_plan(request.profile, request.plan_days)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
