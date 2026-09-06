import pytest
import json
import os
import sys

# Add backend to path to import app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app import app

from core.auth import create_access_token

@pytest.fixture
def auth_headers():
    token = create_access_token("test_user_id", "user")
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_evaluate_valid_request(client, auth_headers):
    response = client.post('/api/evaluate', json={
        "question_id": "test_q1",
        "response": "Hello"
    }, headers=auth_headers)
    # Might be 404 if question_id isn't in DB, but 422 means validation failed.
    # So we just assert it is NOT 422 or 400 (validation errors).
    assert response.status_code not in [400, 422]

def test_evaluate_missing_question_id(client, auth_headers):
    response = client.post('/api/evaluate', json={
        "response": "Hello"
    }, headers=auth_headers)
    assert response.status_code == 422
    data = response.get_json()
    assert "error" in data
    assert "question_id" in str(data["details"])

def test_evaluate_missing_response(client, auth_headers):
    response = client.post('/api/evaluate', json={
        "question_id": "test_q1"
    }, headers=auth_headers)
    assert response.status_code == 422

def test_evaluate_empty_string_response(client, auth_headers):
    # Empty string response should be valid (app logic handles it)
    response = client.post('/api/evaluate', json={
        "question_id": "test_q1",
        "response": ""
    }, headers=auth_headers)
    assert response.status_code not in [400, 422]

def test_evaluate_wrong_type(client, auth_headers):
    response = client.post('/api/evaluate', json={
        "question_id": 123, # Should be string, but pydantic might coerce. Let's test response type
        "response": {"not": "a string"}
    }, headers=auth_headers)
    assert response.status_code == 422

def test_evaluate_excessively_long_string(client, auth_headers):
    response = client.post('/api/evaluate', json={
        "question_id": "test_q1",
        "response": "a" * 1500
    }, headers=auth_headers)
    assert response.status_code == 422

def test_evaluate_empty_payload(client, auth_headers):
    response = client.post('/api/evaluate', json={}, headers=auth_headers)
    assert response.status_code == 400

def test_tier2_evaluate_turn_valid(client, auth_headers):
    response = client.post('/api/tier2/evaluate-turn', json={
        "lesson_id": "l1",
        "turn_id": "t1",
        "response": "ok",
        "retry_count": 1
    }, headers=auth_headers)
    assert response.status_code not in [400, 422]

def test_tier2_evaluate_turn_missing_fields(client, auth_headers):
    response = client.post('/api/tier2/evaluate-turn', json={
        "lesson_id": "l1"
    }, headers=auth_headers)
    assert response.status_code == 422

def test_tier2_evaluate_turn_invalid_retry_count(client, auth_headers):
    response = client.post('/api/tier2/evaluate-turn', json={
        "lesson_id": "l1",
        "turn_id": "t1",
        "response": "ok",
        "retry_count": -5
    }, headers=auth_headers)
    assert response.status_code == 422
