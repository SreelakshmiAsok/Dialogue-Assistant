# ============================================================
# FEEDBACK ENGINE — Gentle, Encouraging (for autistic children)
# Never negative or harsh. Always encouraging.
# ============================================================

import random


# ============================================================
# ENCOURAGEMENT MESSAGES (rotating)
# ============================================================

ENCOURAGEMENTS = [
    "You're doing amazing! Keep going! 🌟",
    "You're learning so well! 💪",
    "Every try makes you better! 🌈",
    "You're a star! Keep it up! ⭐",
    "Wonderful effort! You're getting better! 🎉",
    "Practice makes perfect! You're doing great! 🌸",
    "So proud of you for trying! 💛",
    "You're getting better every time! 🌟",
    "Keep going, you're doing wonderfully! 🎊",
    "Great job practicing! You're a superstar! 🌟"
]

PREFERRED_VOCATIVE = {
    "Father": "appa",
    "Teacher": "teacher",
    "Stranger": "sir"
}

CORRECT_MESSAGES = {
    "Father": [
        "Great job talking with Appa! 🌸 You answered Appa.",
        "Great job! You spoke to Appa very nicely! 🌟",
        "Wonderful! That's a lovely way to talk to Appa! ⭐",
        "Perfect! Appa will be so happy with your answer! 💛",
        "Excellent! You're so polite with Appa! 🎉"
    ],
    "Teacher": [
        "Great job! You spoke to Teacher very nicely! 🌟",
        "Wonderful! That's the right way to talk to Teacher! ⭐",
        "Perfect! Teacher will be proud of you! 💛",
        "Excellent! Such polite words for Teacher! 🎉"
    ],
    "Friend": [
        "Great job! You're a good friend! 🌟",
        "Wonderful! That's how friends talk! ⭐",
        "Perfect! Your friend will be happy! 💛",
        "Excellent! You're such a nice friend! 🎉"
    ],
    "Stranger": [
        "Great job! You spoke very politely! 🌟",
        "Wonderful! That's very safe and polite! ⭐",
        "Perfect! You were very respectful! 💛",
        "Excellent! Such a polite response! 🎉"
    ]
}

INCORRECT_MESSAGES = {
    "Father": [
        "Good try! Let's practice talking to Appa nicely. 🌸",
        "Almost there! Let's try answering Appa again. 🌟",
        "You're learning! Let's try a polite way to answer Appa. 💪"
    ],
    "Teacher": [
        "Good try! Let's practice talking to Teacher nicely. 🌸",
        "Almost there! Let's try another answer for Teacher. 🌟",
        "You're learning! Let's try a polite way to answer Teacher. 💪"
    ],
    "Friend": [
        "Good try! Let's try a friendly answer. 🌸",
        "Almost there! Try answering your friend in a fun way. 🌟",
        "You're learning! Let's try again with your friend. 💪"
    ],
    "Stranger": [
        "Good try! Let's practice being polite with strangers. 🌸",
        "Almost there! Let's try a polite answer for strangers. 🌟",
        "You're learning! Let's try a polite and safe answer. 💪"
    ]
}

RESPECT_MISSING_MESSAGES = {
    "Father": "Try adding 'appa' to show respect. Like: '{model_answer}' 🙏",
    "Teacher": "Try adding 'teacher' or 'ma'am' to show respect. Like: '{model_answer}' 🙏",
    "Friend": "Try using friendly words with your friend! 🤝",
    "Stranger": "Try adding 'sir' or 'ma'am' to be polite. Like: '{model_answer}' 🙏"
}


# ============================================================
# MAIN FEEDBACK FUNCTION
# ============================================================

def generate_feedback(character, matched, error_type=None,
                      model_answer="", respect_required=True,
                      missing_preferred_vocative=False,
                      ontology_context=None):
    """
    Generate gentle, encouraging feedback for autistic children.

    Semantic success is affirmed even when a preferred honorific is missing.
    Missing vocatives become optional suggestions, not corrections.

    Returns:
        dict with feedback, suggestion, encouragement
    """

    if matched:
        feedback = random.choice(
            CORRECT_MESSAGES.get(character, CORRECT_MESSAGES["Stranger"])
        )
        suggestion = None
        if missing_preferred_vocative or error_type == "Missing Honorific":
            vocative = PREFERRED_VOCATIVE.get(character)
            if vocative:
                suggestion = (
                    f"You could also say '{vocative}' when addressing "
                    f"{'him' if character == 'Father' else 'them'} directly."
                )
            elif model_answer:
                suggestion = (
                    f"You could also say '{model_answer}' if you want "
                    "to address them directly. 🌸"
                )

        return {
            "feedback": feedback,
            "suggestion": suggestion,
            "encouragement": random.choice(ENCOURAGEMENTS)
        }

    # --------------------------------------------------------
    # Not matched — always gentle
    # --------------------------------------------------------

    feedback = random.choice(
        INCORRECT_MESSAGES.get(character, INCORRECT_MESSAGES["Stranger"])
    )

    suggestion = None

    if error_type == "Disrespectful Slang" or error_type == "Missing Honorific":
        suggestion = RESPECT_MISSING_MESSAGES.get(
            character, ""
        ).format(model_answer=model_answer)

    elif error_type == "Inappropriate Language":
        suggestion = "Let's use kinder words. Try saying: '{}'".format(
            model_answer
        )

    elif error_type == "Incorrect Response":
        suggestion = "A great way to answer is: '{}' 🌸".format(
            model_answer
        )

    else:
        suggestion = "Try saying: '{}' 🌟".format(model_answer)

    return {
        "feedback": feedback,
        "suggestion": suggestion,
        "encouragement": random.choice(ENCOURAGEMENTS)
    }


# ============================================================
# STAR CALCULATOR
# ============================================================

def calculate_stars(matched, semantic_score=0.0, respect_ok=True,
                    language_ok=True, nlp_similarity=0.0, intent_verified=False):
    """
    Calculate stars (0-5) based on combined evidence:
    - Semantic similarity (tokens & NLP embeddings)
    - Intent / Context agreement
    - Politeness & Respect constraints
    - Safety & Clean language

    Expected Mapping:
    - 4–5 ⭐: Exact / strongly equivalent intended response
    - 4–5 ⭐: Clearly valid alternative expressing intended intent
    - 2–3 ⭐: Reasonable but incomplete/ambiguous response (e.g. missing honorific or moderate match)
    - 1–2 ⭐: Related words but wrong/unclear intent (effort recognized without false pass)
    - 1 ⭐: Low similarity or safety violation
    """
    if not language_ok:
        return 1

    combined_score = max(semantic_score, nlp_similarity)

    # 1. Matched responses (Communicative intent satisfied)
    if matched:
        if not respect_ok:
            # Missing respect marker for authority figure (e.g. forgot 'appa' or 'teacher')
            return 3

        if combined_score >= 0.90 or (semantic_score >= 0.85 and intent_verified):
            return 5
        elif combined_score >= 0.72 or intent_verified:
            return 4
        else:
            return 3

    # 2. Not matched (Did not satisfy expected intent)
    # Give 2 stars for reasonable attempt / related words with partial semantic understanding
    if combined_score >= 0.50:
        return 2

    # Give 1 star for low-scoring attempt (always encourage trying)
    return 1


# ============================================================
# ROLE NAME HELPER
# ============================================================

def get_role_name(character):
    role_names = {
        "Father": "your Appa (father)",
        "Teacher": "your Teacher",
        "Friend": "your friend",
        "Stranger": "the person"
    }
    return role_names.get(character, "the person")


# ============================================================
# TEST
# ============================================================

if __name__ == "__main__":
    print("=" * 60)
    print("FEEDBACK ENGINE TEST")
    print("=" * 60)

    # Test correct
    result = generate_feedback("Father", True)
    print("\nCorrect (Father):")
    print("  Feedback:", result["feedback"])
    print("  Encouragement:", result["encouragement"])

    # Test incorrect
    result = generate_feedback(
        "Teacher", False,
        error_type="Incorrect Response",
        model_answer="Seri teacher"
    )
    print("\nIncorrect (Teacher):")
    print("  Feedback:", result["feedback"])
    print("  Suggestion:", result["suggestion"])
    print("  Encouragement:", result["encouragement"])

    # Test stars
    print("\nStars Test:")
    print("  Perfect:", calculate_stars(True, 1.0, True, True))
    print("  Good:", calculate_stars(True, 0.9, True, True))
    print("  OK:", calculate_stars(True, 0.8, True, True))
    print("  No respect:", calculate_stars(True, 0.8, False, True))
    print("  Bad words:", calculate_stars(True, 0.8, True, False))
    print("  Tried:", calculate_stars(False, 0.2, True, True))

    print("=" * 60)