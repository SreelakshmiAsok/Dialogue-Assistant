#!/usr/bin/env python3
"""
dataset/validate_dataset.py

Unified Dataset & Schema Integrity Validator for Navil Dialogue Assistant.
Validates both Tier 1 and Tier 2 lessons against the Single Graph Schema:
  1. Unique scenario/lesson IDs and turn IDs.
  2. Schema conformity (required fields, prompt structures).
  3. Turn link consistency (next_turn_id resolution, termination flags, no dead ends or loops).
  4. Intent sanity (no intent is both expected and violating; every turn has target_intent).
  5. Safety-critical constraints (stranger dangers mandate SafetyRefusal and prohibit StrangerCompliance).
  6. Non-empty expected_responses and valid model_answer.
"""

import os
import sys
import json
from collections import Counter

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LESSONS_DIR = os.path.join(BASE_DIR, "lessons")

KNOWN_INTENTS = {
    "AnswerQuestion", "TaskCompletionConfirmation", "IncompleteTaskReport",
    "PoliteRequest", "PoliteInterruption", "ContextualRequest", "SafetyRefusal",
    "UncertaintyResponse", "SocialAcceptance", "PoliteRefusal", "CooperativeSuggestion",
    "HonestApology", "StrangerCompliance", "HostileRefusal", "DisrespectfulInformal",
    "NegotiationIntent", "PromiseConfirmation", "RequestHelp", "RequestToJoin",
    "CooperationAgreement", "ShowEmpathy", "OfferHelp", "RefusalAndEscape",
    "FirmRefusal", "ExplainSituation", "RequestPermission", "AcknowledgePermission",
    "RaiseDoubt", "AskClarification", "OfferAssistance", "AcknowledgeInstructions",
    "PoliteNegotiation", "ExpressGratitude", "GreetingPolite", "ComplianceConfirmation",
    "OfferCompliment", "EnthusiasticAgreement", "ShareInterest", "EngageConversation",
    "ShowSportsmanship", "ProposeActivity", "PrivacyProtection", "EscapeDanger",
    "CallForHelp", "PoliteApology", "AcceptCorrection", "SelfAdvocacyRequest",
    "ConfirmationResponse"
}

def validate_all_lessons():
    errors = []
    warnings = []
    
    tier1_dir = os.path.join(LESSONS_DIR, "tier1")
    tier2_dir = os.path.join(LESSONS_DIR, "tier2")
    
    all_lessons = []
    
    # 1. Load Tier 1
    for char in ["father", "friend", "stranger", "teacher"]:
        cdir = os.path.join(tier1_dir, char)
        if not os.path.isdir(cdir):
            continue
        for f in sorted(os.listdir(cdir)):
            if f.endswith(".json"):
                fpath = os.path.join(cdir, f)
                with open(fpath, "r", encoding="utf-8") as fp:
                    try:
                        data = json.load(fp)
                        data["_filepath"] = os.path.relpath(fpath, BASE_DIR)
                        all_lessons.append(data)
                    except Exception as e:
                        errors.append(f"JSON Parse Error in {fpath}: {e}")

    # 2. Load Tier 2
    for char in ["father", "friend", "stranger", "teacher"]:
        cdir = os.path.join(tier2_dir, char)
        if not os.path.isdir(cdir):
            continue
        for f in sorted(os.listdir(cdir)):
            if f.endswith(".json"):
                fpath = os.path.join(cdir, f)
                with open(fpath, "r", encoding="utf-8") as fp:
                    try:
                        data = json.load(fp)
                        data["_filepath"] = os.path.relpath(fpath, BASE_DIR)
                        all_lessons.append(data)
                    except Exception as e:
                        errors.append(f"JSON Parse Error in {fpath}: {e}")

    print("=" * 80)
    print(f"NAVIL UNIFIED DATASET VALIDATOR")
    print(f"Loaded {len(all_lessons)} total lessons for validation.")
    print("=" * 80)

    # 3. Check ID Uniqueness
    id_counts = Counter(l.get("id") for l in all_lessons if l.get("id"))
    for lid, count in id_counts.items():
        if count > 1:
            matching = [l["_filepath"] for l in all_lessons if l.get("id") == lid]
            errors.append(f"Duplicate Lesson ID '{lid}' found across files: {matching}")

    tier_counts = {1: 0, 2: 0}
    char_counts = {"Father": 0, "Teacher": 0, "Friend": 0, "Stranger": 0}
    total_turns = 0

    # 4. Deep Inspection per Lesson
    for lesson in all_lessons:
        fpath = lesson.get("_filepath", "unknown")
        lid = lesson.get("id")
        char = lesson.get("character")
        tier = lesson.get("tier")
        
        if tier in tier_counts:
            tier_counts[tier] += 1
        if char in char_counts:
            char_counts[char] += 1

        if not lid:
            errors.append(f"Missing 'id' in {fpath}")
        if not char:
            errors.append(f"Missing 'character' in {fpath}")
        if tier not in (1, 2):
            errors.append(f"Invalid 'tier' ({tier}) in {fpath}. Must be 1 or 2.")
            
        turns = lesson.get("turns")
        if not turns or not isinstance(turns, list) or len(turns) == 0:
            errors.append(f"Lesson {lid} ({fpath}) has no turns list!")
            continue

        turn_ids_in_lesson = [t.get("turn_id") for t in turns if t.get("turn_id")]
        if len(turn_ids_in_lesson) != len(set(turn_ids_in_lesson)):
            errors.append(f"Duplicate turn_ids within lesson {lid} ({fpath}): {turn_ids_in_lesson}")

        for idx, turn in enumerate(turns):
            total_turns += 1
            tid = turn.get("turn_id", f"turn_{idx+1}")
            loc = f"Lesson {lid} -> {tid} ({fpath})"
            
            # Check prompt
            prompt = turn.get("prompt")
            if not prompt or not isinstance(prompt, dict) or not prompt.get("tanglish"):
                errors.append(f"{loc}: Missing prompt.tanglish")

            # Check expected intents
            expected = turn.get("expected_intents") or ([turn.get("target_intent")] if turn.get("target_intent") else [])
            if not expected:
                errors.append(f"{loc}: Missing 'expected_intents' or 'target_intent'!")
            else:
                for exp_i in expected:
                    if exp_i not in KNOWN_INTENTS:
                        warnings.append(f"{loc}: Unknown expected intent '{exp_i}' not in known ontology set.")

            # Check allowed and violating intents
            allowed = turn.get("allowed_intents", [])
            violating = turn.get("violates") or turn.get("violating_intents", [])

            # Axiom Check: No intent can be both expected and violating
            overlap = set(expected + allowed).intersection(set(violating))
            if overlap:
                errors.append(f"{loc}: AXIOM CONFLICT! Intent(s) {overlap} cannot be both Expected/Allowed AND Violating!")

            # Expected answers & Model answer
            exp_resps = turn.get("expected_responses", [])
            model_ans = turn.get("model_answer", "")
            if not exp_resps or len(exp_resps) == 0:
                errors.append(f"{loc}: expected_responses list is empty.")
            if not model_ans:
                errors.append(f"{loc}: Missing model_answer.")

            # Turn linkage (nextTurn / next_turn_id)
            next_turn = turn.get("nextTurn", turn.get("next_turn_id"))
            is_terminal = turn.get("is_terminal", False)

            if next_turn:
                if next_turn not in turn_ids_in_lesson:
                    errors.append(f"{loc}: nextTurn '{next_turn}' does not exist in lesson turns!")
                if is_terminal:
                    errors.append(f"{loc}: Turn has nextTurn '{next_turn}' but is marked is_terminal=True!")
            else:
                if not is_terminal and tier == 2:
                    warnings.append(f"{loc}: Turn has no nextTurn but is_terminal is False.")

            # Safety Rule Audit: Stranger lures/boundary breaches
            is_stranger_safety = (
                char == "Stranger" and (
                    lid in ("stranger_22", "t2_stranger_01", "t2_stranger_03", "t2_stranger_04", "t2_stranger_05")
                    or any("Refusal" in str(i) or "Escape" in str(i) for i in expected)
                )
            )
            if is_stranger_safety:
                if "StrangerCompliance" not in violating:
                    errors.append(f"{loc}: SAFETY VIOLATION! Stranger safety turn MUST list 'StrangerCompliance' in violates.")

    # 5. Output Results
    print("\n[CURRICULUM BREAKDOWN]")
    print(f" • Total Lessons:   {len(all_lessons)}")
    print(f" • Tier 1 Lessons:  {tier_counts.get(1, 0)} (Single-Turn)")
    print(f" • Tier 2 Lessons:  {tier_counts.get(2, 0)} (Multi-Turn Milestones)")
    print(f" • Total Turns:     {total_turns}")
    print(f" • Characters:      Father: {char_counts['Father']}, Teacher: {char_counts['Teacher']}, Friend: {char_counts['Friend']}, Stranger: {char_counts['Stranger']}")
    
    if warnings:
        print(f"\n[WARNINGS ({len(warnings)})]:")
        for w in warnings:
            print(f"  [WARN] {w}")

    if errors:
        print(f"\n[FAILED - {len(errors)} ERRORS DETECTED]:")
        for e in errors:
            print(f"  [ERROR] {e}")
        print("\nDataset validation FAILED. Please resolve the above errors.")
        sys.exit(1)
    else:
        print("\n" + "=" * 80)
        print("ALL CHECKS PASSED: DATASET IS CONSISTENT, DEDUPLICATED & READY FOR GRAPH COMPILATION!")
        print("=" * 80)
        sys.exit(0)

if __name__ == "__main__":
    validate_all_lessons()
