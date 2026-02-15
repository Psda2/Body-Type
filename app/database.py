# Using local JSON-based database instead of MongoDB Atlas
# This is a temporary solution to bypass DNS/connection issues
from .local_database import users_collection, measurements_collection, meal_plans_collection, chat_history_collection, get_database
