import json
import os
from core.db import db_instance
import datetime

PROGRESS_FALLBACK_FILE = os.path.join(os.path.dirname(__file__), "..", "..", "datasets", "progress_fallback.json")

def _load_fallback():
    if not os.path.exists(PROGRESS_FALLBACK_FILE):
        return []
    try:
        with open(PROGRESS_FALLBACK_FILE, "r", encoding="utf-8") as file:
            return json.load(file)
    except Exception:
        return []

def _save_fallback(data):
    os.makedirs(os.path.dirname(PROGRESS_FALLBACK_FILE), exist_ok=True)
    with open(PROGRESS_FALLBACK_FILE, "w", encoding="utf-8") as file:
        json.dump(data, file, indent=4)

def get_progress(user_id=None):
    if db_instance.use_fallback:
        all_progress = _load_fallback()
        if user_id:
            return [p for p in all_progress if p.get("user_id") == user_id]
        return all_progress
    else:
        collection = db_instance.db["progress"]
        query = {"user_id": user_id} if user_id else {}
        cursor = collection.find(query, {"_id": 0})
        return list(cursor)

def save_progress(user_id, interaction_id, response, correct, stars, tier=1):
    doc = {
        "user_id": user_id,
        "interaction_id": str(interaction_id),
        "response": response,
        "correct": str(correct),
        "stars": str(stars),
        "tier": tier,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }
    
    if db_instance.use_fallback:
        progress = _load_fallback()
        updated = False
        for p in progress:
            if p.get("user_id") == user_id and p.get("interaction_id") == str(interaction_id) and p.get("tier") == tier:
                p.update(doc)
                updated = True
                break
        if not updated:
            progress.append(doc)
        _save_fallback(progress)
    else:
        collection = db_instance.db["progress"]
        collection.update_one(
            {
                "user_id": user_id, 
                "interaction_id": str(interaction_id),
                "tier": tier
            },
            {"$set": doc},
            upsert=True
        )

def calculate_total_stars(user_id):
    progress = get_progress(user_id)
    return sum(int(row.get("stars", 0)) for row in progress)

def calculate_accuracy(user_id):
    progress = get_progress(user_id)
    if not progress:
        return 0
    correct_count = sum(1 for row in progress if str(row.get("correct", "")).lower() == "true")
    return (correct_count / len(progress)) * 100
