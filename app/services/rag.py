import json
import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "../../.env"))

# Configure Gemini
API_KEY = os.getenv("GEMINI_API_KEY")
if API_KEY:
    client = genai.Client(api_key=API_KEY)
else:
    print("Warning: GEMINI_API_KEY not found in environment variables.")
    client = None

# Load KB
KB_PATH = os.path.join(os.path.dirname(__file__), "../data/kb.json")
try:
    with open(KB_PATH, 'r', encoding='utf-8') as f:
        KB_DATA = json.load(f)
except FileNotFoundError:
    print(f"Warning: KB file not found at {KB_PATH}")
    KB_DATA = []

def retrieve_context(gender, bmi_category, somatotype):
    """
    Retrieves relevant meal options and guidance from the KB.
    """
    context = {
        "meal_options": {},
        "guidance": [],
        "snacks": []
    }
    
    for entry in KB_DATA:
        filters = entry.get("filters", {})
        entry_type = entry.get("type")
        
        # Meal Options
        if entry_type == "meal_options":
            if (filters.get("gender") == gender and 
                filters.get("bmi_category") == bmi_category):
                meal_time = filters.get("meal_time")
                if meal_time:
                    context["meal_options"][meal_time] = entry.get("options", [])
        
        # Guidance
        elif entry_type == "bodytype_guidance":
            if filters.get("somatotype") == somatotype:
                context["guidance"].extend(entry.get("options", []))
                
        # Snacks
        elif entry_type == "snack_options":
            if filters.get("bmi_category") == bmi_category:
                context["snacks"].extend(entry.get("options", []))
                
    return context

def generate_meal_plan(profile, plan_days=1):
    """
    Generates a meal plan using Gemini based on the profile and retrieved context.
    """
    gender = "female" if profile.get("gender") == 1 else "male"
    
    gender_str = profile.get("gender_str", "male").lower()
    bmi_category = profile.get("bmi_category", "normal")
    somatotype = profile.get("somatotype", "Mesomorph")
    
    context = retrieve_context(gender_str, bmi_category, somatotype)
    
    system_instruction = "You are a professional nutritionist and meal planner specializing in Sri Lankan cuisine."
    
    user_content = f"""Create a {plan_days}-day meal plan for a user with the following profile:
    - Gender: {gender_str}
    - BMI Category: {bmi_category}
    - Somatotype: {somatotype}
    - Goal: {profile.get('goal', 'healthy living')}
    - Dietary Constraints: {profile.get('dietary_constraints', 'none')}
    
    Use the following retrieved options as the PRIMARY source for meals. You can mix and match.
    
    Breakfast Options:
    {json.dumps(context['meal_options'].get('breakfast', []), indent=2)}
    
    Lunch Options:
    {json.dumps(context['meal_options'].get('lunch', []), indent=2)}
    
    Dinner Options:
    {json.dumps(context['meal_options'].get('dinner', []), indent=2)}
    
    Snack Options:
    {json.dumps(context['snacks'], indent=2)}
    
    Specific Guidance for {somatotype}:
    {json.dumps(context['guidance'], indent=2)}
    
    OUTPUT FORMAT:
    Return strictly valid JSON with the following structure:
    {{
        "meal_plan": {{
            "day_1": {{
                "breakfast": {{ "main": "Option 1...", "alternative": "Option 2..." }},
                "lunch": {{ "main": "Option 1...", "alternative": "Option 2..." }},
                "dinner": {{ "main": "Option 1...", "alternative": "Option 2..." }},
                "snacks": {{ "main": "Option 1...", "alternative": "Option 2..." }}
            }},
            ... (up to day_{plan_days})
        }},
        "advice": ["tip 1", "tip 2"]
    }}
    Do not include markdown formatting like ```json. Just the raw JSON string.
    """
    
    if client:
        import time
        for attempt in range(3):
            try:
                response = client.models.generate_content(
                    model='gemini-2.5-flash',
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction
                    ),
                    contents=user_content
                )
                # Clean up potential markdown code blocks
                text = response.text.strip()
                if text.startswith("```json"):
                    text = text[7:]
                if text.endswith("```"):
                    text = text[:-3]
                return json.loads(text)
            except Exception as e:
                error_str = str(e)
                if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                    wait_time = 5 * (2 ** attempt)
                    print(f"Gemini quota exceeded. Retrying in {wait_time} seconds...")
                    time.sleep(wait_time)
                else:
                    print(f"Error calling Gemini: {e}")
                    break
        
        print("All retries failed. Generating fallback plan locally.")
        return generate_fallback_plan(context, plan_days, somatotype)
    else:
        return {
            "message": "Gemini API key not configured. Returning raw context.",
            "context": context
        }

def generate_fallback_plan(context, plan_days, somatotype):
    """
    Generates a basic meal plan by randomly selecting from the context options.
    Used when the AI API is unavailable.
    """
    import random
    
    meal_plan = {}
    
    # Helper to get a random item or default
    def get_random(options, default="Standard meal"):
        return random.choice(options) if options else default
    
    for day in range(1, plan_days + 1):
        day_key = f"day_{day}"
        meal_plan[day_key] = {
            "breakfast": {
                "main": get_random(context['meal_options'].get('breakfast', []), "Rice and curry"),
                "alternative": get_random(context['meal_options'].get('breakfast', []), "Bread and curry")
            },
            "lunch": {
                "main": get_random(context['meal_options'].get('lunch', []), "Rice and curry"),
                "alternative": get_random(context['meal_options'].get('lunch', []), "Fried Rice")
            },
            "dinner": {
                "main": get_random(context['meal_options'].get('dinner', []), "Light meal"),
                "alternative": get_random(context['meal_options'].get('dinner', []), "String hoppers")
            },
            "snacks": {
                "main": get_random(context['snacks'], "Fruit"),
                "alternative": get_random(context['snacks'], "Yogurt")
            }
        }
        
    return {
        "meal_plan": meal_plan,
        "advice": context['guidance'] + ["(Note: This plan was generated automatically due to high server load.)"],
        "source": "fallback_generator"
    }
