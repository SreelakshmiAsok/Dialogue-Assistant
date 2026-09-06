# ============================================================
# FLASK APP — Social Skills Dialogue Assistant
# For autistic children
# ============================================================

from flask import Flask, render_template, request, jsonify, send_file
from flask_cors import CORS
import os
import subprocess
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
import re
import sys
from pydantic import ValidationError
from schemas.requests import EvaluateRequest, Tier2EvaluateTurnRequest, LinkChildRequest
from schemas.auth import RegisterRequest, LoginRequest, AssumeChildRequest
from core.users import create_user, get_user_by_email, link_child_to_parent, get_children_for_parent
from core.auth import create_access_token, require_auth, require_roles
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
            "question_tanglish": q["question_tanglish"],
            "question_tamil": q["question_tamil"],
            "difficulty": q["difficulty"]
        })

    return jsonify({"questions": safe_questions})


@app.route("/api/audio/<question_id>", methods=["GET"])
def api_audio(question_id):
    """Generate and return TTS audio for a question using gTTS."""
    question = get_question_by_id(question_id)
    if not question:
        return jsonify({"error": "Question not found"}), 404

    text = question["question_tamil"]
    character = question["character"]
    
    # We will save the audio files in a cache folder
    audio_dir = "static/audio"
    os.makedirs(audio_dir, exist_ok=True)
    
    filepath = os.path.join(audio_dir, f"{question_id}.mp3")
    
    # Generate if not exists
    if not os.path.exists(filepath):
        voice = "ta-IN-PallaviNeural"  # Default female
        if character in ["Father", "Stranger", "Friend"]:
            voice = "ta-IN-ValluvarNeural"
        
        subprocess.run(["edge-tts", "--voice", voice, "--text", text, "--write-media", filepath])
        
    return send_file(filepath, mimetype="audio/mpeg")


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
    # --------------------------------------------------------
    bad_check = check_inappropriate(response, character)

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
        scenario_id=None,
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
    # Step 3: Semantic goal (required_communication)
    # --------------------------------------------------------
    semantic_scenario = {
        "expected": model_answer,
        "accepted_answers": expected_answers,
        "response_type": (
            required_communication.get("intent")
            if required_communication else ""
        ),
        "required_communication": required_communication,
        "meaning": (
            required_communication.get("meaning", "")
            if required_communication else ""
        )
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
            rule_result.get("preferred_phrase_used") or best_semantic >= 0.75
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
    inferred_intent = semantic_result.get("inferred_intent") or "unknown"
    
    ontology_eval = ontology_reasoner.evaluate_utterance(
        role=character,
        context=question.get("context", "General"),
        utterance_text=response,
        intent=inferred_intent,
        has_politeness=respect_ok,
        semantic_similarity=nlp_similarity
    )
    
    if ontology_eval["is_appropriate"]:
        matched = True
        if best_semantic < 0.75:
            best_semantic = 0.75

    # --------------------------------------------------------
    # Step 4: Sentiment
    # --------------------------------------------------------
    sentiment_result = analyze_sentiment(response)
    sentiment = sentiment_result["sentiment"]

    # --------------------------------------------------------
    # Step 5: Calculate stars
    # --------------------------------------------------------
    stars = calculate_stars(
        matched,
        best_semantic,
        respect_ok,
        not bad_check["is_inappropriate"]
    )

    if matched and missing_preferred_vocative:
        stars = max(stars, 3)

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


    # --------------------------------------------------------
    # Save progress
    # --------------------------------------------------------
    try:
        save_progress(
            question_id,
            response,
            matched,
            stars
        )
    except Exception:
        pass  # Don't fail the response if progress save fails

    return jsonify({
        "correct": matched,
        "stars": stars,
        "feedback": feedback_result["feedback"],
        "suggestion": feedback_result["suggestion"],
        "model_answer": model_answer,
        "encouragement": feedback_result["encouragement"],
        "transcribed_text": transcribed_tanglish,
        "transcribed_tamil": transcribed_tamil,
        "semantic_score": round(best_semantic, 3),
        "nlp_similarity": round(nlp_similarity, 3),
        "sentiment": sentiment
    })


@app.route("/api/progress", methods=["GET"])
def api_progress():
    """Return progress summary."""
    progress = get_progress()

    total = len(progress)
    correct = sum(1 for p in progress if p.get("correct", "").lower() == "true")
    total_stars = sum(int(p.get("stars", 0)) for p in progress)

    return jsonify({
        "total_attempts": total,
        "correct_attempts": correct,
        "total_stars": total_stars,
        "accuracy": round((correct / total * 100) if total > 0 else 0, 1)
    })


# ============================================================
# TIER 2 API ENDPOINTS
# ============================================================

@app.route("/api/tier2/lessons/<character>", methods=["GET"])
def api_tier2_lessons(character):
    lessons = get_tier2_lessons_for_character(character)
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
    result["transcribed_text"] = transcribed_tanglish
    result["transcribed_tamil"] = transcribed_tamil
    
    return jsonify(result)

# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":
    print("=" * 60)
    print("🌟 Social Skills Dialogue Assistant")
    print("   For autistic children")
    print("=" * 60)
    print("Open http://localhost:5001 in your browser")
    print("=" * 60)

    app.run(debug=True, host="0.0.0.0", port=5001)
