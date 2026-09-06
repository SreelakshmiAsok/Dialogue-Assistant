import pytest
import os
import sys
import json
import uuid

# Add backend to path to import app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app import app
from core.users import _save_local_users, _load_local_users
from core.auth import create_access_token

@pytest.fixture
def client():
    app.config["TESTING"] = True
    
    # Clear local users for clean test
    _save_local_users([])
    
    with app.test_client() as client:
        yield client
        
    _save_local_users([])

def test_register_valid(client):
    res = client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "password123"
    })
    assert res.status_code == 201
    
def test_register_duplicate(client):
    client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "password123"
    })
    res = client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "password123"
    })
    assert res.status_code == 409
    
def test_login_valid(client):
    client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "password123"
    })
    res = client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "password123"
    })
    assert res.status_code == 200
    data = res.get_json()
    assert "access_token" in data
    
def test_login_invalid_password(client):
    client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "password123"
    })
    res = client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "wrongpassword"
    })
    assert res.status_code == 401
    
def test_login_unknown_user(client):
    res = client.post("/api/auth/login", json={
        "email": "unknown@example.com",
        "password": "password123"
    })
    assert res.status_code == 401

def test_missing_auth_header(client):
    res = client.post("/api/evaluate", json={
        "question_id": "q1",
        "response": "ok"
    })
    assert res.status_code == 401
    assert "Missing Authorization header" in res.get_json()["error"]
    
def test_malformed_token(client):
    res = client.post("/api/evaluate", json={
        "question_id": "q1",
        "response": "ok"
    }, headers={"Authorization": "Bearer not.a.valid.token"})
    assert res.status_code == 401
    assert "Invalid or expired token" in res.get_json()["error"]
    
def test_valid_token_protected_endpoint(client):
    token = create_access_token("test_id", "user")
    res = client.post("/api/evaluate", json={
        "question_id": "q1",
        "response": "ok"
    }, headers={"Authorization": f"Bearer {token}"})
    # Will fail validation because question_id is not in DB (404), but auth will pass (not 401)
    assert res.status_code != 401
