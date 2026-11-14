"""Quick check: is MongoDB connected, and what is stored?  Run:  python backend/check_db.py

Prints only counts and the database name - never the connection string or any password.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.db import db_instance  # noqa: E402

if db_instance.use_fallback:
    print("MongoDB: NOT connected -> using local JSON files (users.json, datasets/*.json).")
    print("Set MONGO_URI in .env (see .env.example), make sure the Atlas cluster is running and your IP is allowed.")
else:
    db = db_instance.db
    print(f"MongoDB: connected (database '{db.name}')")
    for name in ("users", "progress", "roadmap_progress", "lessons"):
        print(f"  {name:18} {db[name].count_documents({})} documents")
