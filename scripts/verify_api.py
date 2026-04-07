import requests
import json

BASE_URL = "http://localhost:5000"

def test_health():
    print("Testing Health Endpoint...")
    try:
        r = requests.get(f"{BASE_URL}/health")
        print(f"Status: {r.status_code}, Response: {r.json()}")
    except Exception as e:
        print(f"Failed: {e}")

def test_auth():
    print("\nTesting Auth Flow...")
    payload = {
        "username": "testdoc",
        "email": "doc@test.com",
        "password": "password123",
        "role": "doctor"
    }
    # Register
    r = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
    print(f"Register: {r.status_code}")
    
    # Login
    r = requests.post(f"{BASE_URL}/api/auth/login", json=payload)
    if r.status_code == 200:
        token = r.json()['access_token']
        print(f"Login Success: Token obtained")
        return token
    return None

if __name__ == "__main__":
    test_health()
    # Note: Running these requires the app to be running
    # token = test_auth()
