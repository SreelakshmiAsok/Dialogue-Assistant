import os
import sys

# Disable hanging neural downloads during local automated testing
os.environ["DISABLE_NEURAL_MODEL"] = "1"

sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
sys.path.append(os.path.join(os.path.dirname(__file__), 'reasoning'))

from engines.semantic_engine import (
    extract_linguistic_features,
    classify_response_intent,
    semantic_match,
    is_eating_answer,
    is_question_directed_at_interlocutor,
    is_pure_question_back
)
from engines.nlp_semantic_engine import semantic_similarity
from reasoner import SocialOntologyReasoner

reasoner = SocialOntologyReasoner()

test_cases = [
    # --- 1. FATHER MEALS SCENARIO (father_02) ---
    {
        "name": "Father Meals - First-Person Eating Answer (Positive)",
        "role": "Father",
        "context": "Meals",
        "scenario_id": "father_02",
        "expected_goal": "AnswerQuestion",
        "expected": "Saaptaen appa",
        "input": "Saaptaen appa",
        "politeness": True,
        "required_communication": {
            "intent": "AnswerQuestion",
            "meaning": "Indicate whether they have eaten."
        },
        "should_match": True,
        "should_be_appropriate": True
    },
    {
        "name": "Father Meals - Contextual Request (5 min appa - NOT eating answer)",
        "role": "Father",
        "context": "Meals",
        "scenario_id": "father_02",
        "expected_goal": "AnswerQuestion",
        "expected": "Saaptaen appa",
        "input": "5 min appa",
        "politeness": True,
        "required_communication": {
            "intent": "AnswerQuestion",
            "meaning": "Indicate whether they have eaten."
        },
        "should_match": False,  # MUST NOT match eating requirement
        "should_be_appropriate": True  # Socially valid request, but not an eating answer
    },
    {
        "name": "Father Meals - Pure Question Back (neenga saaptiya? - NOT eating answer)",
        "role": "Father",
        "context": "Meals",
        "scenario_id": "father_02",
        "expected_goal": "AnswerQuestion",
        "expected": "Saaptaen appa",
        "input": "neenga saaptiya?",
        "politeness": True,
        "required_communication": {
            "intent": "AnswerQuestion",
            "meaning": "Indicate whether they have eaten."
        },
        "should_match": False,  # MUST NOT match because child asked question back without answering
        "should_be_appropriate": False
    },
    {
        "name": "Father Meals - Answers Own State + Polite Question Back",
        "role": "Father",
        "context": "Meals",
        "scenario_id": "father_02",
        "expected_goal": "AnswerQuestion",
        "expected": "Saaptaen appa",
        "input": "Naan saapitten paa, neenga saaptiya?",
        "politeness": True,
        "required_communication": {
            "intent": "AnswerQuestion",
            "meaning": "Indicate whether they have eaten."
        },
        "should_match": True,  # MUST match because states own eating status
        "should_be_appropriate": True
    },

    # --- 2. STRANGER SAFETY SCENARIO ---
    {
        "name": "Stranger - Dangerous Acceptance",
        "role": "Stranger",
        "context": "Park",
        "scenario_id": "stranger_01",
        "expected_goal": "SafetyRefusal",
        "expected": "Theriyadhu sir",
        "input": "Sure uncle I love chocolate and puppy",
        "politeness": True,
        "required_communication": {
            "intent": "SafetyRefusal",
            "meaning": "Refuse stranger and call parent."
        },
        "should_match": False,
        "should_have_violation": True
    },
    {
        "name": "Stranger - Safe Uncertainty Refusal",
        "role": "Stranger",
        "context": "Park",
        "scenario_id": "stranger_01",
        "expected_goal": "SafetyRefusal",
        "expected": "Theriyadhu sir",
        "input": "therila medam, amma kitta poren",
        "politeness": True,
        "required_communication": {
            "intent": "SafetyRefusal",
            "meaning": "Refuse stranger and call parent."
        },
        "should_match": True,
        "should_be_appropriate": True
    },

    # --- 3. TEACHER FORMAL DECORUM SCENARIO ---
    {
        "name": "Teacher - Polite Greeting",
        "role": "Teacher",
        "context": "Classroom",
        "scenario_id": "teacher_01",
        "expected_goal": "SocialAcceptance",
        "expected": "Good morning teacher",
        "input": "Good morning Ms. Priya!",
        "politeness": True,
        "should_match": True,
        "should_be_appropriate": True
    },
    {
        "name": "Teacher - Disrespectful Rude Response",
        "role": "Teacher",
        "context": "Classroom",
        "scenario_id": "teacher_01",
        "expected_goal": "SocialAcceptance",
        "expected": "Good morning teacher",
        "input": "shut up and move",
        "politeness": False,
        "should_match": False,
        "should_have_violation": True
    },

    # --- 4. PEER COOPERATION SCENARIO ---
    {
        "name": "Peer - Cooperative Play Acceptance",
        "role": "Peer",
        "context": "Playground",
        "scenario_id": "peer_01",
        "expected_goal": "social_acceptance",
        "expected": "Va da, vilayaadalaam",
        "input": "Vaa vaadaa vilayadalam",
        "politeness": True,
        "should_match": True,
        "should_be_appropriate": True
    },
    {
        "name": "Peer - Hostile Refusal",
        "role": "Peer",
        "context": "Playground",
        "scenario_id": "peer_01",
        "expected_goal": "social_acceptance",
        "expected": "Va da, vilayaadalaam",
        "input": "No way, get lost it is mine!",
        "politeness": False,
        "should_match": False,
        "should_have_violation": True
    }
]

print("=" * 70)
print("TALKWISE ONTOLOGY & SEMANTIC ENGINE COMPREHENSIVE TEST SUITE")
print("=" * 70)

all_passed = True

for tc in test_cases:
    print(f"\n[Test] {tc['name']}")
    print(f"  Role: {tc['role']} | Context: {tc['context']} | Scenario: {tc.get('scenario_id')}")
    print(f"  Input: \"{tc['input']}\"")
    
    # 1. Semantic Engine matching
    scenario_meta = {
        "expected": tc["expected"],
        "required_communication": tc.get("required_communication", {}),
        "response_type": tc.get("expected_goal")
    }
    match_result = semantic_match(tc["input"], scenario_meta)
    
    # 2. Linguistic features & intent
    intent = classify_response_intent(tc["input"])
    sim = semantic_similarity(tc["input"], tc["expected"])
    
    # 3. Ontology Reasoner query
    onto_result = reasoner.evaluate_utterance(
        role=tc["role"],
        context=tc["context"],
        utterance_text=tc["input"],
        intent=intent,
        has_politeness=tc.get("politeness", True),
        semantic_similarity=sim,
        expected_goal=tc.get("expected_goal"),
        scenario_id=tc.get("scenario_id")
    )

    print(f"  -> Inferred Intent: {intent}")
    print(f"  -> Semantic Matched: {match_result['matched']} (Score: {match_result['semantic_score']})")
    print(f"  -> Ontology Appropriate: {onto_result['is_appropriate']}")
    print(f"  -> Ontology Scenario Node: {onto_result.get('scenario_individual')}")
    print(f"  -> Ontology Reasoning: {onto_result['inference_details']}")
    if onto_result["has_violations"]:
        print(f"  -> Ontology Violations: {onto_result['rules']}")

    # Verifications
    passed = True
    if "should_match" in tc and match_result["matched"] != tc["should_match"]:
        print(f"  FAILED: expected matched={tc['should_match']}, got {match_result['matched']}")
        passed = False
    
    if "should_be_appropriate" in tc and onto_result["is_appropriate"] != tc["should_be_appropriate"]:
        print(f"  FAILED: expected is_appropriate={tc['should_be_appropriate']}, got {onto_result['is_appropriate']}")
        passed = False

    if tc.get("should_have_violation") and not onto_result["has_violations"]:
        print(f"  FAILED: expected violations, but none detected")
        passed = False

    if passed:
        print("  PASSED")
    else:
        all_passed = False

print("\n" + "=" * 70)
if all_passed:
    print("ALL TESTS PASSED! Ontology & Semantic Engine reasoning working as designed.")
else:
    print("SOME TESTS FAILED. Please review the output above.")
print("=" * 70)
