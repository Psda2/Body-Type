import requests
import sys

BASE_URL = "http://127.0.0.1:8000"
USER_EMAIL = "test@example.com"
USER_PASSWORD = "password123"

def get_auth_token():
    url = f"{BASE_URL}/token"
    # Content-Type: application/x-www-form-urlencoded
    data = {
        "username": USER_EMAIL,
        "password": USER_PASSWORD
    }
    try:
        response = requests.post(url, data=data)
        if response.status_code == 200:
            token = response.json().get("access_token")
            print(f"Login Successful. Token: {token[:10]}...")
            return token
        else:
            print(f"Login Failed: {response.status_code} - {response.text}")
            return None
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the API. Make sure it's running!")
        return None

def test_protected_endpoints(token):
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Test Ingestion
    print("\nTesting Ingestion (Protected)...")
    try:
        # Note: Ingestion might be slow or already done
        response = requests.post(f"{BASE_URL}/documents/ingest", headers=headers)
        print(f"Ingestion Status: {response.status_code}")
        print(f"Ingestion Response: {response.json()}")
    except Exception as e:
        print(f"Ingestion Test Error: {e}")

    # 2. Test Chat
    print("\nTesting Chat with Query: 'What is Metabolic Confusion?' (Protected)...")
    try:
        data = {"query": "What is Metabolic Confusion?"}
        response = requests.post(f"{BASE_URL}/chat", headers=headers, json=data)
        print(f"Chat Status: {response.status_code}")
        print(f"Chat Response: {response.json()}")
    except Exception as e:
        print(f"Chat Test Error: {e}")

if __name__ == "__main__":
    print("Assuming API is running on localhost:8000...")
    token = get_auth_token()
    if token:
        test_protected_endpoints(token)
    else:
        print("Skipping tests due to login failure.")

