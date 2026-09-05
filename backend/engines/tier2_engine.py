from engines.semantic_engine import combined_similarity
from nlp.preprocessing import normalize_text
from nlp.bad_words_filter import check_inappropriate
from engines.rule_engine import check_respect

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
        return _build_failure(turn, False, bad_check["gentle_message"], model_answer, safety_score, 0, 0, retry_count)
        
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
        ]
    }
    
    features_met = True
    for req_feat in required_features:
        if req_feat in feature_lexicon:
            # Check if any synonym exists as substring or token in normalized text
            synonyms = feature_lexicon[req_feat]
            has_feature = any(syn in normalized for syn in synonyms)
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
        
    return {
        "correct": correct,
        "stars_awarded": 0,
        "feedback": feedback,
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
