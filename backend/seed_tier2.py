"""
Seed new Tier 2 lessons into MongoDB.
Run from the backend directory: python seed_tier2.py
"""
import os
import sys
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    import certifi
    import pymongo
    HAS_PYMONGO = True
except ImportError:
    HAS_PYMONGO = False
    print("[Seed] ERROR: pymongo not installed. Run: pip install pymongo certifi")
    sys.exit(1)

MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/")

NEW_LESSONS = [
    os.path.join(os.path.dirname(__file__), "..", "lessons", "tier2", "friend_tier2_02.json"),
    os.path.join(os.path.dirname(__file__), "..", "lessons", "tier2", "father_tier2_02.json"),
    os.path.join(os.path.dirname(__file__), "..", "lessons", "tier2", "stranger_tier2_02.json"),
    os.path.join(os.path.dirname(__file__), "..", "lessons", "tier2", "teacher_tier2_02.json"),
]

def seed():
    try:
        ca = certifi.where()
        client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000, tlsCAFile=ca)
        client.admin.command("ping")
        db = client["dialogue_assistant"]
        collection = db["lessons"]
        print(f"[Seed] Connected to MongoDB at {MONGO_URI}")
    except Exception as e:
        print(f"[Seed] ERROR connecting to MongoDB: {e}")
        sys.exit(1)

    inserted = 0
    updated = 0
    for filepath in NEW_LESSONS:
        filepath = os.path.normpath(filepath)
        if not os.path.exists(filepath):
            print(f"[Seed] WARN: File not found: {filepath}")
            continue
        with open(filepath, encoding="utf-8") as f:
            data = json.load(f)
        lessons = data if isinstance(data, list) else [data]
        for lesson in lessons:
            if "_id" not in lesson and "id" in lesson:
                lesson["_id"] = lesson["id"]
            result = collection.update_one(
                {"id": lesson["id"]},
                {"$set": lesson},
                upsert=True
            )
            if result.upserted_id:
                print(f"  [INSERT] {lesson['id']}")
                inserted += 1
            else:
                print(f"  [UPDATE] {lesson['id']}")
                updated += 1

    print(f"\n[Seed] Done. {inserted} inserted, {updated} updated.")

if __name__ == "__main__":
    seed()
