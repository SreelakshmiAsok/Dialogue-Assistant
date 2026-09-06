import os
import json
import uuid
from werkzeug.security import generate_password_hash
from core.db import db_instance

USERS_FILE = os.path.join(os.path.dirname(__file__), "..", "..", "users.json")

def _load_local_users():
    if not os.path.exists(USERS_FILE):
        return []
    with open(USERS_FILE, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []

def _save_local_users(users):
    with open(USERS_FILE, "w", encoding="utf-8") as f:
        json.dump(users, f, indent=4)

def create_user(email, password, role="student", name=""):
    user_id = str(uuid.uuid4())
    hashed_password = generate_password_hash(password)
    
    user_doc = {
        "id": user_id,
        "email": email,
        "name": name,
        "password_hash": hashed_password,
        "role": role
    }
    if role == "parent":
        user_doc["children_ids"] = []

    if db_instance.use_fallback:
        users = _load_local_users()
        # Check if exists
        for u in users:
            if u["email"] == email:
                return None # User exists
        users.append(user_doc)
        _save_local_users(users)
        return user_doc
    else:
        collection = db_instance.db["users"]
        existing = collection.find_one({"email": email})
        if existing:
            return None
        collection.insert_one(user_doc)
        # Remove MongoDB _id for return
        user_doc.pop("_id", None)
        return user_doc

def get_user_by_email(email):
    if db_instance.use_fallback:
        users = _load_local_users()
        for u in users:
            if u["email"] == email:
                return u
        return None
    else:
        collection = db_instance.db["users"]
        return collection.find_one({"email": email})

def get_user_by_id(user_id):
    if db_instance.use_fallback:
        users = _load_local_users()
        for u in users:
            if u["id"] == user_id:
                return u
        return None
    else:
        collection = db_instance.db["users"]
        return collection.find_one({"id": user_id})

def link_child_to_parent(parent_id, child_email):
    child = get_user_by_email(child_email)
    if not child or child.get("role") != "student":
        return {"error": "Child not found or is not a student"}
    
    child_id = child["id"]
    
    if db_instance.use_fallback:
        users = _load_local_users()
        for u in users:
            if u["id"] == parent_id:
                if "children_ids" not in u:
                    u["children_ids"] = []
                if child_id not in u["children_ids"]:
                    u["children_ids"].append(child_id)
                _save_local_users(users)
                return {"success": True}
        return {"error": "Parent not found"}
    else:
        collection = db_instance.db["users"]
        res = collection.update_one(
            {"id": parent_id},
            {"$addToSet": {"children_ids": child_id}}
        )
        if res.modified_count > 0 or res.matched_count > 0:
            return {"success": True}
        return {"error": "Parent not found"}

def get_children_for_parent(parent_id):
    parent = get_user_by_id(parent_id)
    if not parent:
        return []
    
    children_ids = parent.get("children_ids", [])
    if not children_ids:
        return []
        
    children = []
    if db_instance.use_fallback:
        users = _load_local_users()
        for u in users:
            if u["id"] in children_ids:
                children.append({"id": u["id"], "email": u["email"], "name": u.get("name", "")})
    else:
        collection = db_instance.db["users"]
        cursor = collection.find({"id": {"$in": children_ids}}, {"id": 1, "email": 1, "name": 1, "_id": 0})
        for c in cursor:
            children.append(c)
            
    return children

