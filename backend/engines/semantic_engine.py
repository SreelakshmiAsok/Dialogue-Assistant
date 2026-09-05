import re
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

    return "aama" in normalized


def is_eating_answer(text):
    normalized = normalize_text(text)
    eating_words = ["saap", "sap", "ate", "eating"]
    for word in eating_words:
        if word in normalized:
            return True
    return False


# ============================================================
# SEMANTIC MATCH
# ============================================================

def semantic_match(user_response, scenario):
    normalized_response = normalize_text(user_response)

    expected = scenario.get("expected", "")

    accepted_answers = scenario.get("accepted_answers", [])

    response_type = scenario.get("response_type", "")

    # Make sure expected answer is always included
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
    # FUZZY MATCH
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
        "expected": "Aama ma'am",
        "accepted_answers": [
            "Aama ma'am",
            "Ama mam",
            "Seri teacher",
            "Mudichiten maam",
            "Muduchutten maam"
        ],
        "response_type": "homework_completed"
    }

    tests = [
        "Aama ma'am",
        "Ama mam",
        "Seri teacher",
        "Mudichutten maam",
        "Muduchitten maam",
        "illa di"
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