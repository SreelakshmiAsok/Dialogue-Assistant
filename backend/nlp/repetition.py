"""
Echo / repetition detection.

A child sometimes just repeats what the computer said ("Good morning! Ullae vaanga." ->
"Good morning! Ullae vaanga.") instead of taking their own conversational turn. That is neither
a correct nor a wrong answer, so the caller should give a gentle nudge and let the child try again
without scoring the attempt.

The check is role/lesson agnostic: it only compares the child's words with the computer's
immediately preceding line(s).
"""
import random
import re
from difflib import SequenceMatcher

from nlp.preprocessing import normalize_text

_VOWEL_FOLD = (
    ("aa", "a"), ("ee", "i"), ("ii", "i"), ("oo", "u"), ("uu", "u"), ("ei", "i"),
    ("ai", "i"), ("au", "o"), ("ou", "o"), ("e", "i"), ("o", "u"),
)


def _fold_word(word):
    """Collapse spelling / speech-to-text variants so 'kirikked' ~ 'cricket', 'vaanga' ~ 'vanga'."""
    w = word.lower()
    w = w.replace("ck", "k").replace("c", "k").replace("q", "k")
    w = w.replace("th", "t").replace("dh", "d").replace("zh", "l").replace("sh", "s").replace("ch", "s")
    w = w.replace("w", "v").replace("z", "s").replace("x", "ks").replace("ph", "f")
    w = re.sub(r"(.)\1+", r"\1", w)  # doubled letters
    for a, b in _VOWEL_FOLD:
        w = w.replace(a, b)
    w = re.sub(r"(.)\1+", r"\1", w)
    return w


def _tokens(text):
    cleaned = normalize_text(re.sub(r"[^\w\s']", " ", str(text or ""), flags=re.UNICODE))
    return [_fold_word(t) for t in cleaned.replace("'", "").split() if t]


def _same(a, b):
    if a == b:
        return True
    if min(len(a), len(b)) < 4:
        return False
    return SequenceMatcher(None, a, b).ratio() >= 0.75


def _match_count(resp, prompt):
    """How many response tokens (each used once) have a counterpart in the prompt."""
    pool = list(prompt)
    hits = 0
    for tok in resp:
        for i, p in enumerate(pool):
            if _same(tok, p):
                hits += 1
                pool.pop(i)
                break
    return hits


def is_echo(response, computer_lines, accepted_answers=None):
    """
    True when `response` is essentially a repetition of one of `computer_lines`
    (the computer's immediately preceding statement, in Tanglish and/or transliterated Tamil).

    - Tolerates spelling / pronunciation / speech-to-text differences.
    - Legitimate answers are never flagged: a response equal to an accepted answer, or one that
      adds its own content beyond the computer's words, is not an echo.
    """
    resp = _tokens(response)
    if not resp:
        return False

    for ans in accepted_answers or []:
        if _tokens(ans) == resp:
            return False

    for line in computer_lines or []:
        prompt = _tokens(line)
        if len(resp) == 1 or len(prompt) < 2:
            # One-word case: only an echo when the computer asked a one-word QUESTION
            # ("Saapdalama?") and the child said that very word back. A greeting ("Hello") or a
            # statement-like answer ("Saapdalam") is a normal reply.
            if len(resp) == 1 and len(prompt) == 1 and "?" in str(line) and resp == prompt:
                return True
            continue
        matched = _match_count(resp, prompt)
        precision = matched / len(resp)   # how much of what the child said came from the computer
        recall = matched / len(prompt)    # how much of the computer's line the child repeated
        whole = SequenceMatcher(None, " ".join(resp), " ".join(prompt)).ratio()
        if matched >= 2 and precision >= 0.8 and (recall >= 0.7 or (matched >= 3 and recall >= 0.5)):
            return True
        if whole >= 0.88:
            return True
    return False


# --- gentle, child-friendly reminders (spoken Tamil + short English) ------------------------------
_LEVEL0 = [
    ("Don't repeat what I said. Try giving me your own answer!", "நான் சொன்னதையே சொல்லாத. உன் சொந்த பதிலை சொல்லு!"),
    ("That's what I said! Now you try responding.", "அது நான் சொன்னது! இப்போ நீ பதில் சொல்லு."),
    ("Come on, you can answer me!", "வா வா, நீ எனக்கு பதில் சொல்லலாம்!"),
]
_LEVEL1 = [
    ("Now it's your turn! Say something back to me.", "இப்போ உன் டர்ன்! எனக்கு பதில் சொல்லு."),
    ("Just tell me your answer. Easy!", "உன் பதிலை மட்டும் சொல்லு. ஈஸி!"),
]
_LEVEL2 = ("Here's a little help. Try saying:", "கொஞ்சம் ஹெல்ப். இப்படி சொல்லிப் பாரு:")


def repetition_reply(repeat_count=0, model_answer="", model_answer_tamil="", last_feedback=None):
    """
    Reminder for the (repeat_count+1)-th echo in a row. Escalates from a gentle nudge to a simpler
    prompt to a supportive hint, and never repeats the exact same line twice in a row.
    Returns {"feedback", "feedback_tamil", "suggestion"}.
    """
    try:
        n = max(0, int(repeat_count))
    except (TypeError, ValueError):
        n = 0

    if n >= 2 and model_answer:
        en, ta = _LEVEL2
        return {
            "feedback": en,
            "feedback_tamil": f"{ta} {model_answer_tamil}".strip() if model_answer_tamil else ta,
            "suggestion": model_answer,
        }

    pool = _LEVEL0 if n == 0 else _LEVEL1
    options = [p for p in pool if p[0] != last_feedback] or pool
    en, ta = random.choice(options)
    return {"feedback": en, "feedback_tamil": ta, "suggestion": None}
