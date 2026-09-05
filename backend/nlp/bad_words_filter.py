# ============================================================
# INAPPROPRIATE WORD / PHRASE FILTER
# For autistic children's social skills training
# Always gives gentle, encouraging redirection
# ============================================================

from nlp.preprocessing import normalize_text


# ============================================================
# BAD WORD LISTS
# ============================================================

# Severe: Actual abusive/vulgar Tamil/Tanglish words
SEVERE_WORDS = [
    "otha", "oothaa", "thevidiya", "thevudiya", "thevdiya",
    "baadu", "baadu", "koothi", "koodi", "koodhi",
    "poda", "podi", "podaa", "podii",
    "poolu", "pool", "sunni",
    "mayiru", "mayir", "mayirum",
    "venna", "vennaa", "loosu", "loossu",
    "naayi", "naai", "naaye", "naye",
    "donkey", "stupid", "idiot", "fool", "shut up",
    "hate you", "dumba", "dumb",
    "kena", "kenaa", "kenamavan",
    "galeejee", "galeeji"
]

# Moderate: Rude/dismissive words
MODERATE_WORDS = [
    "poi", "poira", "poiru",
    "pesaadhe", "pesathe",
    "venaam", "venaam da",
    "tholla", "thollai",
    "bore", "boree",
    "ugly", "bad", "worst"
]

# Context-dependent: OK with friends, not with elders
CONTEXT_WORDS = {
    "da": {
        "ok_with": ["Friend"],
        "not_ok_with": ["Father", "Teacher", "Stranger"],
        "suggestion": "When talking to {character}, use respectful words like 'sir', 'teacher', or 'appa' instead of 'da'."
    },
    "di": {
        "ok_with": ["Friend"],
        "not_ok_with": ["Father", "Teacher", "Stranger"],
        "suggestion": "When talking to {character}, use respectful words like 'sir', 'teacher', or 'appa' instead of 'di'."
    },
    "machi": {
        "ok_with": ["Friend"],
        "not_ok_with": ["Father", "Teacher", "Stranger"],
        "suggestion": "When talking to {character}, use respectful words like 'sir' or 'teacher' instead of 'machi'."
    },
    "dei": {
        "ok_with": ["Friend"],
        "not_ok_with": ["Father", "Teacher", "Stranger"],
        "suggestion": "When talking to {character}, use respectful words instead of 'dei'."
    },
    "yov": {
        "ok_with": ["Friend"],
        "not_ok_with": ["Father", "Teacher", "Stranger"],
        "suggestion": "When talking to {character}, use polite words instead of 'yov'."
    },
    "yovv": {
        "ok_with": ["Friend"],
        "not_ok_with": ["Father", "Teacher", "Stranger"],
        "suggestion": "When talking to {character}, use polite words instead of 'yov'."
    }
}

# Rude phrases (multi-word)
RUDE_PHRASES = [
    "po da", "po di", "poda",
    "vena da", "vena di",
    "nee yaar", "nee yaaru",
    "enakku venam", "venam da",
    "pesaadhe da", "pesathe da",
    "shut up da", "shut up",
    "i dont care", "i don't care",
    "leave me", "go away"
]


# ============================================================
# GENTLE RESPONSES (for autistic children)
# ============================================================

GENTLE_RESPONSES = {
    "severe": [
        "Let's use kinder words 🌸 Try saying it nicely!",
        "Those words can hurt feelings. Let's try again with nicer words 🌟",
        "We can do better! Try using kind and gentle words 💛"
    ],
    "moderate": [
        "Let's try a friendlier way to say that 🌈",
        "Try answering in a nicer way. You can do it! 🌟",
        "Let's practice being polite. Try again! 💪"
    ],
    "context": [
        "When talking to {character}, let's use respectful words 🙏",
        "Try adding a respectful word like 'sir' or 'appa'. You're doing great! ⭐",
        "Almost there! Just use a polite word for {character} 🌸"
    ]
}


# ============================================================
# MAIN FILTER FUNCTION
# ============================================================

def check_inappropriate(text, character="Stranger"):
    """
    Check if the response contains inappropriate words/phrases.

    Returns:
        dict with:
            - is_inappropriate (bool)
            - severity ("none" | "mild" | "moderate" | "severe")
            - flagged_words (list)
            - gentle_message (str) - kind, encouraging redirection
            - suggestion (str) - what to say instead
    """
    if not text or not text.strip():
        return {
            "is_inappropriate": False,
            "severity": "none",
            "flagged_words": [],
            "gentle_message": "",
            "suggestion": ""
        }

    normalized = normalize_text(text)
    words = normalized.split()
    flagged = []

    # --------------------------------------------------------
    # Check severe words
    # --------------------------------------------------------
    for word in words:
        if word in SEVERE_WORDS:
            flagged.append(word)

    if flagged:
        import random
        return {
            "is_inappropriate": True,
            "severity": "severe",
            "flagged_words": flagged,
            "gentle_message": random.choice(GENTLE_RESPONSES["severe"]),
            "suggestion": "Try using kind and polite words when speaking."
        }

    # --------------------------------------------------------
    # Check rude phrases
    # --------------------------------------------------------
    for phrase in RUDE_PHRASES:
        if phrase in normalized:
            flagged.append(phrase)

    if flagged:
        import random
        return {
            "is_inappropriate": True,
            "severity": "moderate",
            "flagged_words": flagged,
            "gentle_message": random.choice(GENTLE_RESPONSES["moderate"]),
            "suggestion": "Try to respond politely and nicely."
        }

    # --------------------------------------------------------
    # Check moderate words
    # --------------------------------------------------------
    for word in words:
        if word in MODERATE_WORDS:
            flagged.append(word)

    if flagged:
        import random
        return {
            "is_inappropriate": True,
            "severity": "moderate",
            "flagged_words": flagged,
            "gentle_message": random.choice(GENTLE_RESPONSES["moderate"]),
            "suggestion": "Let's try a more polite response."
        }

    # --------------------------------------------------------
    # Check context-dependent words
    # --------------------------------------------------------
    for word in words:
        if word in CONTEXT_WORDS:
            rule = CONTEXT_WORDS[word]
            if character in rule["not_ok_with"]:
                flagged.append(word)

    if flagged:
        import random
        msg = random.choice(GENTLE_RESPONSES["context"]).format(
            character=character
        )
        suggestion = CONTEXT_WORDS.get(
            flagged[0], {}
        ).get("suggestion", "").format(character=character)

        return {
            "is_inappropriate": True,
            "severity": "mild",
            "flagged_words": flagged,
            "gentle_message": msg,
            "suggestion": suggestion
        }

    # --------------------------------------------------------
    # All clean
    # --------------------------------------------------------
    return {
        "is_inappropriate": False,
        "severity": "none",
        "flagged_words": [],
        "gentle_message": "",
        "suggestion": ""
    }


# ============================================================
# TEST
# ============================================================

if __name__ == "__main__":
    print("=" * 60)
    print("BAD WORDS FILTER TEST")
    print("=" * 60)

    tests = [
        ("Varen appa", "Father"),
        ("poda", "Father"),
        ("Seri da", "Teacher"),
        ("Seri da", "Friend"),
        ("otha", "Stranger"),
        ("po da", "Teacher"),
        ("Theriyadhu sir", "Stranger"),
        ("nee yaar da", "Teacher"),
        ("shut up", "Father"),
    ]

    for text, character in tests:
        result = check_inappropriate(text, character)
        print(f"\nInput: '{text}' → {character}")
        print(f"  Inappropriate: {result['is_inappropriate']}")
        print(f"  Severity: {result['severity']}")
        if result['flagged_words']:
            print(f"  Flagged: {result['flagged_words']}")
        if result['gentle_message']:
            print(f"  Message: {result['gentle_message']}")

    print("\n" + "=" * 60)
