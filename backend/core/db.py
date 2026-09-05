import json
import os
import glob
try:
    from pymongo import MongoClient
    from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
    HAS_PYMONGO = True
except ImportError:
    HAS_PYMONGO = False

# Fallback path relative to this file
LESSONS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "lessons")

class Database:
    def __init__(self):
        self.use_fallback = True
        self.db = None
        self.client = None

        if HAS_PYMONGO:
            try:
                # Import certifi inside the try block to avoid crashing if it's not installed
                try:
                    import certifi
                    ca = certifi.where()
                except ImportError:
                    ca = None

                # Use environment variable for MongoDB Atlas or fallback to local
                mongo_uri = os.environ.get("MONGO_URI", "mongodb://localhost:27017/")
                
                if ca:
                    self.client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000, tlsCAFile=ca)
                else:
                    self.client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
                    
                self.client.admin.command('ping')
                self.db = self.client["dialogue_assistant"]
                self.use_fallback = False
                self._seed_mongodb_if_empty()
                print("[DB] Connected to MongoDB.")
            except (ConnectionFailure, ServerSelectionTimeoutError, Exception) as e:
                print(f"[DB] MongoDB not available ({e}). Using local JSON fallback.")
                self.use_fallback = True
        else:
            print("[DB] pymongo not installed. Using local JSON fallback.")

    def _seed_mongodb_if_empty(self):
        """Seed MongoDB with JSON files, upserting to ensure latest lessons."""
        collection = self.db["lessons"]
        print("[DB] Seeding/Updating MongoDB with JSON lessons...")
        for root, _, files in os.walk(LESSONS_DIR):
            for file in files:
                if file.endswith(".json"):
                    filepath = os.path.join(root, file)
                    try:
                        with open(filepath, "r", encoding="utf-8") as f:
                            data = json.load(f)
                            
                            # Handle both single lesson (dict) and array of lessons (list)
                            lessons_to_insert = data if isinstance(data, list) else [data]
                            
                            for lesson_data in lessons_to_insert:
                                if "_id" not in lesson_data and "id" in lesson_data:
                                    lesson_data["_id"] = lesson_data["id"]
                                
                                # Ensure tier is set correctly based on folder structure or default to 2 if not present
                                if "tier" not in lesson_data:
                                    lesson_data["tier"] = 1 if "tier1" in filepath else 2
                                    
                                try:
                                    collection.update_one({"id": lesson_data["id"]}, {"$set": lesson_data}, upsert=True)
                                except Exception as e:
                                    print(f"[DB] Upsert error for {lesson_data.get('id')}: {e}")
                    except Exception as e:
                        print(f"[DB] Error loading {filepath}: {e}")

    def get_tier2_lessons_by_character(self, character):
        lessons = []
        if not self.use_fallback:
            try:
                docs = self.db["lessons"].find({"character": character, "tier": 2})
                for d in docs:
                    lessons.append(d)
                return lessons
            except Exception:
                pass # fallback
        
        # Fallback to local JSON
        for root, _, files in os.walk(LESSONS_DIR):
            for file in files:
                if file.endswith(".json"):
                    filepath = os.path.join(root, file)
                    try:
                        with open(filepath, "r", encoding="utf-8") as f:
                            lesson_data = json.load(f)
                            if lesson_data.get("character") == character and lesson_data.get("tier") == 2:
                                lessons.append(lesson_data)
                    except Exception:
                        continue
        return lessons

    def get_tier2_lesson(self, lesson_id):
        if not self.use_fallback:
            try:
                doc = self.db["lessons"].find_one({"id": lesson_id})
                if doc:
                    return doc
            except Exception:
                pass # fallback
                
        # Fallback
        for root, _, files in os.walk(LESSONS_DIR):
            for file in files:
                if file.endswith(".json"):
                    filepath = os.path.join(root, file)
                    try:
                        with open(filepath, "r", encoding="utf-8") as f:
                            lesson_data = json.load(f)
                            if lesson_data.get("id") == lesson_id:
                                return lesson_data
                    except Exception:
                        continue
        return None

# Singleton DB instance
db_instance = Database()

def get_tier2_lessons_for_character(character):
    return db_instance.get_tier2_lessons_by_character(character)

def get_tier2_lesson_by_id(lesson_id):
    return db_instance.get_tier2_lesson(lesson_id)
