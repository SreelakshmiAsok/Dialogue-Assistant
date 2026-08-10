# ============================================================
# FLASK APP — Social Skills Dialogue Assistant
# For autistic children
# ============================================================

from flask import Flask, render_template, request, jsonify, send_file
from flask_cors import CORS
import os
from gtts import gTTS

from questions import (
    get_all_characters,
    get_questions_for_character,
    get_question_by_id
)
from rule_engine import check_pragmatics, check_respect
from semantic_engine import combined_similarity
from bad_words_filter import check_inappropriate
from feedback_engine import generate_feedback, calculate_stars
from sentiment_engine import analyze_sentiment
from utils.preprocessing import normalize_text
from progress_tracker import save_progress, get_progress
from transliterate_tamil import to_tanglish
import re

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
    
    # We will save the audio files in a cache folder
    audio_dir = "static/audio"
    os.makedirs(audio_dir, exist_ok=True)
    
    filepath = os.path.join(audio_dir, f"{question_id}.mp3")
    
    # Generate if not exists
    if not os.path.exists(filepath):
        tts = gTTS(text=text, lang='ta')
        tts.save(filepath)
        
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

    character = question["character"]
    expected_answers = question["expected_answers"]
    model_answer = question["model_answer"]
    respect_required = question["respect_required"]

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
    # Step 2: Check answer correctness (rule engine)
    # --------------------------------------------------------
    # Build a temporary scenario_id based on character
    rule_result = check_pragmatics(
        response,
        scenario_id=None,
        expected_answers=expected_answers,
        character=character
    )

    matched = rule_result["matched"]

    # --------------------------------------------------------
    # Step 3: Semantic similarity
    # --------------------------------------------------------
    best_semantic = 0.0
    for expected in expected_answers:
        score = combined_similarity(normalized, expected)
        if score > best_semantic:
            best_semantic = score

    # Accept if semantic score is high enough
    if not matched and best_semantic >= 0.75:
        matched = True

    # --------------------------------------------------------
    # Step 4: Check respect
    # --------------------------------------------------------
    respect_ok = True
    if respect_required:
        respect_ok = check_respect(response, character=character)

    # --------------------------------------------------------
    # Step 5: Sentiment
    # --------------------------------------------------------
    sentiment_result = analyze_sentiment(response)
    sentiment = sentiment_result["sentiment"]

    # --------------------------------------------------------
    # Step 6: Calculate stars
    # --------------------------------------------------------
    stars = calculate_stars(
        matched,
        best_semantic,
        respect_ok,
        not bad_check["is_inappropriate"]
    )

    # --------------------------------------------------------
    # Step 7: Generate feedback
    # --------------------------------------------------------
    error_type = rule_result.get("error_type", "None")

    if matched and not respect_ok:
        error_type = "Missing Honorific"
        matched = False
        stars = max(stars, 2)

    feedback_result = generate_feedback(
        character, matched,
        error_type=error_type,
        model_answer=model_answer,
        respect_required=respect_required
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
