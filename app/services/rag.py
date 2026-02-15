import json
import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "../../.env"))

# Configure Gemini
# Configure OpenAI
API_KEY = os.getenv("OPENAI_API_KEY")
if API_KEY:
    client = OpenAI(api_key=API_KEY)
else:
    print("Warning: OPENAI_API_KEY not found in environment variables.")
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
    Generates a meal plan using OpenAI based on the profile and retrieved context.
    """
    gender = "female" if profile.get("gender") == 1 else "male"
    
    gender_str = profile.get("gender_str", "male").lower()
    bmi_category = profile.get("bmi_category", "normal")
    somatotype = profile.get("somatotype", "Mesomorph")
    
    context = retrieve_context(gender_str, bmi_category, somatotype)
    
    system_instruction = "You are a professional nutritionist and meal planner specializing in Sri Lankan cuisine."

    # Shuffle options to ensure variety
    import random
    variation_seed = random.randint(1, 10000)
    
    # helper to shuffle list efficiently
    def shuffle_list(lst):
        l = lst.copy()
        random.shuffle(l)
        return l

    # Shuffle the context arrays before putting them in the prompt
    shuffled_breakfast = shuffle_list(context['meal_options'].get('breakfast', []))
    shuffled_lunch = shuffle_list(context['meal_options'].get('lunch', []))
    shuffled_dinner = shuffle_list(context['meal_options'].get('dinner', []))
    shuffled_snacks = shuffle_list(context['snacks'])
    
    # Select a subset to reduce token usage and force rotation (e.g., top 10 after shuffle)
    # This ensures different runs see different "top" options
    user_content = f"""Create a {plan_days}-day meal plan for a user with the following profile:
    - Gender: {gender_str}
    - BMI Category: {bmi_category}
    - Somatotype: {somatotype}
    - Goal: {profile.get('goal', 'healthy living')}
    - Dietary Constraints: {profile.get('dietary_constraints', 'none')}
    - Random Seed: {variation_seed}
    
    INSTRUCTIONS FOR VARIETY:
    1. You MUST generate a DIFFERENT plan than usual. 
    2. Do NOT always pick the first option.
    3. Rotate through the provided options randomly.
    4. You can mix and match side dishes from different options to create new combinations.
    
    Use the following retrieved options as the base ingredients. 
    
    Breakfast Options (Randomized):
    {json.dumps(shuffled_breakfast[:8], indent=2)} 
    
    Lunch Options (Randomized):
    {json.dumps(shuffled_lunch[:8], indent=2)}
    
    Dinner Options (Randomized):
    {json.dumps(shuffled_dinner[:8], indent=2)}
    
    Snack Options (Randomized):
    {json.dumps(shuffled_snacks[:8], indent=2)}
    
    Specific Guidance for {somatotype}:
    {json.dumps(context['guidance'], indent=2)}
    
    OUTPUT FORMAT:
    Return strictly valid JSON with the following structure. 
    IMPORTANT: Break down each meal into "item" (the food name) and "portion" (the quantity/details).
    
    {{
        "meal_plan": {{
            "day_1": {{
                "breakfast": {{ 
                    "main": {{ "item": "Dish Name", "portion": "e.g. Rice: ~200g; Dhal: ~100g" }},
                    "alternative": {{ "item": "Dish Name", "portion": "details..." }}
                }},
                "lunch": {{ 
                    "main": {{ "item": "Dish Name", "portion": "details..." }}, 
                    "alternative": {{ "item": "Dish Name", "portion": "details..." }} 
                }},
                "dinner": {{ 
                    "main": {{ "item": "Dish Name", "portion": "details..." }}, 
                    "alternative": {{ "item": "Dish Name", "portion": "details..." }} 
                }},
                "snacks": {{ 
                    "main": {{ "item": "Dish Name", "portion": "details..." }}, 
                    "alternative": {{ "item": "Dish Name", "portion": "details..." }} 
                }}
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
                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    temperature=0.7, # Increased temperature for variety
                    messages=[
                        {"role": "system", "content": system_instruction},
                        {"role": "user", "content": user_content}
                    ]
                )
                
                # Clean up potential markdown code blocks
                text = response.choices[0].message.content.strip()
                if text.startswith("```json"):
                    text = text[7:]
                if text.endswith("```"):
                    text = text[:-3]
                return json.loads(text)
            except Exception as e:
                error_str = str(e)
                print(f"DEBUG: OpenAI API Error: {error_str}") # Added for debugging
                if "429" in error_str or "rate limit" in error_str.lower():
                    wait_time = 5 * (2 ** attempt)
                    print(f"OpenAI quota exceeded. Retrying in {wait_time} seconds...")
                    time.sleep(wait_time)
                else:
                    print(f"Error calling OpenAI: {e}")
                    break
        
        print("All retries failed. Generating fallback plan locally.")
        return generate_fallback_plan(context, plan_days, somatotype)
    else:
        return {
            "message": "OpenAI API key not configured. Returning raw context.",
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
