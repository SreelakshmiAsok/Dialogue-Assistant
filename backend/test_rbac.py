import pytest
import os
import sys

# Add backend to path to import app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app import app
from core.users import _save_local_users, create_user
from core.auth import create_access_token

@pytest.fixture
def client():
    app.config["TESTING"] = True
    _save_local_users([])
    
    # Create an admin user for testing since it can't be created via /register
    create_user("admin@example.com", "password", role="admin")
    
    with app.test_client() as client:
        yield client
        
    _save_local_users([])

def get_token(client, email, password):
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    return res.get_json().get("access_token")

@pytest.fixture
def student_token(client):
    client.post("/api/auth/register", json={"email": "student@example.com", "password": "password", "role": "student"})
    return get_token(client, "student@example.com", "password")

@pytest.fixture
def parent_token(client):
    client.post("/api/auth/register", json={"email": "parent@example.com", "password": "password", "role": "parent"})
    return get_token(client, "parent@example.com", "password")

@pytest.fixture
def admin_token(client):
    return get_token(client, "admin@example.com", "password")

def test_student_accessing_student_endpoint(client, student_token):
    res = client.post("/api/evaluate", json={"question_id": "q1", "response": "ok"}, headers={"Authorization": f"Bearer {student_token}"})
    assert res.status_code != 403
    assert res.status_code != 401

def test_parent_accessing_parent_endpoint(client, parent_token):
    res = client.get("/api/progress", headers={"Authorization": f"Bearer {parent_token}"})
    assert res.status_code == 200

def test_admin_accessing_admin_endpoint(client, admin_token):
    res = client.get("/api/admin/system", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    
def test_student_accessing_admin_endpoint(client, student_token):
    res = client.get("/api/admin/system", headers={"Authorization": f"Bearer {student_token}"})
    assert res.status_code == 403
    
def test_parent_accessing_admin_endpoint(client, parent_token):
    res = client.get("/api/admin/system", headers={"Authorization": f"Bearer {parent_token}"})
    assert res.status_code == 403

def test_unauthenticated_request(client):
    res = client.get("/api/progress")
    assert res.status_code == 401
    
def test_register_role_manipulation(client):
    # Try to register as admin
    res = client.post("/api/auth/register", json={"email": "hacker@example.com", "password": "password", "role": "admin"})
    assert res.status_code == 422 # Pydantic validation fails because role not in Literal
    
def test_register_invalid_role(client):
    res = client.post("/api/auth/register", json={"email": "hacker2@example.com", "password": "password", "role": "hacker"})
    assert res.status_code == 422
