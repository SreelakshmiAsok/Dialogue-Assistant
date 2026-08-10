def speech_to_text(text):
    if not text or not text.strip():
        return ""
    return text.strip()

def text_to_speech(text):
    if not text:
        return "No text provided."
    print("Assistant says:", text)
    return text

if __name__ == "__main__":
    print("=" * 50)
    print("SPEECH MODULE TEST")
    print("=" * 50)

    user_input = "Varen appa"
    converted_text = speech_to_text(user_input)

    print("Input Speech :", user_input)
    print("Converted Text:", converted_text)

    response = "Varen appa"
    text_to_speech(response)

    print("=" * 50)
    print("SPEECH TEST COMPLETED")
    print("=" * 50)