# TalkWise Unified Dialogue & Graph Schema

## Overview

In accordance with the architectural plan to remove domain knowledge written as `if/else` code, **Tier 1 (Single-turn Foundations)** and **Tier 2 (Multi-turn Milestones)** now run on a **single, unified graph schema**.

Every interaction in TalkWise is modeled as a `CommunicationScenario` comprised of one or more sequential or branching `turns`.

---

## 1. Top-Level Scenario Schema

Every lesson file (located in `lessons/tier1/{character}/lesson_X.json` and `lessons/tier2/{character}/lesson_X.json`) conforms to this top-level JSON structure:

```json
{
  "id": "father_01",
  "tier": 1,
  "character": "Father",
  "topic": "Shopping",
  "difficulty": 1,
  "scenario": "You are at home. Appa wants to go to the shop. He asks you to come with him.",
  "curriculum": {
    "source": "Carol Gray's Social Stories™",
    "module": "Family Interaction & Co-participation",
    "target_rules": [
      "Respond politely to parent invitation",
      "Use respectful address"
    ]
  },
  "turns": [ ... ]
}
```

---

## 2. Turn Specification (`turns[]`)

A lesson contains an ordered list of conversation turns. Tier 1 scenarios contain a single terminal turn (`next_turn_id: null, is_terminal: true`). Tier 2 scenarios chain turns together via graph edges.

| Field | Type | Description |
| :--- | :--- | :--- |
| `turn_id` | string | Unique identifier for the turn within the scenario (e.g., `"turn_1"`, `"turn_2"`). |
| `step_number` | integer | 1-indexed turn progression number. |
| `prompt` | object | Prompts presented to the child: `{ "tanglish": "...", "tamil": "...", "english": "..." }`. |
| `target_intent` | string | Formal communicative intent required to satisfy the turn goal (e.g., `SafetyRefusal`, `AnswerQuestion`, `NegotiationIntent`). |
| `allowed_intents` | array[string] | Valid alternative intents accepted without penalty (e.g., `PoliteRefusal`, `UncertaintyResponse`). |
| `violating_intents` | array[string] | Intents that violate pragmatic, decorum, or safety norms (e.g., `StrangerCompliance`, `HostileRefusal`, `DisrespectfulInformal`). |
| `required_features` | array[string] | Linguistic markers required for full credit (e.g., `RespectWord`, `Honorific`, `FirmNo`, `TimeExtension`). |
| `expected_responses` | array[string] | Exemplar child responses used for semantic embedding comparison and nearest-neighbor matching. |
| `model_answer` | string | Pedagogical target response shown when the child requires gentle correction or modeling. |
| `feedback` | object | Hints and coaching: `{ "hint": "...", "gentle_correction": "..." }`. |
| `next_character_reply` | object | Character's spoken line after a successful turn: `{ "tanglish": "...", "tamil": "..." }`. |
| `next_turn_id` | string or null | Pointer to the subsequent turn ID in the graph edge, or `null` if terminal. |
| `is_terminal` | boolean | `true` if this turn completes the dialogue milestone; `false` otherwise. |

---

## 3. Backwards Compatibility Guarantees

For existing frontend components and legacy API routes expecting flat Tier 1 properties, Tier 1 files preserve top-level mirrored aliases (`question_tanglish`, `question_tamil`, `expected_answers`, `social_story`, `respect_required`). 

Backend loaders can read either format interchangeably without breaking production clients.

---

## 4. Integrity Validation (`dataset/validate_dataset.py`)

A CI-style dataset validator enforces dataset integrity:

1. **Uniqueness**: All scenario IDs across Tier 1 and Tier 2 must be unique (no duplicate filenames or duplicate IDs).
2. **Turn Linking**: Every non-null `next_turn_id` must resolve to a valid turn within the scenario. Terminal turns must have `is_terminal: true`.
3. **Axiom Non-Contradiction**: No intent can be simultaneously listed in `target_intent`/`allowed_intents` AND `violating_intents`.
4. **Safety Enforcement**: Any stranger lure or hazard turn must explicitly mandate a refusal intent and list `StrangerCompliance` in `violating_intents`.
5. **Ontology Alignment**: All intents and features must map to valid RDF/OWL concepts in `reasoning/social_communication.owl`.

To execute validation:
```bash
python dataset/validate_dataset.py
```
