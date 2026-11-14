import re
from engines.semantic_engine import combined_similarity
from nlp.preprocessing import normalize_text
from nlp.bad_words_filter import check_inappropriate
from engines.rule_engine import check_respect

import random

# NO appreciation after individual answers. Exactly ONE closing appreciation is given when the
# whole conversation is completed (varied, natural everyday Tamil/Tanglish, never one fixed line).
FINAL_PRAISE = [
    "செம! நல்லா பேசிருக்க. குட் ஜாப்!",
    "நல்லா பேசுன! ரொம்ப நல்லா பண்ணிருக்க.",
    "வெரி குட்! கரெக்டா எல்லாம் சொல்லிட்ட.",
    "குட் ஜாப்! நல்லா கான்வர்சேஷன் பண்ண.",
    "செம, நல்லா பேசிருக்க! இதே மாதிரி கண்டினியூ பண்ணு.",
    "நைஸ்! முழுசா நல்லா பேசி முடிச்சிட்ட.",
]
# Conversation finished only after retries ran out: gentle encouragement, not praise.
FINAL_ENCOURAGE = [
    "நல்லா ட்ரை பண்ண! அடுத்த தடவ இன்னும் நல்லா வரும்.",
    "பரவால்ல, முடிச்சிட்ட. இன்னொரு தடவ ட்ரை பண்ணலாம்.",
]


def final_message(forced=False):
    return random.choice(FINAL_ENCOURAGE if forced else FINAL_PRAISE)


# Any reasonable school name is a valid answer to "which school?": the intent is "mentions a school".
_SCHOOL_STEMS = re.compile(
    r"school|skool|skul|vi[dt]h?y|college|academy|convent|matric|public|govt|government|"
    r"aided|cbse|icse|nursery|kendriy|navodaya|ashram|palli|padik|study|studying|class|"
    r"\bkv\b|\bdav\b|\bst\b|saint|ch?eyin|seyin|sain[dt]|mer(?:i|ee)|sri\b|shri\b",
    re.IGNORECASE,
)


def _looks_like_school(raw, normalized):
    """True for 'Kendriya Vidyalaya', "St. Mary's", 'Amrita Vidyalayam', 'Govt school', 'Sunrise Matric'."""
    text = f"{raw or ''} {normalized or ''}"
    if _SCHOOL_STEMS.search(text):
        return True
    words = re.findall(r"[A-Za-z][A-Za-z'.]*", raw or "")
    capitalised = [w for w in words if w[0].isupper()]
    return 2 <= len(words) <= 5 and len(capitalised) >= len(words) - 1
TA_RETRY = "இன்னொரு தடவ ட்ரை பண்ணு."
TA_SAFE = "நல்ல வார்த்தைய யூஸ் பண்ணலாம். இன்னொரு தடவ மெதுவா சொல்லு."


def _say_this_ta(turn):
    ans = turn.get("model_answer_tamil")
    return f"இப்படி சொல்லிப் பாரு: {ans}" if ans else TA_RETRY


def evaluate_tier2_turn(lesson, turn, response, retry_count):
    """
    Evaluates the child's response for a specific turn in a Tier 2 lesson.
    
    Returns:
    {
        "correct": bool,
        "stars_awarded": int,
        "feedback": str,
        "suggestion": str,
        "next_character_reply": dict (tanglish, tamil),
        "next_turn_id": str or None,
        "is_completed": bool,
        "scores": { "politeness": int, "safety": int, "relevance": int }
    }
    """
    character = lesson["character"]
    expected_responses = turn["expected_responses"]
    model_answer = turn["model_answer"]
    max_retries = turn.get("max_retries", 2)
    
    # 1. Safety / Inappropriate Check
    bad_check = check_inappropriate(response, character)
    safety_score = 0 if bad_check["is_inappropriate"] else 5
    
    if bad_check["is_inappropriate"]:
        result = _build_failure(turn, False, bad_check["gentle_message"], model_answer, safety_score, 0, 0, retry_count)
        if not result["correct"]:
            result["feedback_tamil"] = TA_SAFE
        return result
        
    normalized = normalize_text(response)
    
    # ----------------------------------------------------
    # SEMANTIC FEATURE EXTRACTION (ONTOLOGY-DRIVEN)
    # ----------------------------------------------------
    required_features = turn.get("required_features", [])
    
    # Define comprehensive semantic lexicons for our ontological features
    feature_lexicon = {
        "RespectWord": ["appa", "amma", "pa", "ma", "please", "appaa", "ammaa"],
        "TimeExtension": [
            "minutes", "minute", "min", "time", "neram", "nimisham", "nimisam", "wait", "konjam", 
            "5", "5 minutes", "5 min", "five", "five minutes", "innum", "oru"
        ],
        "PromiseKeyword": [
            "promise", "kandippa", "kandippaa", "sathiyama", "sathiyamaa", "sure", "ok", "ok pa", 
            "ok appa", "panren", "pannuren", "padikanum", "seri"
        ],
        
        "Honorific": ["miss", "mam", "ma'am", "teacher", "sir", "missy", "madam"],
        "RestroomIntent": [
            "restroom", "bathroom", "toilet", "washroom", "pee", "pogalama", "poganum", 
            "poyitu", "poitu", "veliye", "urgent"
        ],
        "ThankYou": ["thank", "thanks", "thank you", "nandri", "nanri", "seri miss", "ok miss"],
        
        "Greeting": ["hi", "hello", "hey", "vanakkam", "mapla", "machan", "friend"],
        "JoinIntent": [
            "play", "join", "kooda", "game", "vilayadalama", "vilayada", "vilayadava", 
            "chance", "thariya", "naanum", "cricket", "batting"
        ],
        "JoinPlay": [
            "play", "join", "kooda", "game", "vilayadalama", "vilayada", "vilayadava", 
            "chance", "thariya", "naanum", "cricket", "batting"
        ],
        "Acceptance": [
            "ok", "sure", "seri", "kandippa", "yes", "aama", "ready", "super", "naan", 
            "batting", "panren", "pannuren"
        ],
        
        "FirmNo": [
            "no", "venam", "venaam", "vendam", "illa", "illai", "maten", "maaten", "stop", 
            "poda", "ponga", "don't", "dont"
        ],
        "MentionAdult": [
            "amma", "appa", "parent", "teacher", "mom", "dad", "theduvanga", "kitta", 
            "police", "poren", "kupduven", "solluven"
        ],

        # --- Friend introduction scenario ---
        "NameIntro": [
            "name", "peru", "peyar", "naan", "nan", "en", "my", "am", "im"
        ],
        "SchoolMention": [
            "school", "skool", "padikiren", "padikkiren", "padikuren", "padikren",
            "padikkuren", "padikaren", "study", "studying", "college", "class"
        ],

        # --- New Empathy scenario (Friend - hurt) ---
        "EmpathyKeyword": [
            "ennachu", "valikudha", "okay", "괜찮아", "sorry", "onnum", "ok va",
            "are you okay", "hurt", "valikudhu", "enna achu"
        ],
        "HelpKeyword": [
            "help", "kupudren", "kupudrava", "teacher", "solluven", "poi", "kuppidu",
            "kaapaten", "irunga", "announcement", "kanom"
        ],

        # --- New Polite Interruption scenario (Father - phone) ---
        "ExcuseMeKeyword": [
            "excuse", "excuse me", "sorry", "oru nimisham", "interrupt", "wait", "appa"
        ],

        # --- New Safe Stranger / Lost scenario ---
        "LostKeyword": [
            "kanom", "tholanjiten", "lost", "appava", "announcement", "mic", "find",
            "theduren", "thedra"
        ],

        # --- New Teacher Clarification scenario ---
        "DoubtKeyword": [
            "doubt", "doubt iruku", "puriyala", "question", "enna doubt"
        ],
        "ClarificationKeyword": [
            "puriyala", "thirumba", "explain", "again", "understand", "homework",
            "solreengala", "panreengala"
        ]
    }
    
    features_met = True
    for req_feat in required_features:
        if req_feat in feature_lexicon:
            # Match whole tokens to avoid naive substring matches (e.g. 'pa' in 'panren')
            synonyms = feature_lexicon[req_feat]
            has_feature = any(
                bool(re.search(r'\b' + re.escape(syn) + r'\b', normalized))
                for syn in synonyms
            )
            if req_feat == "SchoolMention" and not has_feature:
                has_feature = _looks_like_school(response, normalized)
            if not has_feature:
                features_met = False
                break
                
    # Also calculate standard semantic similarity for general relevance
    best_semantic = 0.0
    for expected in expected_responses:
        score = combined_similarity(normalized, expected)
        if score > best_semantic:
            best_semantic = score
            
    relevance_score = int(best_semantic * 5)
    
    # A turn is matched if:
    # 1. It hits required semantic features AND has at least minimal contextual relevance
    # 2. OR if it closely matches any expected response (>= 0.65)
    # 3. OR if it is an exact token overlap with expected responses
    matched = (features_met and len(normalized.split()) >= 1) or (best_semantic >= 0.65)
    
    # 3. Rules & Respect Check
    respect_ok = check_respect(response, character=character)
    politeness_score = 5 if respect_ok else 2
    
    # We no longer hard-fail matched = False for authority figures here.
    # We want to decouple semantic meaning from stylistic honorifics.
    
    # Build Evaluation Result
    if matched:
        suggestion = None
        if not respect_ok:
            suggestion = f"You could also say '{model_answer}' if you want to address them directly."
            
        return {
            "correct": True,
            "stars_awarded": 1,
            "feedback": "Great job! You said the right thing.",
            "feedback_tamil": "",
            "final_appreciation_tamil": final_message() if turn.get("is_terminal", False) else "",
            "suggestion": suggestion,
            "next_character_reply": turn["next_character_reply"],
            "next_turn_id": turn.get("next_turn_id"),
            "is_completed": turn.get("is_terminal", False),
            "scores": {
                "politeness": politeness_score,
                "safety": safety_score,
                "relevance": relevance_score
            }
        }
    else:
        # Failed - Provide hints based on retry count
        return _build_failure(turn, True, None, model_answer, safety_score, politeness_score, relevance_score, retry_count)

def _build_failure(turn, safe, custom_msg, model_answer, safety, politeness, relevance, retry_count):
    max_retries = turn.get("max_retries", 2)
    feedback_obj = turn.get("feedback", {})
    
    if custom_msg:
        feedback = custom_msg
        suggestion = None
    elif retry_count < max_retries - 1:
        feedback = feedback_obj.get("hint", "Try again!")
        suggestion = None
    else:
        feedback = feedback_obj.get("gentle_correction", f"Try saying: {model_answer}")
        suggestion = model_answer
        
    is_completed = False
    next_character_reply = None
    next_turn_id = turn["turn_id"] # Stay on current turn
    correct = False
    
    # If they maxed out retries, let them gracefully advance
    if retry_count >= max_retries:
        correct = True # Force advance
        feedback = "Let's keep going! Next time try saying: " + model_answer
        next_character_reply = turn["next_character_reply"]
        next_turn_id = turn.get("next_turn_id")
        is_completed = turn.get("is_terminal", False)
        
    if retry_count >= max_retries:
        feedback_tamil = "பரவால்ல, அடுத்து போலாம். நெக்ஸ்ட் டைம் இப்படி சொல்லு: " + (turn.get("model_answer_tamil") or "")
    elif retry_count < max_retries - 1:
        feedback_tamil = feedback_obj.get("hint_tamil") or TA_RETRY
    else:
        feedback_tamil = _say_this_ta(turn)

    return {
        "correct": correct,
        "stars_awarded": 0,
        "feedback": feedback,
        "feedback_tamil": feedback_tamil,
        "final_appreciation_tamil": final_message(forced=True) if (correct and is_completed) else "",
        "suggestion": suggestion,
        "next_character_reply": next_character_reply,
        "next_turn_id": next_turn_id,
        "is_completed": is_completed,
        "scores": {
            "politeness": politeness,
            "safety": safety,
            "relevance": relevance
        }
    }
