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
        "saaptuten", "saaptutten", "chaap", "chaappidden", "chaapidden",
        "ate", "eaten", "eating",
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


# ============================================================
# LINGUISTIC FEATURE EXTRACTION
# ============================================================

def extract_linguistic_features(text):
    """
    Extract pragmatic and linguistic features from a Tamil/Tanglish response.

    This does NOT look for specific correct answers. It identifies
    linguistic categories:
      - polarity (affirmative vs negative)
      - register (peer/informal vs formal)
      - come/go markers (invitation acceptance signals)
      - activity verb markers (-laam forms, "let's do" verbs)
      - refusal markers

    These features are then used by classify_response_intent() to
    determine the pragmatic intent of the response.
    """
    normalized = normalize_text(text)
    tokens = set(normalized.split())

    # --- Affirmative polarity markers ---
    # These are agreement signals, not specific correct answers.
    # "Seri" means "okay/alright" — it signals affirmative intent.
    affirmative_tokens = {"seri", "sari", "aama", "ama", "ok", "okay", "yes", "yeah"}
    has_affirmative = bool(tokens & affirmative_tokens)

    # --- Come / invitation-acceptance markers ---
    # "Vaa" / "Va" is the Tamil imperative for "come".
    # Responding with "vaa" to "shall we play?" signals acceptance.
    # "Polaam" means "let's go" — also signals acceptance.
    come_tokens = {"vaa", "va", "polaam", "polam", "polaama", "vaalaam"}
    has_come_marker = bool(tokens & come_tokens)

    # --- Activity verb markers (hortative -laam forms) ---
    # Tamil hortative: verb + laam = "let's [verb]"
    # e.g. vilayaadalaam (let's play), sapdalaam (let's eat)
    # Detecting any -laam ending short word signals cooperative intent.
    has_activity_verb = any(
        token.endswith("laam") or token.endswith("lam")
        for token in tokens
        if len(token) > 4  # avoid matching noise like "alam"
    )

    # --- Peer / informal address register ---
    # "Da", "di", "machi", "dei" are Tamil informal address particles
    # used between peers. Their presence signals peer-register speech.
    peer_register_tokens = {"da", "di", "machi", "dei", "bro", "machan"}
    uses_peer_register = bool(tokens & peer_register_tokens)

    # --- Formal address register ---
    formal_tokens = {"appa", "sir", "teacher", "mam", "madam", "miss"}
    uses_formal_register = bool(tokens & formal_tokens)

    # --- Refusal markers ---
    # Detecting a polite refusal is also important:
    # "Illa" = no/not, "vendam" = don't want, "mudiyaadhu" = can't
    refusal_tokens = {"illa", "vendam", "mudiyaadhu", "mudiyadhu", "vendum illai", "no"}
    has_refusal = bool(tokens & refusal_tokens)

    # --- Uncertainty markers ---
    # "theriyadhu", "therila", "dont know", "not sure"
    uncertainty_tokens = {"theriyadhu", "therila", "theriyathu"}
    has_uncertainty = bool(tokens & uncertainty_tokens) or "don't know" in normalized or "dont know" in normalized or "not sure" in normalized

    # --- Contextual Request markers ---
    # "5 min", "wait", "irunga"
    request_tokens = {"min", "mins", "minutes", "wait", "irunga", "time"}
    has_request = bool(tokens & request_tokens) or "5 min" in normalized or "five min" in normalized

    return {
        "has_affirmative": has_affirmative,
        "has_come_marker": has_come_marker,
        "has_activity_verb": has_activity_verb,
        "uses_peer_register": uses_peer_register,
        "uses_formal_register": uses_formal_register,
        "has_refusal": has_refusal,
        "has_uncertainty": has_uncertainty,
        "has_request": has_request,
    }


def classify_response_intent(text):
    """
    Classify the pragmatic intent of a response using extracted features.

    Returns an intent label that can be matched against the scenario's
    required_communication.intent. This is intent-to-intent matching,
    not word-to-word matching.

    Possible return values:
      "social_acceptance"  — child is accepting/agreeing to engage
      "social_refusal"     — child is politely declining
      "unknown"            — cannot determine intent
    """
    features = extract_linguistic_features(text)

    # A response is classified as social_acceptance if it has any
    # affirmative signal (come-marker, agreement word, or activity verb)
    # without a clear refusal override.
    affirmative_signals = (
        features["has_affirmative"]
        or features["has_come_marker"]
        or features["has_activity_verb"]
    )

    if features["has_uncertainty"]:
        return "uncertainty"

    if features["has_request"]:
        return "contextual_request"

    if features["has_refusal"] and not affirmative_signals:
        return "social_refusal"

    if affirmative_signals:
        return "social_acceptance"

    return "unknown"


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
    # PEER SOCIAL INTENT MATCHING
    #
    # Must run BEFORE the generic meaning check because social_acceptance
    # uses intent-to-intent classification, not meaning string comparison.
    #
    # "Vaa vaadaa" is recognised because:
    #   - "vaa" is a come-marker (Tamil imperative of "come")
    #   → feature: has_come_marker = True
    #   → classified intent: social_acceptance
    #   → required intent:   social_acceptance
    #   → MATCH
    # --------------------------------------------------------

    if response_type in ("social_acceptance", "peer_cooperation", "peer_invitation"):
        response_intent = classify_response_intent(normalized_response)

        if response_intent == "social_acceptance":
            return {
                "normalized": normalized_response,
                "expected": expected,
                "matched": True,
                "semantic_score": 0.88,
                "inferred_intent": "social_acceptance"
            }

        if response_intent == "social_refusal":
            # Polite refusal is a valid social response — scored lower
            # so the system can gently suggest acceptance next time.
            return {
                "normalized": normalized_response,
                "expected": expected,
                "matched": True,
                "semantic_score": 0.75,
                "inferred_intent": "social_refusal"
            }

        # Intent unclear — not matched
        return {
            "normalized": normalized_response,
            "expected": expected,
            "matched": False,
            "semantic_score": 0.0,
            "inferred_intent": "unknown"
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
            "semantic_score": 0.0,
            "inferred_intent": classify_response_intent(normalized_response)
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
        "semantic_score": round(best_score, 3),
        "inferred_intent": classify_response_intent(normalized_response)
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
