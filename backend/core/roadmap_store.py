"""Per-user roadmap progress (completed lessons, stars, Tier 2 unlock).

Stored in MongoDB (`roadmap_progress` collection) when connected, otherwise in a local JSON file,
so a child's roadmap follows them across browsers/devices instead of living only in localStorage.
"""
import json
import os

from core.db import db_instance

ROADMAP_FILE = os.path.join(os.path.dirname(__file__), "..", "..", "datasets", "roadmap_progress.json")


def _load_local():
    if not os.path.exists(ROADMAP_FILE):
        return {}
    try:
        with open(ROADMAP_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def _save_local(data):
    os.makedirs(os.path.dirname(ROADMAP_FILE), exist_ok=True)
    with open(ROADMAP_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def merge_roadmap(a, b):
    """Union of completed lessons, best stars per lesson, Tier 2 unlocked if either side unlocked."""
    merged = {}
    for source in (a or {}, b or {}):
        for character, prog in source.items():
            cur = merged.setdefault(character, {"completedLessons": [], "lessonStars": {}, "tier2Unlocked": False})
            for lesson in prog.get("completedLessons", []):
                if lesson not in cur["completedLessons"]:
                    cur["completedLessons"].append(lesson)
            for lesson, stars in (prog.get("lessonStars") or {}).items():
                cur["lessonStars"][lesson] = max(int(cur["lessonStars"].get(lesson, 0)), int(stars or 0))
            cur["tier2Unlocked"] = bool(cur["tier2Unlocked"] or prog.get("tier2Unlocked") or len(cur["completedLessons"]) >= 5)
    return merged


def get_roadmap(user_id):
    if db_instance.use_fallback:
        return _load_local().get(user_id, {})
    doc = db_instance.db["roadmap_progress"].find_one({"user_id": user_id}, {"_id": 0})
    return (doc or {}).get("progress", {})


def merge_and_save_roadmap(user_id, incoming):
    merged = merge_roadmap(get_roadmap(user_id), incoming)
    if db_instance.use_fallback:
        data = _load_local()
        data[user_id] = merged
        _save_local(data)
    else:
        db_instance.db["roadmap_progress"].update_one(
            {"user_id": user_id}, {"$set": {"user_id": user_id, "progress": merged}}, upsert=True
        )
    return merged
