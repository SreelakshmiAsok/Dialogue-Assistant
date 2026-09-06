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
    tokens = set(normalized.split())

    completion_tokens = {
        "aama", "seri", "ok", "yes", "mudichiten", "mudichitten", "mudichuten",
        "mudichen", "mudichachu", "mudichaachu", "mudichchaachu",
        "mudichchaachchu", "finished", "done", "completed", "panniten", "panniyachu"
    }

    if any(t in completion_tokens or t.startswith("mudich") for t in tokens):
        return True

    return any(word in normalized for word in ["mudich", "finished", "done", "completed", "aama", "seri"])


def is_yes_answer(text):
    normalized = normalize_text(text)
    tokens = normalized.split()
    return any(word in tokens for word in ["aama", "yes", "yeah", "yep", "ok", "okay"])


def is_no_answer(text):
    normalized = normalize_text(text)
    tokens = normalized.split()
    return any(word in tokens for word in ["illa", "no", "nope"])


def is_question_directed_at_interlocutor(text):
    """
    Detect if utterance contains a 2nd-person question directed at the interlocutor.
    Examples in Tamil/Tanglish:
      - 'neenga saaptiya?', 'saaptiya paa?', 'saaptingala?', 'saaptengala?'
      - 'neenga variya?', 'nee variya?'
      - 'did you eat?', 'have you eaten?'
    """
    normalized = normalize_text(text)
    tokens = set(normalized.split())

    has_second_person_pronoun = bool(tokens & {"neenga", "ninga", "nee", "you"})

    # 2nd person interrogative verbal inflections: -iya, -ingala, -eengala
    has_second_person_verb = any(
        t.endswith("iya") or t.endswith("ingala") or t.endswith("eengala") or t.endswith("engala")
        for t in tokens
    )

    has_question_word = bool(tokens & {"did", "have", "are", "enna", "eppadi", "enga", "why", "what", "where"})
    has_question_mark = "?" in text

    if (has_second_person_pronoun and has_second_person_verb) or (has_second_person_verb and (has_question_mark or has_second_person_pronoun)):
        return True
    if has_second_person_pronoun and (has_question_word or has_question_mark):
        return True

    question_back_phrases = [
        "neenga saaptiya", "neenga saaptingala", "neenga saaptengala",
        "saaptiya appa", "saaptiya paa", "saaptingala appa", "saaptiya",
        "did you eat", "have you eaten", "what about you"
    ]
    return any(p in normalized for p in question_back_phrases)


def has_first_person_eating_statement(text):
    """
    Detect if utterance contains a 1st-person statement about own eating status.
    Examples in Tamil/Tanglish:
      - 'saaptaen', 'saapten', 'saapitten', 'saptaen', 'saaptuten', 'saaptutten'
      - 'naan saaptaen', 'naan saapitten'
      - 'i ate', 'already ate', 'had lunch', 'had food', 'finished lunch'
      - negative eating status: 'innum illa', 'innum saapala', 'saapala', 'haven't eaten'
    """
    normalized = normalize_text(text)
    tokens = set(normalized.split())

    first_person_eating_tokens = {
        "saaptaen", "saapten", "saapitten", "saptaen", "saaptuten", "saaptutten",
        "chaaptaen", "chaapitten", "chaapidden", "ate", "saapala", "sapala"
    }
    if bool(tokens & first_person_eating_tokens):
        return True

    first_person_eating_phrases = [
        "naan saap", "i ate", "already ate", "had food", "had lunch", "had dinner",
        "finished food", "finished lunch", "finished eating", "innum saapala",
        "innum illa"
    ]
    return any(p in normalized for p in first_person_eating_phrases)


def is_pure_question_back(text):
    """
    Returns True if the utterance is purely asking the interlocutor a question
    WITHOUT answering their own state (e.g. 'neenga saaptiya?' vs 'Naan saapitten paa, neenga saaptiya?').
    """
    if not is_question_directed_at_interlocutor(text):
        return False
    if has_first_person_eating_statement(text):
        return False
    if is_yes_answer(text) or is_no_answer(text):
        return False
    return True


def is_eating_answer(text):
    """
    Determines if text validly indicates own eating status.
    Rejects pure questions directed at interlocutor ('neenga saaptiya?')
    and unrelated requests ('5 min appa').
    """
    normalized = normalize_text(text)
    tokens = set(normalized.split())

    if is_pure_question_back(text):
        return False

    if has_first_person_eating_statement(text):
        return True

    if is_yes_answer(text) or is_no_answer(text):
        if not any(w in tokens for w in ["min", "mins", "minutes", "wait", "irunga"]):
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
    formal_tokens = {
        "appa", "amma", "sir", "teacher", "mam", "ma'am", "maam",
        "madam", "medam", "miss", "missy", "uncle", "aunty"
    }
    uses_formal_register = bool(tokens & formal_tokens)

    # --- Completion / Confirmation markers ---
    completion_tokens = {
        "finished", "done", "completed", "ready", "aachu", "aayiduchu", "panniyachu"
    }
    has_completion = any(
        token in completion_tokens
        or token.startswith("mudich")
        or token.startswith("mudinj")
        or token.startswith("pannit")
        for token in tokens
    )

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

    # --- Polite Interruption markers (e.g. 'Excuse me', 'Oru nimisham') ---
    has_polite_interruption = (
        "excuse me" in normalized
        or "oru nimisham" in normalized
        or "sorry to interrupt" in normalized
        or "oru minute" in normalized
    )

    # --- Greeting markers ---
    greeting_tokens = ["good morning", "good afternoon", "good evening", "vanakkam", "namaskaram", "hello", "hi"]
    has_greeting = any(g in normalized for g in greeting_tokens)

    # --- Hostile / Disrespectful markers ---
    hostile_phrases = ["get lost", "shut up", "no way", "go away", "it is mine", "its mine", "move", "stupid"]
    has_hostile = any(h in normalized for h in hostile_phrases)

    # --- Interlocutor Question vs First-Person State ---
    is_q_back = is_question_directed_at_interlocutor(text)
    is_pure_q_back = is_pure_question_back(text)
    has_first_person_eating = has_first_person_eating_statement(text)

    return {
        "has_affirmative": has_affirmative,
        "has_come_marker": has_come_marker,
        "has_activity_verb": has_activity_verb,
        "has_completion": has_completion,
        "uses_peer_register": uses_peer_register,
        "uses_formal_register": uses_formal_register,
        "has_refusal": has_refusal,
        "has_uncertainty": has_uncertainty,
        "has_request": has_request,
        "has_polite_interruption": has_polite_interruption,
        "has_greeting": has_greeting,
        "has_hostile": has_hostile,
        "is_question_back": is_q_back,
        "is_pure_question_back": is_pure_q_back,
        "has_first_person_eating": has_first_person_eating,
    }


def classify_response_intent(text):
    """
    Classify the pragmatic intent of a response using extracted features.

    Returns an intent label that can be matched against the scenario's
    required_communication.intent or inferred scenario goal.

    Possible return values:
      "task_completion"    — child confirms task is finished/done
      "incomplete_task"    — child indicates task is not finished
      "social_acceptance"  — child is accepting/agreeing to engage or greeting
      "social_refusal"     — child is politely declining
      "hostile_refusal"    — child is aggressively/rudely refusing
      "uncertainty"        — child indicates they do not know
      "contextual_request" — child asks for time/clarification
      "AnswerQuestion"     — child answers the question directly about self
      "PoliteInterruption" — child uses polite interruption phrase
      "question_back"      — child asks a question directed at interlocutor
      "unknown"            — cannot determine intent
    """
    features = extract_linguistic_features(text)

    if features.get("has_hostile"):
        return "hostile_refusal"

    if features.get("is_pure_question_back"):
        return "question_back"

    if features.get("has_polite_interruption"):
        return "PoliteInterruption"

    if features.get("has_first_person_eating"):
        return "AnswerQuestion"

    if features.get("has_greeting"):
        return "social_acceptance"

    affirmative_signals = (
        features["has_affirmative"]
        or features["has_come_marker"]
        or features["has_activity_verb"]
    )

    if features["has_uncertainty"]:
        return "uncertainty"

    if features["has_request"]:
        return "contextual_request"

    if features["has_refusal"]:
        if features.get("has_completion"):
            return "incomplete_task"
        if not affirmative_signals:
            return "social_refusal"

    if features.get("has_completion"):
        return "task_completion"

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

    normalized = normalize_text(text)

    # Eating status meaning check (e.g. father_02 "Indicate whether they have eaten.")
    if _eating_meaning(meaning):
        return is_eating_answer(normalized)

    # Polite interruption meaning check
    if "interruption" in (meaning or "").lower() or "excuse" in (meaning or "").lower() or intent == "PoliteInterruption":
        return "excuse me" in normalized or "oru nimisham" in normalized or "sorry to interrupt" in normalized

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

    if response_type in ("social_acceptance", "peer_cooperation", "peer_invitation", "SocialAcceptance"):
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

        if response_intent == "hostile_refusal":
            return {
                "normalized": normalized_response,
                "expected": expected,
                "matched": False,
                "semantic_score": 0.0,
                "inferred_intent": "hostile_refusal"
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
    # STRANGER SAFETY REFUSAL MATCHING
    # --------------------------------------------------------

    if response_type in ("safety_refusal", "SafetyRefusal", "safe_refusal", "uncertainty"):
        response_intent = classify_response_intent(normalized_response)

        if response_intent in ("safety_refusal", "uncertainty", "social_refusal"):
            return {
                "normalized": normalized_response,
                "expected": expected,
                "matched": True,
                "semantic_score": 0.88,
                "inferred_intent": response_intent
            }

        return {
            "normalized": normalized_response,
            "expected": expected,
            "matched": False,
            "semantic_score": 0.0,
            "inferred_intent": response_intent
        }

    # --------------------------------------------------------
    # TASK COMPLETION / CONFIRMATION MATCHING
    # --------------------------------------------------------

    if response_type in ("task_completion", "homework_completed", "completion"):
        response_intent = classify_response_intent(normalized_response)

        if response_intent == "task_completion":
            return {
                "normalized": normalized_response,
                "expected": expected,
                "matched": True,
                "semantic_score": 0.90,
                "inferred_intent": "task_completion"
            }

        if response_intent == "incomplete_task":
            return {
                "normalized": normalized_response,
                "expected": expected,
                "matched": True,
                "semantic_score": 0.75,
                "inferred_intent": "incomplete_task"
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
