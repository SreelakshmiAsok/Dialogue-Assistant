NORMALIZATION = {
    "vanga": "vaanga",
    "vaa": "va",
    "varenpa": "varen appa",
    "seripa": "seri appa",
    "theriyadhu": "theriyadhu",
    "ammaa": "amma",
    "appaa": "appa",
    "sirr": "sir",
    "teachar": "teacher",
    "teacherr": "teacher"
}

def normalize(text):
    text = text.lower()
    words = text.split()
    output = []
    for word in words:
        output.append(NORMALIZATION.get(word, word))
    return " ".join(output)