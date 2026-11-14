# ============================================================
# FLASK APP — Social Skills Dialogue Assistant
# For autistic children
# ============================================================

import os
import sys

# Ensure backend and reasoning directories are always in sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
root_dir = os.path.dirname(backend_dir)
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)
reasoning_path = os.path.join(root_dir, "reasoning")
if reasoning_path not in sys.path:
    sys.path.insert(0, reasoning_path)

from flask import Flask, render_template, request, jsonify, send_file
from flask_cors import CORS
import subprocess
import hashlib
import datetime
from core.db import get_tier2_lessons_for_character, get_tier2_lesson_by_id
from engines.tier2_engine import evaluate_tier2_turn

from data.questions import (
    get_all_characters,
    get_questions_for_character,
    get_question_by_id
)
from engines.rule_engine import check_pragmatics
from engines.semantic_engine import combined_similarity, semantic_match
from nlp.bad_words_filter import check_inappropriate
from engines.feedback_engine import generate_feedback, calculate_stars
from engines.sentiment_engine import analyze_sentiment
from nlp.preprocessing import normalize_text
from core.progress_tracker import save_progress, get_progress
from nlp.transliterate_tamil import to_tanglish
from nlp.tanglish_tts_helper import tanglish_resolver
from data.tier1_tamil import story_tamil, feedback_tamil as t1_feedback_tamil
from core.roadmap_store import get_roadmap, merge_and_save_roadmap
import re
import sys
from pydantic import ValidationError
from schemas.requests import EvaluateRequest, Tier2EvaluateTurnRequest, LinkChildRequest
from schemas.auth import RegisterRequest, LoginRequest, AssumeChildRequest
from core.users import create_user, get_user_by_email, get_user_by_id, link_child_to_parent, get_children_for_parent
from core.auth import create_access_token, verify_access_token, require_auth, require_roles
from werkzeug.security import check_password_hash

# Ensure reasoning package is accessible
reasoning_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'reasoning')
if reasoning_path not in sys.path:
    sys.path.append(reasoning_path)
from reasoner import SocialOntologyReasoner

# Initialize global reasoner
ontology_reasoner = SocialOntologyReasoner()

def has_tamil(text):
    return bool(re.search(r'[\u0B80-\u0BFF]', text))

app = Flask(__name__)
CORS(app)


# ============================================================
# PAGES
# ============================================================

@app.route("/")
def index():
    """Serve the main application page."""
    return render_template("index.html")


# ============================================================
# AUTH ENDPOINTS
# ============================================================

@app.route("/api/auth/register", methods=["POST"])
def api_auth_register():
    """Register a new parent and their child."""
    data = request.get_json(force=True)
    if not data:
        return jsonify({"error": "No data provided"}), 400
    try:
        validated_data = RegisterRequest.model_validate(data)
    except ValidationError as e:
        return jsonify({"error": "Validation Error", "details": e.errors()}), 422
    except Exception as e:
        return jsonify({"error": str(e)}), 400

    parent_user = create_user(validated_data.email, validated_data.password, role="parent", name=validated_data.parent_name)
    if not parent_user:
        return jsonify({"error": "User with this email already exists"}), 409

    import uuid
    import random
    import string

    # Create child user
    random_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
    child_email = f"{validated_data.child_name.lower().replace(' ', '')}_{random_suffix}@navil.com"
    child_password = str(uuid.uuid4()) # child doesn't log in directly

    child_user = create_user(child_email, child_password, role="student", name=validated_data.child_name)

    if child_user:
        link_child_to_parent(parent_user["id"], child_email)

    return jsonify({"message": "Parent and child registered successfully"}), 201


@app.route("/api/auth/login", methods=["POST"])
def api_auth_login():
    """Login and receive a JWT token."""
    data = request.get_json(force=True)
    if not data:
        return jsonify({"error": "No data provided"}), 400
    try:
        validated_data = LoginRequest.model_validate(data)
    except ValidationError as e:
        return jsonify({"error": "Validation Error", "details": e.errors()}), 422
    except Exception as e:
        return jsonify({"error": str(e)}), 400

    user = get_user_by_email(validated_data.email)
    if not user or not check_password_hash(user["password_hash"], validated_data.password):
        return jsonify({"error": "Invalid email or password"}), 401

    token = create_access_token(user["id"], user["role"])
    return jsonify({
        "access_token": token,
        "token": token,
        "role": user["role"],
        "name": user.get("name", "")
    }), 200


@app.route("/api/auth/assume-child", methods=["POST"])
@require_roles("parent")
def api_auth_assume_child():
    """Allow a parent to get a token acting as one of their children."""
    data = request.get_json(force=True)
    if not data:
        return jsonify({"error": "No data provided"}), 400
    try:
        validated = AssumeChildRequest.model_validate(data)
    except ValidationError as e:
        return jsonify({"error": "Validation Error", "details": e.errors()}), 422
    except Exception as e:
        return jsonify({"error": str(e)}), 400

    parent_id = request.user.get("user_id")
    child_id = validated.child_id

    children = get_children_for_parent(parent_id)
    if not any(c["id"] == child_id for c in children):
        return jsonify({"error": "Child not linked to this parent account"}), 403

    token = create_access_token(child_id, "student")
    return jsonify({
        "access_token": token,
        "token": token,
        "role": "student"
    }), 200


@app.route("/api/auth/verify-password", methods=["POST"])
@require_roles("parent")
def api_auth_verify_password():
    """Re-authenticate parent by verifying their password before entering dashboard/settings."""
    data = request.get_json(force=True) or {}
    password = data.get("password")
    if not password:
        return jsonify({"error": "Password is required"}), 400

    parent_id = request.user.get("user_id")
    user = get_user_by_id(parent_id)
    if not user or not check_password_hash(user["password_hash"], password):
        return jsonify({"error": "Incorrect password"}), 401

    return jsonify({"success": True, "message": "Password verified"}), 200


@app.route("/api/parents/link-child", methods=["POST"])
@require_roles("parent")
def api_link_child():
    """Link a child account to this parent by the child's email."""
    try:
        body = LinkChildRequest(**request.get_json(force=True))
    except (ValidationError, Exception) as e:
        return jsonify({"error": str(e)}), 400

    result = link_child_to_parent(request.user["user_id"], body.child_email)
    if "error" in result:
        return jsonify(result), 404
    return jsonify(result), 200


@app.route("/api/parents/children", methods=["GET"])
@require_roles("parent")
def api_get_children():
    """Get all children linked to this parent."""
    children = get_children_for_parent(request.user["user_id"])
    return jsonify({"children": children}), 200


@app.route("/api/admin/system", methods=["GET"])
@require_roles("admin")
def api_admin_system():
    """Admin-only system status."""
    return jsonify({"status": "ok", "service": "Navil Backend"}), 200


# ============================================================
# API ENDPOINTS
# ============================================================

@app.route("/api/characters", methods=["GET"])
def api_characters():
    """Return list of characters with metadata."""
    characters = get_all_characters()
    return jsonify({"characters": characters})


@app.route("/api/questions/<character>", methods=["GET"])
def api_questions(character):
    """Return all questions for a character."""
    questions = get_questions_for_character(character)

    if not questions:
        return jsonify({"error": "Character not found"}), 404

    # Return safe fields (no expected_answers to client)
    safe_questions = []
    for q in questions:
        safe_questions.append({
            "id": q["id"],
            "character": q["character"],
            "avatar": q["avatar"],
            "lesson": q["lesson"],
            "social_story": q["social_story"],
            "social_story_tamil": story_tamil(q["id"]),
            "question_tanglish": q["question_tanglish"],
            "question_tamil": q["question_tamil"],
            "difficulty": q["difficulty"]
        })

    return jsonify({"questions": safe_questions})


@app.route("/api/audio/<question_id>", methods=["GET"])
def api_audio(question_id):
    """Generate and return TTS audio for a question."""
    question = get_question_by_id(question_id)
    if not question:
        return jsonify({"error": "Question not found"}), 404

    text = question.get("question_tamil") or question.get("question_tanglish", "")
    character = question.get("character", "Friend")
    
    audio_dir = os.path.join(os.path.dirname(__file__), "static", "audio")
    os.makedirs(audio_dir, exist_ok=True)
    filepath = os.path.join(audio_dir, f"{question_id}.mp3")
    
    if not os.path.exists(filepath) or os.path.getsize(filepath) == 0:
        success = tanglish_resolver.synthesize_to_file(text, character, filepath)
        if not success:
            return jsonify({"error": "Failed to generate audio"}), 500
        
    return send_file(filepath, mimetype="audio/mpeg")


@app.route("/api/tts", methods=["GET", "POST"])
def api_tts():
    """
    Generate and return Neural TTS audio dynamically.
    Automatically resolves Tanglish to authentic Tamil script for characters
    so words are pronounced properly rather than spelled letter-by-letter.
    """
    import hashlib

    if request.method == "POST":
        data = request.get_json(force=True) or {}
        text = data.get("text", "")
        character = data.get("character", "Friend")
    else:
        text = request.args.get("text", "")
        character = request.args.get("character", "Friend")

    if not text:
        return jsonify({"error": "No text provided"}), 400

    # Tier 2 voices (Scenario / Result) are Tamil-only: never synthesize English
    if character in ("Scenario", "Result") and not has_tamil(text):
        return jsonify({"error": "Tamil text required for this voice"}), 400

    # Cache by hash of character + text
    h = hashlib.md5(f"{character}_{text}".encode("utf-8")).hexdigest()
    audio_dir = os.path.join(os.path.dirname(__file__), "static", "audio")
    os.makedirs(audio_dir, exist_ok=True)
    filepath = os.path.join(audio_dir, f"tts_{h}.mp3")

    if not os.path.exists(filepath) or os.path.getsize(filepath) == 0:
        success = tanglish_resolver.synthesize_to_file(text, character, filepath)
        if not success:
            return jsonify({"error": "Failed to generate TTS audio"}), 500

    return send_file(filepath, mimetype="audio/mpeg")


def infer_scenario_goal(question):
    """
    Infers the expected communicative goal from question/lesson context.
    Generalizes across scenarios instead of hardcoding individual questions.
    """
    req_comm = question.get("required_communication") or {}
    if req_comm.get("intent"):
        return req_comm["intent"]

    lesson = (question.get("lesson") or "").lower()
    q_tanglish = (question.get("question_tanglish") or "").lower()
    model = (question.get("model_answer") or "").lower()
    accepted = [a.lower() for a in question.get("expected_answers") or []]
    character = question.get("character", "")

    # 1. Task Completion (e.g. homework check, chores, eating)
    if (
        "homework" in lesson
        or "mudich" in q_tanglish
        or any(a.startswith("mudich") for a in accepted)
        or "mudich" in model
        or "saaptacha" in q_tanglish
    ):
        return "task_completion"

    # 2. Peer cooperation / Invitation acceptance (e.g. sports, games, coming along)
    if (
        character == "Friend"
        or "vilayaad" in q_tanglish
        or "aadalaa" in q_tanglish
        or "variya" in q_tanglish
        or "polaam" in model
        or any(a in ("va da", "vaa da", "vilayaadalaam") for a in accepted)
    ):
        return "peer_cooperation"

    # 3. Stranger: differentiate safety refusal from general communication using ontology reasoning
    if character == "Stranger":
        q_id = question.get("id") or ""
        if ontology_reasoner.ontology_service.is_safety_critical(q_id):
            return "SafetyRefusal"
        if "direction" in lesson or "enga" in q_tanglish:
            return "AnswerQuestion"
        if "thank" in lesson or "greeting" in lesson or "compliment" in lesson or "goodbye" in lesson:
            return "SocialAcceptance"
        return "AnswerQuestion"

    # 4. Apology
    if "sorry" in q_tanglish or "apology" in lesson or "sorry" in model:
        return "apology"

    # 5. Greeting / Farewell
    if "bye" in q_tanglish or "goodbye" in lesson:
        return "farewell"
    if "morning" in q_tanglish or "vanakkam" in q_tanglish:
        return "greeting"

    # 6. Contextual compliance (giving items / helping)
    if "kudu" in q_tanglish or "kudunga" in q_tanglish or "eduthu" in q_tanglish:
        return "contextual_compliance"

    return "general_dialogue"


@app.route("/api/evaluate", methods=["POST"])
def api_evaluate():
    """
    Evaluate a child's response.

    Expected JSON body:
    {
        "question_id": "father_01",
        "response": "Varen appa"
    }
    """
    data = request.get_json()

    if not data:
        return jsonify({"error": "No data provided"}), 400

    question_id = data.get("question_id", "")
    response = data.get("response", "").strip()

    transcribed_tamil = ""
    transcribed_tanglish = response
    
    if has_tamil(response):
        transcribed_tamil = response
        response = to_tanglish(response)
        transcribed_tanglish = response

    # Get the question
    question = get_question_by_id(question_id)

    if not question:
        return jsonify({"error": "Question not found"}), 404

    character = question.get("character", "Stranger")

    required_communication = question.get("required_communication")
    preferred_phrases = question.get("preferred_phrases", [])
    expected_answers = preferred_phrases or question.get("expected_answers", [])

    model_answer = question.get("model_answer", "")
    # Honorifics are stylistic when a semantic goal is defined.
    respect_required = False if required_communication else question.get(
        "respect_required", True
    )

    # --------------------------------------------------------
    # Empty response
    # --------------------------------------------------------
    if not response:
        return jsonify({
            "correct": False,
            "stars": 0,
            "feedback": "Take your time! Tap 🎤 when you're ready to speak. 🌸",
            "suggestion": f"Try saying: '{model_answer}'",
            "feedback_tamil": t1_feedback_tamil(question_id, False, 0, kind="empty"),
            "model_answer": model_answer,
            "encouragement": "You can do it! 💪",
            "transcribed_text": "",
            "transcribed_tamil": "",
            "semantic_score": 0.0,
            "nlp_similarity": 0.0,
            "sentiment": "Neutral"
        })

    normalized = normalize_text(response)

    # --------------------------------------------------------
    # Step 1: Check inappropriate language
    #
    # Genuinely rude/abusive wording rejects the answer. A merely informal address
    # for the role (severity "mild", e.g. "da" to a teacher) is a style note: the answer
    # is still judged on its meaning, and politeness only caps the stars below.
    # --------------------------------------------------------
    bad_check = check_inappropriate(response, character)
    style_note = None
    if bad_check["is_inappropriate"] and bad_check.get("severity") == "mild":
        style_note = bad_check
        bad_check = {**bad_check, "is_inappropriate": False}

    if bad_check["is_inappropriate"]:
        feedback_result = generate_feedback(
            character, False,
            error_type="Inappropriate Language",
            model_answer=model_answer
        )

        stars = calculate_stars(False, 0.0, True, False)

        return jsonify({
            "correct": False,
            "stars": stars,
            "feedback": bad_check["gentle_message"],
            "suggestion": f"A great way to answer is: '{model_answer}' 🌸",
            "feedback_tamil": t1_feedback_tamil(question_id, False, stars, kind="inappropriate"),
            "model_answer": model_answer,
            "encouragement": feedback_result["encouragement"],
            "transcribed_text": transcribed_tanglish,
            "transcribed_tamil": transcribed_tamil,
            "semantic_score": 0.0,
            "sentiment": "Neutral"
        })

    # --------------------------------------------------------
    # Step 2: Stylistic / safety rules (not semantic correctness)
    # --------------------------------------------------------
    rule_result = check_pragmatics(
        response,
        scenario_id=question_id,
        expected_answers=expected_answers,
        character=character
    )

    if rule_result.get("critical_failure"):
        feedback_result = generate_feedback(
            character, False,
            error_type="Safety Violation",
            model_answer=model_answer,
            respect_required=respect_required
        )
        return jsonify({
            "correct": False,
            "stars": 1,
            "feedback_tamil": t1_feedback_tamil(question_id, False, 1, kind="safety"),
            "feedback": feedback_result["feedback"],
            "suggestion": rule_result.get("suggestion") or feedback_result["suggestion"],
            "model_answer": model_answer,
            "encouragement": feedback_result["encouragement"],
            "transcribed_text": transcribed_tanglish,
            "transcribed_tamil": transcribed_tamil,
            "semantic_score": 0.0,
            "nlp_similarity": 0.0,
            "sentiment": "Neutral"
        })

    missing_preferred_vocative = rule_result.get(
        "missing_preferred_vocative", False
    )
    respect_ok = not missing_preferred_vocative

    # --------------------------------------------------------
    # Step 3: Semantic goal & Communicative Goal Alignment
    # --------------------------------------------------------
    expected_goal = infer_scenario_goal(question)

    semantic_scenario = {
        "expected": model_answer,
        "accepted_answers": expected_answers,
        "response_type": (
            required_communication.get("intent")
            if required_communication else expected_goal
        ),
        "required_communication": required_communication,
        "question_is_yes_no": "?" in (question.get("question_tanglish", "") + question.get("question_tamil", "")),
        "meaning": (
            required_communication.get("meaning", "")
            if required_communication else ""
        ),
        "expected_goal": expected_goal
    }
    semantic_result = semantic_match(response, semantic_scenario)
    matched = bool(semantic_result.get("matched"))
    best_semantic = float(semantic_result.get("semantic_score") or 0.0)

    # Legacy lessons without a semantic goal still use phrase similarity.
    if not required_communication:
        for expected in expected_answers:
            score = combined_similarity(normalized, expected)
            if score > best_semantic:
                best_semantic = score
        if not matched and (
            rule_result.get("preferred_phrase_used") or best_semantic >= 0.78
        ):
            matched = True

    # --------------------------------------------------------
    # Step 3a: NLP Semantic Model (Additional Signal)
    # --------------------------------------------------------
    from engines.nlp_semantic_engine import semantic_similarity as nlp_semantic_similarity
    
    # Calculate NLP semantic similarity against the expected meaning or model answer
    target_text = required_communication.get("meaning", model_answer) if required_communication else model_answer
    nlp_similarity = nlp_semantic_similarity(response, target_text)

    # --------------------------------------------------------
    # Step 3b: Ontology Inference (Combined Evidence)
    # --------------------------------------------------------
    # Query the ontology to reason if this response is socially appropriate
    from engines.semantic_engine import classify_response_intent
    inferred_intent = semantic_result.get("inferred_intent") or "unknown"
    if inferred_intent == "unknown":
        inferred_intent = classify_response_intent(normalized)

    ontology_eval = ontology_reasoner.evaluate_utterance(
        role=character,
        context=question.get("context") or question.get("lesson", "General"),
        utterance_text=response,
        intent=inferred_intent,
        has_politeness=respect_ok,
        semantic_similarity=nlp_similarity,
        expected_goal=expected_goal,
        scenario_id=question.get("id")
    )
    
    # Combined evidence evaluation:
    # High semantic similarity alone != Correct answer.
    # Acceptance requires intent/context agreement, ontology appropriateness,
    # or strong semantic equivalence (>= 0.88).
    intent_verified = False
    if ontology_eval.get("goal_satisfied") and inferred_intent != "unknown":
        matched = True
        intent_verified = True
        best_semantic = max(best_semantic, nlp_similarity, 0.82)
    elif matched and ontology_eval.get("is_appropriate"):
        intent_verified = True
    elif ontology_eval.get("is_appropriate") and nlp_similarity >= 0.88:
        matched = True
        intent_verified = True
        best_semantic = max(best_semantic, nlp_similarity)
    elif matched and not ontology_eval.get("has_violations"):
        intent_verified = True

    # Critical safety or decorum violation overrides match
    if ontology_eval.get("has_violations"):
        matched = False
        intent_verified = False

    # --------------------------------------------------------
    # Step 4: Sentiment
    # --------------------------------------------------------
    sentiment_result = analyze_sentiment(response)
    sentiment = sentiment_result["sentiment"]

    # --------------------------------------------------------
    # Step 5: Calculate stars (Multi-Signal Combined Evidence)
    # --------------------------------------------------------
    stars = calculate_stars(
        matched,
        semantic_score=best_semantic,
        respect_ok=respect_ok,
        language_ok=not bad_check["is_inappropriate"],
        nlp_similarity=nlp_similarity,
        intent_verified=intent_verified
    )

    if matched and missing_preferred_vocative:
        stars = min(stars, 3)
    if matched and style_note:
        stars = min(stars, 3)  # informal address: correct meaning, gentle politeness tip

    # --------------------------------------------------------
    # Step 6: Generate feedback
    # --------------------------------------------------------
    error_type = "None"
    if not matched:
        error_type = rule_result.get("error_type") or "Incorrect Response"
        if error_type in ("None", "Missing Honorific"):
            error_type = "Incorrect Response"
    elif missing_preferred_vocative:
        error_type = "Missing Honorific"

    feedback_result = generate_feedback(
        character, matched,
        error_type=error_type,
        model_answer=model_answer,
        respect_required=respect_required,
        missing_preferred_vocative=matched and missing_preferred_vocative,
        ontology_context=semantic_result.get("inferred_intent")
    )
    if matched and style_note and not feedback_result.get("suggestion"):
        feedback_result["suggestion"] = style_note.get("suggestion") or None


    # --------------------------------------------------------
    # Save progress
    # --------------------------------------------------------
    try:
        save_progress(
            user_id=(_request_user() or {}).get("user_id") or data.get("user_id", "default_user"),
            interaction_id=question_id,
            response=response,
            correct=matched,
            stars=stars,
            tier=question.get("tier", 1)
        )
    except Exception:
        pass  # Don't fail the response if progress save fails

    return jsonify({
        "correct": matched,
        "stars": stars,
        "feedback": feedback_result["feedback"],
        "feedback_tamil": t1_feedback_tamil(
            question_id, matched, stars, missing_honorific=bool(matched and missing_preferred_vocative)
        ),
        "suggestion": feedback_result["suggestion"],
        "model_answer": model_answer,
        "encouragement": feedback_result["encouragement"],
        "transcribed_text": transcribed_tanglish,
        "transcribed_tamil": transcribed_tamil,
        "semantic_score": round(best_semantic, 3),
        "nlp_similarity": round(nlp_similarity, 3),
        "sentiment": sentiment
    })


def _request_user():
    """Decoded JWT payload of the caller, or None (the child's answers are saved under this id)."""
    parts = (request.headers.get("Authorization") or "").split()
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return verify_access_token(parts[1])
    return None


def _target_student_id(student_id=None):
    """Which child's data the caller may see: a student sees their own; a parent sees a linked child."""
    user = _request_user()
    if not user:
        return None, ("Authentication required", 401)
    if user.get("role") == "student":
        return user["user_id"], None
    if user.get("role") == "parent":
        child_ids = [c["id"] for c in get_children_for_parent(user["user_id"])]
        if student_id:
            if student_id not in child_ids:
                return None, ("Child not linked to this parent account", 403)
            return student_id, None
        return (child_ids[0] if child_ids else None), None
    return None, ("Forbidden", 403)


def _parse_ts(value):
    try:
        return datetime.datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except Exception:
        return None


@app.route("/api/progress", methods=["GET"])
def api_progress():
    """Progress summary for ONE child (never mixed across users)."""
    sid, err = _target_student_id(request.args.get("student_id"))
    if err:
        return jsonify({"error": err[0]}), err[1]
    progress = get_progress(sid) if sid else []

    total = len(progress)
    correct = sum(1 for p in progress if str(p.get("correct", "")).lower() == "true")
    total_stars = sum(int(p.get("stars", 0) or 0) for p in progress)

    # Real activity for the dashboard: stars per day (last 7 days) and the current streak
    today = datetime.datetime.now(datetime.timezone.utc).date()
    per_day = {}
    active_days = set()
    last_activity = None
    for p in progress:
        ts = _parse_ts(p.get("timestamp"))
        if not ts:
            continue
        d = ts.astimezone(datetime.timezone.utc).date()
        active_days.add(d)
        per_day[d] = per_day.get(d, 0) + int(p.get("stars", 0) or 0)
        if last_activity is None or ts > last_activity:
            last_activity = ts
    daily = []
    for offset in range(6, -1, -1):
        d = today - datetime.timedelta(days=offset)
        daily.append({"day": d.strftime("%a"), "date": d.isoformat(), "stars": per_day.get(d, 0)})
    streak = 0
    cursor = today if today in active_days else today - datetime.timedelta(days=1)
    while cursor in active_days:
        streak += 1
        cursor -= datetime.timedelta(days=1)

    return jsonify({
        "total_attempts": total,
        "correct_attempts": correct,
        "total_stars": total_stars,
        "accuracy": round((correct / total * 100) if total > 0 else 0, 1),
        "streak_days": streak,
        "daily": daily,
        "last_activity": last_activity.isoformat() if last_activity else None
    })


@app.route("/api/history", methods=["GET"])
def api_history():
    """Real practice history for one child: answers grouped into sessions (same day + character + tier)."""
    sid, err = _target_student_id(request.args.get("student_id"))
    if err:
        return jsonify({"error": err[0]}), err[1]
    rows = get_progress(sid) if sid else []

    sessions = {}
    for p in rows:
        ts = _parse_ts(p.get("timestamp"))
        if not ts:
            continue
        tier = int(p.get("tier", 1) or 1)
        iid = str(p.get("interaction_id", ""))
        character, question = None, iid
        if tier == 2 and ":" in iid:
            lesson_id, _, turn_id = iid.partition(":")
            lesson = get_tier2_lesson_by_id(lesson_id)
            if lesson:
                character = lesson.get("character")
                turn = next((t for t in lesson.get("turns", []) if t.get("turn_id") == turn_id), None)
                if turn:
                    question = (turn.get("prompt") or {}).get("tanglish") or question
        else:
            q = get_question_by_id(iid)
            if q:
                character = q.get("character")
                question = q.get("question_tanglish") or question
        if not character:
            continue  # lesson was removed; skip rather than show a blank entry
        key = (ts.astimezone(datetime.timezone.utc).date().isoformat(), character, tier)
        s = sessions.setdefault(key, {
            "id": "-".join(str(k) for k in key), "character": character, "tier": tier,
            "started_at": ts.isoformat(), "ended_at": ts.isoformat(), "exchanges": [], "starsEarned": 0
        })
        s["started_at"] = min(s["started_at"], ts.isoformat())
        s["ended_at"] = max(s["ended_at"], ts.isoformat())
        is_correct = str(p.get("correct", "")).lower() == "true"
        stars = int(p.get("stars", 0) or 0)
        s["starsEarned"] += stars
        s["exchanges"].append({"question": question, "answer": p.get("response", ""), "correct": is_correct, "at": ts.isoformat()})

    out = []
    for s in sessions.values():
        s["exchanges"].sort(key=lambda e: e["at"])
        attempted = len(s["exchanges"])
        correct = sum(1 for e in s["exchanges"] if e["correct"])
        s["questionsAttempted"] = attempted
        s["correctAnswers"] = correct
        s["status"] = "completed" if attempted and correct / attempted >= 0.75 else "attempted"
        out.append(s)
    out.sort(key=lambda s: s["ended_at"], reverse=True)
    return jsonify({"sessions": out})


@app.route("/api/roadmap-progress", methods=["GET", "PUT"])
def api_roadmap_progress():
    """A child's roadmap (completed lessons / stars / Tier 2 unlock), kept on the server so it follows them."""
    user = _request_user()
    if not user or user.get("role") != "student":
        return jsonify({"error": "Student login required"}), 401
    if request.method == "PUT":
        body = request.get_json(force=True, silent=True) or {}
        progress = body.get("progress")
        if not isinstance(progress, dict):
            return jsonify({"error": "progress object required"}), 400
        return jsonify({"progress": merge_and_save_roadmap(user["user_id"], progress)})
    return jsonify({"progress": get_roadmap(user["user_id"])})


# ============================================================
# TIER 2 API ENDPOINTS
# ============================================================

@app.route("/api/tier2/lessons/<character>", methods=["GET"])
def api_tier2_lessons(character):
    lessons = sorted(get_tier2_lessons_for_character(character), key=lambda l: l["id"])
    # Strip turns for the list view
    summary = []
    for l in lessons:
        summary.append({
            "id": l["id"],
            "character": l["character"],
            "skill": l["skill"],
            "learning_objective": l["learning_objective"],
            "difficulty": l["difficulty"],
            "initial_prompt": l.get("initial_prompt")
        })
    return jsonify({"lessons": summary})

@app.route("/api/tier2/lesson/<lesson_id>", methods=["GET"])
def api_tier2_lesson(lesson_id):
    lesson = get_tier2_lesson_by_id(lesson_id)
    if not lesson:
        return jsonify({"error": "Lesson not found"}), 404
    return jsonify({"lesson": lesson})

@app.route("/api/tier2/evaluate-turn", methods=["POST"])
def api_tier2_evaluate_turn():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
        
    lesson_id = data.get("lesson_id")
    turn_id = data.get("turn_id")
    response = data.get("response", "").strip()
    retry_count = data.get("retry_count", 0)
    
    lesson = get_tier2_lesson_by_id(lesson_id)
    if not lesson:
        return jsonify({"error": "Lesson not found"}), 404
        
    # Find the turn
    turn = next((t for t in lesson["turns"] if t["turn_id"] == turn_id), None)
    if not turn:
        return jsonify({"error": "Turn not found"}), 404
        
    transcribed_tamil = ""
    transcribed_tanglish = response
    
    if has_tamil(response):
        transcribed_tamil = response
        response = to_tanglish(response)
        transcribed_tanglish = response
        
    # Evaluate
    result = evaluate_tier2_turn(lesson, turn, response, retry_count)
    try:
        save_progress(
            user_id=(_request_user() or {}).get("user_id") or "default_user",
            interaction_id=f"{lesson_id}:{turn_id}",
            response=transcribed_tanglish,
            correct=bool(result.get("correct")),
            stars=int(result.get("stars_awarded", 0) or 0),
            tier=2
        )
    except Exception:
        pass  # saving progress must never break the conversation
    result["transcribed_text"] = transcribed_tanglish
    result["transcribed_tamil"] = transcribed_tamil
    
    return jsonify(result)

# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    debug = os.environ.get("FLASK_DEBUG", "false").lower() in ("true", "1")
    print("=" * 60)
    print("[*] Social Skills Dialogue Assistant")
    print("   For autistic children")
    print("=" * 60)
    print(f"[*] Running on port {port} (debug={debug})")
    print("=" * 60)

    def _warm_up():
        """Pre-load the neural model and run the ontology reasoner once, so the child's first
        answer is not delayed (a cold start made the first evaluation take 40+ seconds)."""
        try:
            from engines.nlp_semantic_engine import semantic_similarity as _sim
            _sim("seri appa", "okay appa")
            ontology_reasoner.evaluate_utterance(
                role="Teacher", context="Classroom", utterance_text="yes teacher",
                intent="social_acceptance", has_politeness=True, semantic_similarity=0.8,
                expected_goal="AnswerQuestion", scenario_id="teacher_04"
            )
            print("[warm-up] evaluation pipeline ready")
        except Exception as exc:  # warm-up must never break startup
            print(f"[warm-up] skipped: {exc}")

    import threading
    threading.Thread(target=_warm_up, daemon=True).start()

    app.run(debug=debug, host="0.0.0.0", port=port)
