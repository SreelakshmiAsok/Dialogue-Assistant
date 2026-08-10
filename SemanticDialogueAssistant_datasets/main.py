from scenarios import SCENARIOS, get_scenario, display_scenarios
from rule_engine import check_pragmatics
from utils.preprocessing import normalize_text
from difflib import SequenceMatcher


# ============================================================
# SIMPLE SEMANTIC SCORE
# ============================================================

def semantic_score(response, expected_answers):
    if not response or not expected_answers:
        return 0.0

    normalized_response = normalize_text(response)

    best_score = 0.0

    for expected in expected_answers:
        normalized_expected = normalize_text(expected)

        score = SequenceMatcher(
            None,
            normalized_response,
            normalized_expected
        ).ratio()

        if score > best_score:
            best_score = score

    return round(best_score, 3)


# ============================================================
# RUN ASSISTANT
# ============================================================

def run_assistant():

    print("=" * 60)
    print("SEMANTIC DIALOGUE ASSISTANT")
    print("=" * 60)

    display_scenarios()

    print()

    choice = input("Choose a scenario (1-5): ").strip()

    scenario = get_scenario(choice)

    if scenario is None:
        print("Invalid scenario.")
        return

    scenario_id = scenario["scenario_id"]

    print()
    print("Character :", scenario["character"])
    print("Avatar    :", scenario["avatar"])
    print("Lesson    :", scenario["lesson"])
    print("Question  :", scenario["question"])

    print()

    response = input("Your response: ").strip()

    normalized = normalize_text(response)

    expected_answers = scenario["expected_answers"]

    # --------------------------------------------------------
    # Rule engine
    # --------------------------------------------------------

    result = check_pragmatics(
        response,
        scenario_id,
        expected_answers
    )

    # --------------------------------------------------------
    # Semantic score
    # --------------------------------------------------------

    score = semantic_score(
        response,
        expected_answers
    )

    # --------------------------------------------------------
    # Display result
    # --------------------------------------------------------

    print()
    print("=" * 60)
    print("ASSISTANT RESULT")
    print("=" * 60)

    print("Your Response :", response)
    print("Normalized    :", normalized)

    print(
        "Expected      :",
        " OR ".join(expected_answers)
    )

    print("Matched       :", result["matched"])
    print("Semantic Score:", score)

    # --------------------------------------------------------
    # Sentiment
    # --------------------------------------------------------

    sentiment = "Neutral"

    print("Sentiment     :", sentiment)
    print("Error Type    :", result["error_type"])
    print("Suggestion    :", result["suggestion"])
    print("Stars         :", result["stars"])

    print("=" * 60)

    print()
    print("=" * 60)
    print("DIALOGUE COMPLETED")
    print("=" * 60)


# ============================================================
# PROGRAM START
# ============================================================

if __name__ == "__main__":
    run_assistant()