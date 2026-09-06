import pytest
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app import app
from core.users import _save_local_users
from core.progress_tracker import _save_fallback

@pytest.fixture
def client():
    app.config["TESTING"] = True
    _save_local_users([])
    _save_fallback([])
    
    with app.test_client() as client:
        yield client
        
    _save_local_users([])
    _save_fallback([])

def get_token(client, email, password):
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    return res.get_json().get("access_token")

@pytest.fixture
def users_setup(client):
    client.post("/api/auth/register", json={"email": "student1@example.com", "password": "password", "role": "student"})
    client.post("/api/auth/register", json={"email": "student2@example.com", "password": "password", "role": "student"})
    client.post("/api/auth/register", json={"email": "parent1@example.com", "password": "password", "role": "parent"})
    
    return {
        "student1": get_token(client, "student1@example.com", "password"),
        "student2": get_token(client, "student2@example.com", "password"),
        "parent1": get_token(client, "parent1@example.com", "password"),
    }

def test_parent_link_child_success(client, users_setup):
    res = client.post("/api/parents/link-child", json={"child_email": "student1@example.com"}, headers={"Authorization": f"Bearer {users_setup['parent1']}"})
    assert res.status_code == 200
    
    res2 = client.get("/api/parents/children", headers={"Authorization": f"Bearer {users_setup['parent1']}"})
    assert res2.status_code == 200
    children = res2.get_json()["children"]
    assert len(children) == 1
    assert children[0]["email"] == "student1@example.com"
    return children[0]["id"]

def test_parent_link_invalid_child(client, users_setup):
    res = client.post("/api/parents/link-child", json={"child_email": "notexists@example.com"}, headers={"Authorization": f"Bearer {users_setup['parent1']}"})
    assert res.status_code == 400

def test_parent_fetch_progress_linked(client, users_setup):
    # Link child
    client.post("/api/parents/link-child", json={"child_email": "student1@example.com"}, headers={"Authorization": f"Bearer {users_setup['parent1']}"})
    
    # Get student id
    res = client.get("/api/parents/children", headers={"Authorization": f"Bearer {users_setup['parent1']}"})
    student_id = res.get_json()["children"][0]["id"]
    
    # Student makes progress
    client.post("/api/evaluate", json={"question_id": "father_01", "response": "ok"}, headers={"Authorization": f"Bearer {users_setup['student1']}"})
    
    # Parent fetches progress
    res_prog = client.get(f"/api/progress?student_id={student_id}", headers={"Authorization": f"Bearer {users_setup['parent1']}"})
    assert res_prog.status_code == 200
    data = res_prog.get_json()
    assert data["total_attempts"] == 1

def test_parent_fetch_progress_unlinked(client, users_setup):
    # Assume student2 is NOT linked to parent1
    # We need student2's ID. Let's log in as student2 to get it? Actually we can't easily get it here, but we can pass a fake ID
    res = client.get("/api/progress?student_id=fake-id", headers={"Authorization": f"Bearer {users_setup['parent1']}"})
    assert res.status_code == 403
    
def test_student_fetch_own_progress(client, users_setup):
    client.post("/api/evaluate", json={"question_id": "father_01", "response": "ok"}, headers={"Authorization": f"Bearer {users_setup['student1']}"})
    res = client.get("/api/progress", headers={"Authorization": f"Bearer {users_setup['student1']}"})
    assert res.status_code == 200
    assert res.get_json()["total_attempts"] == 1
