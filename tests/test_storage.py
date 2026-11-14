"""
tests/test_storage.py

Per-user storage: accounts, answers (progress), history and roadmap must work identically with
MongoDB (simulated here by an in-memory fake) and with the local JSON fallback, and one child's
data must never leak to another account.
"""

import os
import sys
import json
import shutil
import tempfile
import unittest
import uuid

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND = os.path.join(BASE_DIR, "backend")
sys.path.insert(0, BACKEND)
sys.path.insert(0, os.path.join(BASE_DIR, "reasoning"))
os.environ["DISABLE_NEURAL_MODEL"] = "1"  # keep the test fast: no embedding model download/load

from core.db import db_instance  # noqa: E402
import core.users as users_mod  # noqa: E402
import core.progress_tracker as progress_mod  # noqa: E402
import core.roadmap_store as roadmap_mod  # noqa: E402


# ---------------------------------------------------------------- minimal in-memory MongoDB
class _Result:
    def __init__(self, matched=0, modified=0):
        self.matched_count = matched
        self.modified_count = modified


def _matches(doc, query):
    for key, cond in (query or {}).items():
        if isinstance(cond, dict) and "$in" in cond:
            if doc.get(key) not in cond["$in"]:
                return False
        elif doc.get(key) != cond:
            return False
    return True


def _project(doc, projection):
    out = dict(doc)
    if projection:
        if all(v == 0 for v in projection.values()):
            for k in projection:
                out.pop(k, None)
        else:
            out = {k: doc[k] for k, v in projection.items() if v and k in doc}
    return out


class FakeCollection:
    def __init__(self):
        self.docs = []

    def create_index(self, *a, **k):
        return None

    def count_documents(self, query):
        return sum(1 for d in self.docs if _matches(d, query))

    def insert_one(self, doc):
        doc.setdefault("_id", uuid.uuid4().hex)
        self.docs.append(doc)

    def insert_many(self, docs):
        for d in docs:
            self.insert_one(dict(d))

    def find_one(self, query, projection=None):
        for d in self.docs:
            if _matches(d, query):
                return _project(d, projection)
        return None

    def find(self, query=None, projection=None):
        return [_project(d, projection) for d in self.docs if _matches(d, query)]

    def update_one(self, query, update, upsert=False):
        for d in self.docs:
            if _matches(d, query):
                for k, v in update.get("$set", {}).items():
                    d[k] = v
                for k, v in update.get("$addToSet", {}).items():
                    d.setdefault(k, [])
                    if v not in d[k]:
                        d[k].append(v)
                return _Result(1, 1)
        if upsert:
            new = {k: v for k, v in query.items() if not isinstance(v, dict)}
            new.update(update.get("$set", {}))
            self.insert_one(new)
            return _Result(0, 0)
        return _Result(0, 0)


class FakeMongo:
    def __init__(self):
        self.cols = {}

    def __getitem__(self, name):
        return self.cols.setdefault(name, FakeCollection())


class StorageTests(unittest.TestCase):
    use_mongo = False

    @classmethod
    def setUpClass(cls):
        # Imported here (not at module level) so merely collecting this file does not load the
        # ontology and disturb test_reasoning.py, which runs its own reasoner in the same process.
        global app_mod
        import app as app_mod  # noqa: E402

    def setUp(self):
        self._saved = (db_instance.use_fallback, db_instance.db, users_mod.USERS_FILE,
                       progress_mod.PROGRESS_FALLBACK_FILE, roadmap_mod.ROADMAP_FILE)
        self.tmp = tempfile.mkdtemp()
        users_mod.USERS_FILE = os.path.join(self.tmp, "users.json")
        progress_mod.PROGRESS_FALLBACK_FILE = os.path.join(self.tmp, "progress.json")
        roadmap_mod.ROADMAP_FILE = os.path.join(self.tmp, "roadmap.json")
        if self.use_mongo:
            db_instance.use_fallback = False
            db_instance.db = FakeMongo()
        else:
            db_instance.use_fallback = True
        self.client = app_mod.app.test_client()

    def tearDown(self):
        (db_instance.use_fallback, db_instance.db, users_mod.USERS_FILE,
         progress_mod.PROGRESS_FALLBACK_FILE, roadmap_mod.ROADMAP_FILE) = self._saved
        shutil.rmtree(self.tmp, ignore_errors=True)

    # ---- helpers
    def _family(self, tag):
        email, pw = f"{tag}@example.test", "test-pass-123"
        r = self.client.post("/api/auth/register", json={
            "parent_name": f"Parent {tag}", "child_name": f"Child{tag}",
            "email": email, "password": pw, "confirm_parent": True, "consent": True})
        self.assertEqual(r.status_code, 201, r.get_data(as_text=True))
        parent_token = self.client.post("/api/auth/login", json={"email": email, "password": pw}).get_json()["access_token"]
        auth = {"Authorization": f"Bearer {parent_token}"}
        child = self.client.get("/api/parents/children", headers=auth).get_json()["children"][0]
        child_token = self.client.post("/api/auth/assume-child", json={"child_id": child["id"]}, headers=auth).get_json()["access_token"]
        return {"parent": auth, "child": {"Authorization": f"Bearer {child_token}"}, "child_id": child["id"]}

    def test_users_progress_history_roadmap_are_per_user(self):
        a, b = self._family("a"), self._family("b")

        # duplicate email is rejected
        dup = self.client.post("/api/auth/register", json={
            "parent_name": "x", "child_name": "y", "email": "a@example.test",
            "password": "test-pass-123", "confirm_parent": True, "consent": True})
        self.assertEqual(dup.status_code, 409)

        # child A answers a Tier 1 question and a Tier 2 turn
        r = self.client.post("/api/evaluate", json={"question_id": "father_01", "response": "Varen appa"}, headers=a["child"])
        self.assertEqual(r.status_code, 200)
        r = self.client.post("/api/tier2/evaluate-turn", json={
            "lesson_id": "t2_friend_00", "turn_id": "turn_1", "response": "En peru Ravi", "retry_count": 0}, headers=a["child"])
        self.assertEqual(r.status_code, 200)

        rows = progress_mod.get_progress(a["child_id"])
        self.assertEqual({row["interaction_id"] for row in rows}, {"father_01", "t2_friend_00:turn_1"})
        self.assertEqual(progress_mod.get_progress("default_user"), [], "answers must not go to a shared 'default_user'")

        # the child sees own totals; the parent sees the linked child; other families see nothing
        own = self.client.get("/api/progress", headers=a["child"]).get_json()
        self.assertEqual(own["total_attempts"], 2)
        self.assertIn("daily", own)
        self.assertEqual(len(own["daily"]), 7)
        self.assertEqual(own["streak_days"], 1)
        via_parent = self.client.get(f"/api/progress?student_id={a['child_id']}", headers=a["parent"]).get_json()
        self.assertEqual(via_parent["total_attempts"], 2)
        other = self.client.get("/api/progress", headers=b["child"]).get_json()
        self.assertEqual(other["total_attempts"], 0)
        self.assertEqual(self.client.get(f"/api/progress?student_id={a['child_id']}", headers=b["parent"]).status_code, 403)
        self.assertEqual(self.client.get("/api/progress").status_code, 401)

        # history: real sessions with the question text and the child's answer
        hist = self.client.get(f"/api/history?student_id={a['child_id']}", headers=a["parent"]).get_json()["sessions"]
        characters = {s["character"] for s in hist}
        self.assertEqual(characters, {"Father", "Friend"})
        father = next(s for s in hist if s["character"] == "Father")
        self.assertEqual(father["exchanges"][0]["question"], "En kooda kadaiki variya?")
        self.assertEqual(father["exchanges"][0]["answer"], "Varen appa")
        self.assertEqual(self.client.get("/api/history", headers=b["child"]).get_json()["sessions"], [])

        # roadmap follows the child: merged on the server, per child
        put = self.client.put("/api/roadmap-progress", json={"progress": {"father": {
            "completedLessons": ["father_01"], "lessonStars": {"father_01": 4}, "tier2Unlocked": False}}}, headers=a["child"])
        self.assertEqual(put.status_code, 200)
        put2 = self.client.put("/api/roadmap-progress", json={"progress": {"father": {
            "completedLessons": ["father_02"], "lessonStars": {"father_01": 2, "father_02": 5}, "tier2Unlocked": False}}}, headers=a["child"])
        merged = put2.get_json()["progress"]["father"]
        self.assertEqual(sorted(merged["completedLessons"]), ["father_01", "father_02"])
        self.assertEqual(merged["lessonStars"], {"father_01": 4, "father_02": 5})
        self.assertEqual(self.client.get("/api/roadmap-progress", headers=b["child"]).get_json()["progress"], {})


class StorageTestsMongo(StorageTests):
    use_mongo = True


class MongoImportTests(unittest.TestCase):
    def test_local_accounts_are_imported_once_when_mongo_is_empty(self):
        tmp = tempfile.mkdtemp()
        saved = (db_instance.use_fallback, db_instance.db)
        try:
            users_file = os.path.join(BASE_DIR, "users.json")
            fake = FakeMongo()
            db_instance.use_fallback, db_instance.db = False, fake
            existing = os.path.exists(users_file)
            if existing:
                db_instance._import_local_users_if_empty()
                count = fake["users"].count_documents({})
                self.assertGreater(count, 0)
                db_instance._import_local_users_if_empty()  # second call must not duplicate
                self.assertEqual(fake["users"].count_documents({}), count)
        finally:
            db_instance.use_fallback, db_instance.db = saved
            shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    unittest.main()
