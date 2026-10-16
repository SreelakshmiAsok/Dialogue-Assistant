import os
import json

tier1_dir = r"d:\FINAL\review 1 phase 2\Dialogue-Assistant\lessons\tier1"

def determine_tier1_metadata(char, qid, lesson_data):
    char_lower = char.lower()
    resp_req = lesson_data.get("respect_required", True)
    
    # Defaults
    target_intent = "AnswerQuestion"
    allowed_intents = []
    violating_intents = ["DisrespectfulInformal", "HostileRefusal"] if resp_req else ["HostileRefusal"]
    required_features = ["RespectWord"] if char_lower in ("father", "parent") else (["Honorific"] if char_lower == "teacher" else [])
    
    if char_lower in ("father", "parent"):
        if qid in ("father_08", "father_25"):
            target_intent = "PoliteRequest"
            allowed_intents = ["AnswerQuestion"]
        elif qid in ("father_09", "father_21"):
            target_intent = "HonestApology"
            allowed_intents = ["TaskCompletionConfirmation"]
        elif qid == "father_15":
            target_intent = "CooperativeSuggestion"
            allowed_intents = ["TaskCompletionConfirmation"]
        else:
            target_intent = "TaskCompletionConfirmation"
            allowed_intents = ["SocialAcceptance", "PoliteRefusal"]
            
    elif char_lower == "teacher":
        if qid in ("teacher_04", "teacher_12", "teacher_13"):
            target_intent = "PoliteRequest"
            allowed_intents = ["AnswerQuestion"]
        elif qid in ("teacher_15", "teacher_21"):
            target_intent = "HonestApology"
        elif qid in ("teacher_01", "teacher_02", "teacher_05", "teacher_08", "teacher_11", "teacher_17", "teacher_18", "teacher_19", "teacher_23", "teacher_24", "teacher_25"):
            target_intent = "AnswerQuestion"
            allowed_intents = ["TaskCompletionConfirmation"]
        else:
            target_intent = "TaskCompletionConfirmation"
            allowed_intents = ["SocialAcceptance"]
            
    elif char_lower in ("friend", "peer"):
        violating_intents = ["HostileRefusal"]
        required_features = []
        if qid in ("friend_08", "friend_14", "friend_20"):
            target_intent = "CooperativeSuggestion"
            allowed_intents = ["SocialAcceptance", "PoliteRefusal"]
        elif qid == "friend_11":
            target_intent = "TaskCompletionConfirmation"
            allowed_intents = ["SocialAcceptance", "PoliteRefusal"]
        elif qid == "friend_13":
            target_intent = "SocialAcceptance"
            allowed_intents = ["PoliteRefusal"]
        else:
            target_intent = "SocialAcceptance"
            allowed_intents = ["PoliteRefusal", "CooperativeSuggestion"]
            
    elif char_lower == "stranger":
        required_features = ["Honorific"]
        if qid == "stranger_22":
            # Safety refusal
            target_intent = "SafetyRefusal"
            allowed_intents = ["PoliteRefusal"]
            violating_intents = ["StrangerCompliance", "SocialAcceptance"]
            required_features = ["FirmNo"]
        elif qid in ("stranger_01", "stranger_02", "stranger_04", "stranger_05", "stranger_06", "stranger_07", "stranger_08", "stranger_09", "stranger_10", "stranger_19"):
            target_intent = "AnswerQuestion"
            allowed_intents = ["UncertaintyResponse", "SocialAcceptance"]
            violating_intents = ["HostileRefusal", "DisrespectfulInformal"]
        elif qid == "stranger_03":
            target_intent = "SocialAcceptance"
            allowed_intents = ["AnswerQuestion"]
            violating_intents = ["HostileRefusal"]
        else:
            target_intent = "AnswerQuestion"
            allowed_intents = ["UncertaintyResponse"]
            violating_intents = ["HostileRefusal", "DisrespectfulInformal"]
            
    return target_intent, allowed_intents, violating_intents, required_features

print("=== UNIFYING TIER 1 LESSONS WITH TURNS SCHEMA ===")
count = 0
for char in ["father", "friend", "stranger", "teacher"]:
    char_dir = os.path.join(tier1_dir, char)
    if not os.path.isdir(char_dir):
        continue
    for f in sorted(os.listdir(char_dir)):
        if not f.endswith(".json"):
            continue
        filepath = os.path.join(char_dir, f)
        with open(filepath, "r", encoding="utf-8") as fp:
            d = json.load(fp)
            
        qid = d.get("id")
        char_name = d.get("character")
        prompt_tanglish = d.get("question_tanglish", "")
        prompt_tamil = d.get("question_tamil", "")
        exp_answers = d.get("expected_answers", [])
        model_ans = d.get("model_answer", exp_answers[0] if exp_answers else "")
        
        target_intent, allowed, violating, req_feats = determine_tier1_metadata(char_name, qid, d)
        
        # Build turn_1
        turn_1 = {
            "turn_id": "turn_1",
            "step_number": 1,
            "prompt": {
                "tanglish": prompt_tanglish,
                "tamil": prompt_tamil
            },
            "target_intent": target_intent,
            "allowed_intents": allowed,
            "violating_intents": violating,
            "required_features": req_feats,
            "expected_responses": exp_answers,
            "model_answer": model_ans,
            "feedback": {
                "hint": f"Respond politely to {char_name}.",
                "gentle_correction": f"Try saying: '{model_ans}'"
            },
            "next_turn_id": None,
            "is_terminal": True
        }
        
        # Attach unified schema turns while preserving backwards compatibility fields
        d["turns"] = [turn_1]
        d["scenario"] = d.get("social_story", "")
        d["topic"] = d.get("lesson", "")
        
        with open(filepath, "w", encoding="utf-8") as fp:
            json.dump(d, fp, indent=2, ensure_ascii=False)
            
        count += 1

print(f"Successfully unified {count} Tier 1 lessons into the single Turns Schema!")
