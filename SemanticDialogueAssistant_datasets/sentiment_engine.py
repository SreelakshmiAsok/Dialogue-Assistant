def analyze_sentiment(text):
    positive_words = [
        "good", "great", "excellent", "happy", "thanks", "thank",
        "nice", "love", "correct", "yes", "okay", "ok"
    ]
    negative_words = [
        "bad", "angry", "hate", "wrong", "stupid", "terrible",
        "awful", "no", "disappointed", "sad"
    ]
    text = text.lower()
    positive_score = sum(1 for word in positive_words if word in text)
    negative_score = sum(1 for word in negative_words if word in text)
    if positive_score > negative_score:
        sentiment = "Positive"
    elif negative_score > positive_score:
        sentiment = "Negative"
    else:
        sentiment = "Neutral"
    return {
        "sentiment": sentiment,
        "positive_score": positive_score,
        "negative_score": negative_score
    }

if __name__ == "__main__":
    test_inputs = [
        "Thank you, that was excellent!",
        "This is wrong and terrible.",
        "Okay, I understand."
    ]
    print("=" * 50)
    print("SENTIMENT TEST")
    print("=" * 50)
    for text in test_inputs:
        result = analyze_sentiment(text)
        print("\nInput       :", text)
        print("Sentiment   :", result["sentiment"])
        print("Positive    :", result["positive_score"])
        print("Negative    :", result["negative_score"])
    print("\n" + "=" * 50)
    print("SENTIMENT TEST COMPLETED")
    print("=" * 50)