import os
os.environ["DATABASE_URL"] = "sqlite:///test.db"
os.environ["BETTER_AUTH_SECRET"] = "your-secret-key-here-change-in-production"

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

# Test signup
signup_data = {
    "email": "test@example.com",
    "password": "testpassword123",
    "name": "Test User"
}

response = client.post("/api/auth/signup", json=signup_data)
print("Signup response:", response.status_code)
print("Signup response body:", response.json())

if response.status_code != 201:
    print("Error occurred during signup")