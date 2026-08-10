import re
from difflib import SequenceMatcher
from utils.preprocessing import normalize_text

# ============================================================
# CHARACTER-SPECIFIC RULES
# ============================================================

CHARACTER_RULES = {
    "Father": {
        "respect_words": ["appa", "amma", "அப்பா", "அம்மா"],
        "error_message": "Please speak respectfully to your Appa."
    },
    "Teacher": {
        "respect_words": [
            "teacher",
            "sir",
            "miss",
            "ma'am",
            "mam",
            "டீச்சர்",
            "சார்",
            "மிஸ்",
            "மேடம்"
        ],
        "error_message": "Please speak respectfully to your Teacher."
    },
    "Friend": {
        "respect_words": [],
        "error_message": ""
    },
    "Stranger": {
        "respect_words": [
            "sir",
            "ma'am",
            "miss",
            "uncle",
            "aunty",
            "சார்",
            "மேடம்",
            "மிஸ்",
            "அங்கிள்",
            "ஆண்டி"
        ],
        "error_message": "Please speak respectfully."
    }
}


# ============================================================
# TEXT SIMILARITY
# ============================================================

def similarity_score(text1, text2):
    text1 = normalize_text(text1)
    text2 = normalize_text(text2)

    if not text1 or not text2:
        return 0.0

    return round(
        SequenceMatcher(None, text1, text2).ratio(),
        3
    )


# ============================================================
# RESPECT CHECK
# ============================================================

def check_respect(response, character):
    rules = CHARACTER_RULES.get(character)

    if not rules:
        return True

    # Friend does not require respectful title
    if not rules["respect_words"]:
        return True

    normalized = normalize_text(response)

    for word in rules["respect_words"]:
        if word in normalized.split():
            return True

    return False


# ============================================================
# CORRECT ANSWER CHECK
# ============================================================

def check_answer(response, expected_answers):
    normalized_response = normalize_text(response)

    for expected in expected_answers:
        normalized_expected = normalize_text(expected)

        # Exact match
        if normalized_response == normalized_expected:
            return True

        # Very close spelling match
        score = similarity_score(
            normalized_response,
            normalized_expected
        )

        if score >= 0.88:
            return True

    return False


# ============================================================
# MAIN RULE CHECK
# ============================================================

def check_pragmatics(response, scenario_id=None, expected_answers=None, character=None):
    """
    Main rule check logic.
    """
    response = response or ""
    
    # Fallback to Stranger if no character provided
    if not character:
        character = "Stranger"

    normalized_response = normalize_text(response)

    # Empty response
    if not normalized_response:
        return {
            "matched": False,
            "error_type": "No Response",
            "suggestion": "Please try answering the question.",
            "stars": 0
        }

    # --------------------------------------------------------
    # Check expected answers FIRST
    # --------------------------------------------------------
    if expected_answers:
        if check_answer(response, expected_answers):
            return {
                "matched": True,
                "error_type": "None",
                "suggestion": "Great job!",
                "stars": 1
            }

    # --------------------------------------------------------
    # Respect check
    # --------------------------------------------------------
    if not check_respect(response, character):
        rules = CHARACTER_RULES.get(character)
        if rules:
            return {
                "matched": False,
                "error_type": "Missing Honorific",
                "suggestion": rules["error_message"],
                "stars": 0
            }

    # --------------------------------------------------------
    # Incorrect response
    # --------------------------------------------------------
    return {
        "matched": False,
        "error_type": "Incorrect Response",
        "suggestion": "Try giving a more suitable response.",
        "stars": 0
    }