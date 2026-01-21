import pandas as pd
import joblib
import os

# Load the model
MODEL_PATH = os.path.join(os.path.dirname(__file__), "../data/mlr_somatotype_model.pkl")
try:
    model = joblib.load(MODEL_PATH)
except FileNotFoundError:
    print(f"Warning: Model file not found at {MODEL_PATH}")
    model = None

def calculate_bmi(weight_kg, height_cm):
    height_m = height_cm / 100
    return weight_kg / (height_m ** 2)

def get_bmi_category(bmi):
    if bmi < 18.5:
        return "underweight"
    elif 18.5 <= bmi <= 22.9:
        return "normal"
    else:
        return "overweight"

def predict_somatotype(data: dict):
    """
    Predicts somatotype based on input measurements.
    
    Expected keys in data:
    - gender (0 or 1)
    - weight_kg
    - height_cm
    - waist_cm
    - hip_cm
    - chest_cm
    - shoulder_breadth_cm
    - wrist_cm
    """
    if model is None:
        raise Exception("Model not loaded")

    # Feature Engineering
    # Match the logic from body_type.py
    # features = ["gender", "BMI", "WaistHipRatio", "ShoulderWaistRatio", "ChestWaistRatio", "HeightWaistRatio", "FrameIndex"]
    
    gender = data['gender'] # Assumed to be 0 or 1 as per training script
    weight = data['weight_kg']
    height = data['height_cm']
    waist = data['waist_cm']
    hip = data['hip_cm']
    chest = data['chest_cm']
    shoulder = data['shoulder_breadth_cm']
    wrist = data['wrist_cm']
    
    bmi = calculate_bmi(weight, height)
    
    # Ratios
    waist_hip_ratio = waist / hip if hip != 0 else 0
    shoulder_waist_ratio = shoulder / waist if waist != 0 else 0
    chest_waist_ratio = chest / waist if waist != 0 else 0
    height_waist_ratio = height / waist if waist != 0 else 0
    frame_index = height / wrist if wrist != 0 else 0
    
    # Create DataFrame for prediction (order matters!)
    features = [
        "gender",
        "BMI",
        "WaistHipRatio",
        "ShoulderWaistRatio",
        "ChestWaistRatio",
        "HeightWaistRatio",
        "FrameIndex"
    ]
    
    input_df = pd.DataFrame([[
        gender,
        bmi,
        waist_hip_ratio,
        shoulder_waist_ratio,
        chest_waist_ratio,
        height_waist_ratio,
        frame_index
    ]], columns=features)
    
    prediction = model.predict(input_df)[0]
    
    return {
        "somatotype": prediction,
        "bmi": round(bmi, 2),
        "bmi_category": get_bmi_category(bmi),
        "features_used": {
            "BMI": round(bmi, 2),
            "WaistHipRatio": round(waist_hip_ratio, 4),
            "ShoulderWaistRatio": round(shoulder_waist_ratio, 4),
            "ChestWaistRatio": round(chest_waist_ratio, 4),
            "HeightWaistRatio": round(height_waist_ratio, 4),
            "FrameIndex": round(frame_index, 4)
        }
    }
