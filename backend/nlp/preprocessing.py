import re

# ============================================================
# TANGLISH NORMALIZATION
# ============================================================

NORMALIZATION = {
    # Parent / Appa
    "appa": "appa",
    "appaa": "appa",
    "appa.": "appa",
    "pappa": "appa",

    # Mother
    "amma": "amma",
    "ammaa": "amma",
    "amma.": "amma",

    # Teacher
    "teacher": "teacher",
    "teachar": "teacher",
    "teacherr": "teacher",
    "techer": "teacher",

    # Sir
    "sir": "sir",
    "sirr": "sir",
    "sirr.": "sir",

    # Miss / Ma'am
    "miss": "miss",
    "mis": "miss",
    "maam": "ma'am",
    "ma'am": "ma'am",
    "mam": "ma'am",
    "ma'am.": "ma'am",

    # Common yes
    "aama": "aama",
    "ama": "aama",
    "aama.": "aama",
    "ama.": "aama",

    # Seri
    "seri": "seri",
    "sari": "seri",
    "serii": "seri",
    "sari.": "seri",
    "seri.": "seri",
    "chari": "seri",
    "charri": "seri",
    "chari.": "seri",

    # Saaptiya / Saaptaen
    "saaptiya": "saaptiya",
    "saptiya": "saaptiya",
    "saaptiya?": "saaptiya",

    "saaptaen": "saaptaen",
    "saapten": "saaptaen",
    "saptaen": "saaptaen",
    "sapten": "saaptaen",
    "saapten.": "saaptaen",
    "chaappidden": "saaptaen",
    "chaapidden": "saaptaen",
    "chaappitten": "saaptaen",
    "chaapitten": "saaptaen",
    "chaaptaen": "saaptaen",
    "chaapten": "saaptaen",
    "saappidden": "saaptaen",
    "saapidden": "saaptaen",
    "saappitten": "saaptaen",
    "saapitten": "saaptaen",

    # Homework completed
    "mudichiten": "mudichiten",
    "mudichitten": "mudichiten",
    "mudichen": "mudichiten",
    "muduchiten": "mudichiten",
    "muduchitten": "mudichiten",
    "mudichutten": "mudichiten",
    "mudichuten": "mudichiten",

    # Common words
    "illa": "illa",
    "illai": "illa",
    "di": "di",
    "da": "da",
    "va": "va",
    "vaa": "va",
    "vanga": "vaanga",
    "vaanga": "vaanga",

    # Stranger / directions
    "theriyadhu": "theriyadhu",
    "theriyathu": "theriyadhu",
    "theriyadhu.": "theriyadhu",

    # Other common variations
    "right": "right",
    "left": "left",
    "enga": "enga",
    "engae": "enga",
    "iruku": "iruku",
    "irukku": "iruku",
    "irukkum": "iruku"
}


def clean_text(text):
    if text is None:
        return ""

    text = str(text).lower().strip()

    # Remove unnecessary punctuation
    text = re.sub(r"[!?.,;:]+", " ", text)

    # Remove extra spaces
    text = re.sub(r"\s+", " ", text)

    return text.strip()


TAMIL_TO_TANGLISH = {
    "அப்பா": "appa",
    "அம்மா": "amma",
    "டீச்சர்": "teacher",
    "சார்": "sir",
    "மிஸ்": "miss",
    "மேடம்": "ma'am",
    "ஆமா": "aama",
    "ஆமாம்": "aama",
    "இல்ல": "illa",
    "இல்லை": "illa",
    "சரி": "seri",
    "வரேன்": "varen",
    "வா": "va",
    "வாங்க": "vaanga",
    "சாப்பிட்டேன்": "saaptaen",
    "சாப்டேன்": "saaptaen",
    "முடிச்சிட்டேன்": "mudichiten",
    "தெரியாது": "theriyadhu",
    "முடியாது": "mudiyadhu",
    "வேணாம்": "venam",
    "போ": "po",
    "டேய்": "da",
    "டி": "di"
}

def normalize_text(text):
    text = clean_text(text)

    if not text:
        return ""

    words = text.split()
    normalized_words = []

    for word in words:
        # First check Tamil mapping, then apply normal Tanglish rules
        tanglish_word = TAMIL_TO_TANGLISH.get(word, word)
        normalized_words.append(
            NORMALIZATION.get(tanglish_word, tanglish_word)
        )

    return " ".join(normalized_words)

# Backward compatibility
def normalize(text):
    return normalize_text(text)


if __name__ == "__main__":
    print("=" * 60)
    print("PREPROCESSING TEST")
    print("=" * 60)

    test_inputs = [
        "Seri teacher",
        "Sari teacher",
        "Aama teacher",
        "Ama teacher",
        "Mudichiten teacher",
        "Mudichitten teacher",
        "Seri sir",
        "Seri miss",
        "Seri ma'am",
        "Seri mam",
        "Saaptaen appa",
        "Saapten appa",
        "Mudichutten maam",
        "Theriyadhu sir"
    ]

    for text in test_inputs:
        print(f"{text:25} -> {normalize_text(text)}")

    print("=" * 60)