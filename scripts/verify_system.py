import sys
import os
import json

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services import model
from app.services import rag

def test_model():
    print("Testing Model Prediction...")
    data = {
        "gender": 1, # Male
        "weight_kg": 75,
        "height_cm": 175,
        "waist_cm": 80,
        "hip_cm": 95,
        "chest_cm": 100,
        "shoulder_breadth_cm": 45,
        "wrist_cm": 16
    }
    try:
        result = model.predict_somatotype(data)
        print("Model Result:", json.dumps(result, indent=2))
    except Exception as e:
        print(f"Model Error: {e}")

def test_rag():
    print("\nTesting RAG Retrieval...")
    # Mock profile
    profile = {
        "gender_str": "male",
        "bmi_category": "normal",
        "somatotype": "Mesomorph",
        "goal": "muscle gain"
    }
    
    # Test retrieval only first
    context = rag.retrieve_context("male", "normal", "Mesomorph")
    print(f"Retrieved {len(context['meal_options'])} meal categories.")
    print(f"Retrieved {len(context['guidance'])} guidance items.")
    
    # Test Generation (will fail if no API key, but logic runs)
    print("\nTesting Gemini Generation (Check for API Key)...")
    plan = rag.generate_meal_plan(profile, plan_days=1)
    print("Generated Plan:", json.dumps(plan, indent=2))

if __name__ == "__main__":
    test_model()
    test_rag()
