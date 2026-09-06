from difflib import SequenceMatcher
from nlp.preprocessing import normalize_text

# ============================================================
# CHARACTER-SPECIFIC RULES
# Honorifics here are stylistic preferences, not pass/fail gates.
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
            "maam",
            "madam",
            "medam",
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
            "mam",
            "maam",
            "madam",
            "medam",
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

STRANGER_DANGER_ACCEPT = [
    "sure", "okay", "ok", "yes", "aama", "come", "go",
    "puppy", "candy", "chocolate", "car"
]
STRANGER_SAFETY_REFUSE = [
    "no", "illa", "don't", "dont", "cant", "cannot", "mudiyadhu",
    "parent", "amma", "appa", "mom", "dad", "teacher"
]


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
# RESPECT CHECK (stylistic)
# ============================================================

def check_respect(response, character):
    rules = CHARACTER_RULES.get(character)

    if not rules:
        return True

    # Friend does not require respectful title
    if not rules["respect_words"]:
        return True

    normalized = normalize_text(response)
    tokens = set(normalized.split())

    for word in rules["respect_words"]:
        if normalize_text(word) in tokens:
            return True

    return False


# ============================================================
# PREFERRED PHRASE CHECK (optional style, not correctness)
# ============================================================

def check_answer(response, expected_answers):
    normalized_response = normalize_text(response)

    for expected in expected_answers:
        normalized_expected = normalize_text(expected)

        if normalized_response == normalized_expected:
            return True

        score = similarity_score(
            normalized_response,
            normalized_expected
        )

        if score >= 0.88:
            return True

    return False


def _stranger_safety_violation(response):
    normalized = normalize_text(response)
    tokens = normalized.split()
    accepted = any(word in tokens or word in normalized for word in STRANGER_DANGER_ACCEPT)
    refused = any(word in tokens or word in normalized for word in STRANGER_SAFETY_REFUSE)
    return accepted and not refused


# ============================================================
# MAIN RULE CHECK
# ============================================================

def check_pragmatics(response, scenario_id=None, expected_answers=None, character=None):
    """
    Stylistic and safety checks only.

    Correctness of meaning is owned by the semantic engine.
    Missing honorifics are flags, not hard failures.
    """
    response = response or ""

    if not character:
        character = "Stranger"

    normalized_response = normalize_text(response)

    if not normalized_response:
        return {
            "matched": False,
            "preferred_phrase_used": False,
            "missing_preferred_vocative": False,
            "critical_failure": False,
            "error_type": "No Response",
            "suggestion": "Please try answering the question.",
            "stars": 0
        }

    # --------------------------------------------------------
    # Safety checks remain critical failures
    # --------------------------------------------------------
    if character == "Stranger" and _stranger_safety_violation(response):
        return {
            "matched": False,
            "preferred_phrase_used": False,
            "missing_preferred_vocative": False,
            "critical_failure": True,
            "error_type": "Safety Violation",
            "suggestion": "Stay safe. Ask a trusted adult for help.",
            "stars": 0
        }

    preferred_phrase_used = bool(
        expected_answers and check_answer(response, expected_answers)
    )

    rules = CHARACTER_RULES.get(character, {})
    has_vocative_expectation = bool(rules.get("respect_words"))
    missing_preferred_vocative = (
        has_vocative_expectation and not check_respect(response, character)
    )

    error_type = "None"
    suggestion = "Great job!"
    if missing_preferred_vocative:
        error_type = "Missing Honorific"
        suggestion = rules.get("error_message", "")

    return {
        "matched": preferred_phrase_used,
        "preferred_phrase_used": preferred_phrase_used,
        "missing_preferred_vocative": missing_preferred_vocative,
        "critical_failure": False,
        "error_type": error_type,
        "suggestion": suggestion,
        "stars": 1 if preferred_phrase_used else 0
    }
