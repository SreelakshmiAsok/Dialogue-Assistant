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

CORRECT_MESSAGES = {
    "Father": [
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
        "Almost there! Try adding 'appa' to your answer. 🌟",
        "You're learning! Let's try a polite way to answer Appa. 💪"
    ],
    "Teacher": [
        "Good try! Let's practice talking to Teacher nicely. 🌸",
        "Almost there! Try adding 'teacher' or 'ma'am' to your answer. 🌟",
        "You're learning! Let's try a polite way to answer Teacher. 💪"
    ],
    "Friend": [
        "Good try! Let's try a friendly answer. 🌸",
        "Almost there! Try answering your friend in a fun way. 🌟",
        "You're learning! Let's try again with your friend. 💪"
    ],
    "Stranger": [
        "Good try! Let's practice being polite with strangers. 🌸",
        "Almost there! Try adding 'sir' to your answer. 🌟",
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
                      model_answer="", respect_required=True):
    """
    Generate gentle, encouraging feedback for autistic children.

    Returns:
        dict with feedback, suggestion, encouragement
    """

    if matched:
        feedback = random.choice(
            CORRECT_MESSAGES.get(character, CORRECT_MESSAGES["Stranger"])
        )
        return {
            "feedback": feedback,
            "suggestion": None,
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
                    language_ok=True):
    """
    Calculate stars (0-5) for a response.

    - 5 stars: Perfect match + respectful + clean language
    - 4 stars: Close match + respectful
    - 3 stars: Acceptable match
    - 2 stars: Partial understanding
    - 1 star: Tried but needs improvement (always give at least 1 for trying)
    - 0 stars: Empty/no response only
    """

    if not matched and semantic_score < 0.3:
        # Still give 1 star for trying
        return 1

    if not language_ok:
        return 1

    if matched and respect_ok and language_ok:
        if semantic_score >= 0.95:
            return 5
        elif semantic_score >= 0.85:
            return 4
        else:
            return 3

    if matched and not respect_ok:
        return 2

    if semantic_score >= 0.6:
        return 2

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