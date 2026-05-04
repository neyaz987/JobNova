import requests
import json

BASE_URL = "http://127.0.0.1:8000/api/v1"

def test_phase1_features():
    # 1. Login as Admin (assuming 'admin@example.com' exists or using token from previous context)
    # Since I don't have the token here, I'll just check if the code compiles and endpoints exist in the router by calling them and expecting 401/403 instead of 404
    
    endpoints_to_check = [
        "/admin/jobs/pending",
        "/admin/reports",
        "/notifications/"
    ]
    
    for ep in endpoints_to_check:
        response = requests.get(f"{BASE_URL}{ep}")
        print(f"Checking {ep}: Status {response.status_code}")
        # Expected status: 401 (Unauthorized) if not logged in, 200 if logged in. 
        # Crucially NOT 404.
        if response.status_code == 404:
            print(f"ERROR: Endpoint {ep} not found!")
        else:
            print(f"DEBUG: Endpoint {ep} is registered.")

if __name__ == "__main__":
    try:
        test_phase1_features()
    except Exception as e:
        print(f"Test failed: {e}")
