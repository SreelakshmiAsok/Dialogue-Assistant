from difflib import SequenceMatcher

from nlp.preprocessing import normalize_text


# ============================================================
# TEXT SIMILARITY
# ============================================================

def text_similarity(text1, text2):
    text1 = normalize_text(text1)
    text2 = normalize_text(text2)

    if not text1 or not text2:
        return 0.0

    if text1 == text2:
        return 1.0

    return SequenceMatcher(None, text1, text2).ratio()


# ============================================================
# TOKEN SIMILARITY
# ============================================================

def token_similarity(text1, text2):
    words1 = set(normalize_text(text1).split())
    words2 = set(normalize_text(text2).split())

    if not words1 or not words2:
        return 0.0

    intersection = words1.intersection(words2)
    union = words1.union(words2)

    return len(intersection) / len(union)


# ============================================================
# COMBINED SCORE
# ============================================================

def combined_similarity(text1, text2):
    sequence_score = text_similarity(text1, text2)
    token_score = token_similarity(text1, text2)

    return (sequence_score * 0.6) + (token_score * 0.4)


# ============================================================
# SPECIAL RESPONSE DETECTION
# ============================================================

def is_direction_answer(text):
    normalized = normalize_text(text)

    direction_words = [
        "left",
        "right",
        "straight",
        "pakkathula",
        "munnadi",
        "anga"
    ]

    for word in direction_words:
        if word in normalized:
            return True

    return False


def is_dont_know_answer(text):
    normalized = normalize_text(text)

    unknown_words = [
        "theriyadhu",
        "theriyala",
        "sorry"
    ]

    for word in unknown_words:
        if word in normalized:
            return True

    return False


def is_homework_completed(text):
    normalized = normalize_text(text)

    completion_words = [
        "aama",
        "seri",
        "mudichiten",
        "mudichitten",
        "mudichuten",
        "mudichen"
    ]

    for word in completion_words:
        if word in normalized:
            return True

    return False


def is_yes_answer(text):
    normalized = normalize_text(text)
    tokens = normalized.split()
    return any(word in tokens for word in ["aama", "yes", "yeah", "yep", "ok", "okay"])


def is_no_answer(text):
    normalized = normalize_text(text)
    tokens = normalized.split()
    return any(word in tokens for word in ["illa", "no", "nope"])


def is_eating_answer(text):
    normalized = normalize_text(text)
    eating_words = [
        "saap", "saptaen", "saaptaen", "saapten", "saapitten",
        "saaptuten", "saaptutten", "ate", "eaten", "eating",
        "food", "lunch", "dinner", "breakfast"
    ]
    for word in eating_words:
        if word in normalized:
            return True
    return False


def is_meaning_refusal(text):
    normalized = normalize_text(text)
    refusal_markers = [
        "won't tell", "wont tell", "will not tell",
        "none of your", "dont want to say", "don't want to say",
        "i won't", "i wont"
    ]
    return any(marker in normalized for marker in refusal_markers)


def _eating_meaning(meaning):
    meaning_l = (meaning or "").lower()
    return any(token in meaning_l for token in [
        "eaten", "eat", "meal", "food", "lunch", "saap"
    ])


def aligns_with_required_meaning(text, meaning, intent=""):
    """
    Concept-level check against required_communication.meaning.

    This is intentionally independent of preferred honorifics so that
    a conceptually correct sentence is not failed for low word overlap
    with a short model phrase, and a wrong sentence is not passed just
    because it contains 'appa'.
    """
    if is_meaning_refusal(text):
        return False

    if _eating_meaning(meaning) or (
        intent == "AnswerQuestion" and _eating_meaning(meaning)
    ):
        return (
            is_eating_answer(text)
            or is_yes_answer(text)
            or is_no_answer(text)
        )

    return False


# ============================================================
# SEMANTIC MATCH
# ============================================================

def semantic_match(user_response, scenario):
    normalized_response = normalize_text(user_response)

    expected = scenario.get("expected", "")
    accepted_answers = scenario.get("accepted_answers", [])
    response_type = scenario.get("response_type", "")
    required_communication = scenario.get("required_communication") or {}

    if required_communication:
        response_type = required_communication.get("intent", response_type) or response_type
        meaning = required_communication.get("meaning", "")
    else:
        meaning = scenario.get("meaning", "")

    all_answers = list(accepted_answers)

    if expected and expected not in all_answers:
        all_answers.append(expected)

    # --------------------------------------------------------
    # EMPTY RESPONSE
    # --------------------------------------------------------

    if not normalized_response:
        return {
            "normalized": "",
            "expected": expected,
            "matched": False,
            "semantic_score": 0.0
        }

    # --------------------------------------------------------
    # EXACT MATCH AFTER NORMALIZATION
    # --------------------------------------------------------

    for answer in all_answers:

        normalized_answer = normalize_text(answer)

        if normalized_response == normalized_answer:
            return {
                "normalized": normalized_response,
                "expected": expected,
                "matched": True,
                "semantic_score": 1.0
            }

    # --------------------------------------------------------
    # REQUIRED COMMUNICATION GOAL (intent + meaning)
    # --------------------------------------------------------

    if meaning:
        if aligns_with_required_meaning(normalized_response, meaning, response_type):
            return {
                "normalized": normalized_response,
                "expected": expected,
                "matched": True,
                "semantic_score": 0.90
            }

        # Meaning was specified and not met: do not let honorific overlap
        # with preferred phrases (e.g. "5 min appa") count as a pass.
        return {
            "normalized": normalized_response,
            "expected": expected,
            "matched": False,
            "semantic_score": 0.0
        }

    # --------------------------------------------------------
    # SPECIAL CONTEXT: HOMEWORK
    # --------------------------------------------------------

    if response_type == "homework_completed":

        if is_homework_completed(normalized_response):

            return {
                "normalized": normalized_response,
                "expected": expected,
                "matched": True,
                "semantic_score": 0.90
            }

    # --------------------------------------------------------
    # SPECIAL CONTEXT: YES
    # --------------------------------------------------------

    if response_type == "yes":

        if is_yes_answer(normalized_response):

            return {
                "normalized": normalized_response,
                "expected": expected,
                "matched": True,
                "semantic_score": 0.90
            }

    # --------------------------------------------------------
    # SPECIAL CONTEXT: AnswerQuestion (Eating)
    # --------------------------------------------------------

    if response_type == "AnswerQuestion":
        if is_eating_answer(normalized_response):
            return {
                "normalized": normalized_response,
                "expected": expected,
                "matched": True,
                "semantic_score": 0.90
            }

        if is_yes_answer(normalized_response):

            return {
                "normalized": normalized_response,
                "expected": expected,
                "matched": True,
                "semantic_score": 0.90
            }

    # --------------------------------------------------------
    # SPECIAL CONTEXT: DIRECTION
    # --------------------------------------------------------

    if response_type == "direction":

        if is_direction_answer(normalized_response):

            return {
                "normalized": normalized_response,
                "expected": expected,
                "matched": True,
                "semantic_score": 0.90
            }

        if is_dont_know_answer(normalized_response):

            return {
                "normalized": normalized_response,
                "expected": expected,
                "matched": True,
                "semantic_score": 0.85
            }

    # --------------------------------------------------------
    # FUZZY MATCH (legacy lessons without required_communication)
    # --------------------------------------------------------

    best_score = 0.0

    for answer in all_answers:

        score = combined_similarity(
            normalized_response,
            answer
        )

        if score > best_score:
            best_score = score

    # A reasonably close response is accepted
    if best_score >= 0.78:

        return {
            "normalized": normalized_response,
            "expected": expected,
            "matched": True,
            "semantic_score": round(best_score, 3)
        }

    # --------------------------------------------------------
    # NO MATCH
    # --------------------------------------------------------

    return {
        "normalized": normalized_response,
        "expected": expected,
        "matched": False,
        "semantic_score": round(best_score, 3)
    }


# ============================================================
# TEST
# ============================================================

if __name__ == "__main__":

    test_scenario = {
        "expected": "Saaptaen appa",
        "accepted_answers": ["Saaptaen appa", "Aama appa"],
        "required_communication": {
            "intent": "AnswerQuestion",
            "meaning": "Indicate whether they have eaten."
        }
    }

    tests = [
        "Naan saapitten paa, neenga saaptiya?",
        "Saaptaen appa.",
        "Naan saapitten appa, neenga saaptiya?",
        "5 min appa",
        "I won't tell you"
    ]

    print("=" * 60)
    print("SEMANTIC ENGINE TEST")
    print("=" * 60)

    for test in tests:

        result = semantic_match(
            test,
            test_scenario
        )

        print()
        print("Input:", test)
        print("Normalized:", result["normalized"])
        print("Matched:", result["matched"])
        print("Score:", result["semantic_score"])

    print("=" * 60)
