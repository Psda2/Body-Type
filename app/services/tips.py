from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
import os
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from typing import List

# Load env vars
load_dotenv(os.path.join(os.path.dirname(__file__), "../../.env"))

# Check for API Key
if not os.getenv("OPENAI_API_KEY"):
    print("Warning: OPENAI_API_KEY not found in environment variables.")

class TipsList(BaseModel):
    tips: List[str] = Field(description="A list of 5 distinct health or fitness tips")

def get_daily_tips():
    """
    Generates 5 concise health/fitness tips for the day.
    """
    try:
        llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.7)
        
        parser = JsonOutputParser(pydantic_object=TipsList)
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are a helpful fitness and health assistant. Generate 5 distinct, concise, and motivating health/fitness tips for today. Focus on nutrition, exercise, sleep, or mindfulness. Return ONLY a JSON object with a 'tips' key containing a list of strings."),
            ("human", "Give me 5 tips for today."),
        ])
        
        chain = prompt | llm | parser
        
        result = chain.invoke({})
        
        # Ensure we get a list of strings
        if isinstance(result, dict) and "tips" in result:
            return result["tips"]
        elif isinstance(result, list):
            return result
            
        # Fallback if something goes wrong with parsing but we got text
        return [
            "Drink at least 8 glasses of water today to stay hydrated.",
            "Take a 10-minute walk after lunch to aid digestion.",
            "Include a serving of protein in every meal to maintain muscle mass.",
            "Aim for 7-8 hours of quality sleep tonight for better recovery.",
            "Stretch for 5 minutes before bed to relax your muscles."
        ]
        
    except Exception as e:
        print(f"Error generating tips: {e}")
        # Return fallback tips in case of API error
        return [
            "Hydrate well throughout the day.",
            "Prioritize whole foods over processed snacks.",
            "Move your body for at least 30 minutes today.",
            "Practice mindful breathing to reduce stress.",
            "Limit screen time before bed for better sleep."
        ]
