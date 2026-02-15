import requests
from app.auth import create_access_token
from datetime import timedelta

# Configuration
API_URL = "http://localhost:8000"
USER_EMAIL = "test@example.com"

# Generate Token (Client-side simulation)
access_token_expires = timedelta(minutes=30)
token = create_access_token(
    data={"sub": USER_EMAIL}, expires_delta=access_token_expires
)
headers = {"Authorization": f"Bearer {token}"}

def test_chat_history():
    print(f"Testing Chat with User: {USER_EMAIL}")
    
    # Query about history
    query = "How has my weight changed over time? Am I losing weight?"
    print(f"\nQuery: '{query}'")
    
    try:
        response = requests.post(
            f"{API_URL}/chat",
            json={"query": query},
            headers=headers
        )
        
        if response.status_code == 200:
            print("Chat Status: 200 OK")
            print(f"Response:\n{response.json()['response']}")
        else:
            print(f"Chat Failed: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_chat_history()
