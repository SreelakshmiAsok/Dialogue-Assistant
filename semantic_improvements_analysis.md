# Dialogue Assistant Semantic Improvements Analysis

This document details all the changes made to the Dialogue Assistant project to semantically improve the engine's understanding of children's verbal responses. These changes align the local client-side pipeline logic with the Python FastAPI OWL ontology reasoning backend and correct several core scoring and feedback gaps.

---

## 📋 Overview of Changes from Main Branch

We have modified three core files in the codebase:
1. `scenarios.js` (Scenario configurations, visual hint choices, and rule schemas)
2. `pipeline.js` (Speech processing, RAG matching, ontology rule evaluations, and scoring)
3. `reasoning/reasoner.py` (Python FastAPI ontology checking rules and concept dictionary)

The updates introduce a synchronized synonym lookup system, missing authority and hostility rules, proper FastAPI reasoning result mapping, and accurate safety/politeness calculations.

---

## 🎭 Scenario-Specific Semantic Improvements

### 1. Stranger Safety Scenario (🛑 Mr. Green)
* **The Problem on Main**: Complying with a stranger's request (e.g., saying `"i can help u find"`) did not trigger a safety violation. Because it contained no explicit refusal keywords, it failed the refusal check (`FAIL`) but fell through to a score of `7/10`, triggering the guidance `"Good job saying NO"`.
* **The Improvements**:
  * **Compliance Triggering**: We added `"find"`, `"help"`, `"go"`, `"show"`, `"will"`, `"chocolate"`, and `"car"` to the stranger safety negative keywords (`S_REFUSAL`). Now, any non-negated mention of these words triggers a **VIOLATION** (safety score = 1).
  * **Synonym Expansion**: Standardized synonym expansions in both Python and JS. For example, `"help"` expands to `"assist"`, `"ok"`, `"find"` expands to `"look for"`, `"search"`, etc.
  * **Precise Unclear/Neutral Scores**: If a child says something irrelevant (e.g., `"what are you doing?"`), it results in a `FAIL` status for `S_REFUSAL`, dropping the safety score to `4` and alerting them: `"You didn't say NO clearly. Remember... say NO loudly..."`.

### 2. Teacher Decorum Scenario (🏫 Ms. Apple)
* **The Problem on Main**: The client-side code completely ignored disrespect or rudeness. While the Python backend checked for rude phrases, the client-side did not define `T_DECORUM` in `scenarios.js`, meaning a child saying `"shut up Ms. Apple"` received no politeness penalty in the UI.
* **The Improvements**:
  * Added the `T_DECORUM` rule schema to `scenarios.js` with negative keywords: `["hey man", "shut up", "gimme", "stupid", "whatever", "dumb"]`.
  * Updated `pipeline.js` to penalize the politeness score (`politeScore = 2`) and safety/decorum score (`safetyScore = 5`) if `T_DECORUM` is violated.
  * Synchronized the rules symmetrically in Python's `reasoner.py` under the same IDs.

### 3. Parent Honesty Scenario (🏠 Dad)
* **The Problem on Main**: If a child lied or denied dropping the toy without using the specific phrases `"cat did it"`, `"not me"`, or `"dog did"`, they bypassed the honesty penalty. A statement like `"I didn't break it"` or `"didn't drop"` was marked as safety `10/10` because it failed the positive check but didn't trigger the limited negative list.
* **The Improvements**:
  * Expanded negative blame keywords to: `["cat did it", "not me", "dog did", "cat did", "wasn't me", "wasnt me", "didn't do", "didnt do", "not my fault", "didn't break", "didnt break", "didn't drop", "didnt drop", "never touched"]`.
  * Substrings and multi-word phrases now undergo negation checking.
  * Corrected scoring: If `P_HONESTY` is violated (lying/blaming), `safetyScore` drops to `3`. If `P_HONESTY` is a failure (the child fails to explain honestly but doesn't lie, e.g. saying nothing relevant), `safetyScore` is penalized to `6` instead of remaining a perfect `10`.

### 4. Friend Cooperation Scenario (🛝 Leo)
* **The Problem on Main**: There was no client-side check for hostile or uncooperative language. If a child responded aggressively (e.g., `"get lost"` or `"mine"`), they were not flagged.
* **The Improvements**:
  * Added the `F_HOSTILE` rule to `scenarios.js` checking for hostile words: `["mine", "no way", "get lost", "move", "go away", "shut up"]`.
  * Updated `pipeline.js` to drop the politeness score to `2` if hostility is detected.
  * Synchronized the rule mapping in Python's `reasoner.py` using the exact same rule ID.

---

## ⚡ Integration with Python FastAPI Backend

In the original code, the client called the FastAPI reasoner endpoint `/reason` to inspect ontology rules but **completely discarded the results** when calculating the scores, emotions, and mascot feedback. The UI updates were driven purely by local JS approximations.

We updated `runFullPipelineAsync` in `pipeline.js` to fully integrate the Python OWL ontology reasoning output:
1. It queries the FastAPI server and gets the live rule evaluations list.
2. It maps the statuses (`PASS`, `FAIL`, `VIOLATION`) and details back to the client-side rule evaluations array 1-to-1.
3. It reruns the new `computeScoresAndFeedback` scoring helper on the updated rule evaluations, ensuring the character emotions, star ratings, and audio feedback are dynamically controlled by the live FastAPI Python ontology backend.

---

## 🧪 Quick Reference: Utterance Evaluation Comparison

The table below illustrates how the updated system classifies and scores different inputs:

| Scenario | Input Utterance | Old Status (Main) | New Status (semantic-rules-sync) | New Safety Score | Mascot Feedback Outcome |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Stranger** | `"i can help u find"` | `FAIL` (Refusal Incomplete) | `VIOLATION` (Stranger Acceptance) | `1/10` | "Stop! That is very dangerous..." |
| **Stranger** | `"what are you doing?"` | `FAIL` (Refusal Incomplete) | `FAIL` (Unclear Refusal) | `4/10` | "You didn't say NO clearly. Remember..." |
| **Stranger** | `"no thank you"` | `FAIL` (Refusal Incomplete) | `PASS` (Refusal Only) | `7/10` | "Good job saying NO. To make it safer..." |
| **Teacher** | `"shut up Ms. Apple"` | `PASS` (Polite rule bypassed) | `VIOLATION` (Decorum Violated) | `5/10` (Politeness `2/10`) | Triggers concerned emotion & guidance |
| **Parent** | `"didn't drop"` | `FAIL` (Apology missing) | `VIOLATION` (Honesty Violated) | `3/10` | Triggers concerned emotion & guidance |
| **Friend** | `"get lost"` | `FAIL` (Cooperation missing) | `VIOLATION` (Friend Hostile) | `10/10` (Politeness `2/10`) | Triggers concerned emotion & guidance |
