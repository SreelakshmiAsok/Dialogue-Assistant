"""
Tanglish to Tamil audio synthesis helper.
Ensures characters speak authentic, fluent Tamil rather than spelling out Tanglish letters.
Includes resilient fallback between edge-tts and gTTS.
"""

import os
import re
import glob
import json
import subprocess
from gtts import gTTS

# Normalization helper for Tanglish phrases
def normalize_phrase(s):
    if not s:
        return ""
    # Strip stage directions
    s = re.sub(r'\(.*?\)', '', s)
    # Strip punctuation and lowercase
    s = re.sub(r'[^\w\s]', '', s.lower())
    return re.sub(r'\s+', ' ', s).strip()

def has_tamil(text):
    return bool(re.search(r'[\u0B80-\u0BFF]', text))

# Common vocabulary dictionary for standalone phrases or words
COMMON_VOCAB = {
    "vanakkam": "வணக்கம்",
    "vanakkam pa": "வணக்கம் பா",
    "vanakkam appa": "வணக்கம் அப்பா",
    "nandri": "நன்றி",
    "seri": "சரி",
    "appa": "அப்பா",
    "amma": "அம்மா",
    "pa": "பா",
    "ma": "மா",
    "kanna": "கண்ணா",
    "ok appa": "ஓகே அப்பா",
    "seri appa": "சரி அப்பா",
    "varen appa": "வாரேன் அப்பா",
    "promise appa": "பிராமிஸ் அப்பா",
    "innum 5 minutes pa": "இன்னும் 5 நிமிஷம் பா",
    "vilayaadalaam": "விளையாடலாம்",
    "va da": "வா டா",
    "vaa da": "வா டா",
    "bye": "பை",
    "kudukiren": "குடுக்கிறேன்",
    "edukiren": "எடுக்கிறேன்",
    "polaam": "போலாம்",
    "mudichacha": "முடிச்சாச்சா",
    "saaptacha": "சாப்பிட்டாச்சா",
    "saaptiya": "சாப்பிட்டியா"
}

class TanglishAudioResolver:
    def __init__(self):
        self.mapping = {}
        self._load_mappings()

    def _load_mappings(self):
        # 1. Load from common vocab
        for k, v in COMMON_VOCAB.items():
            self.mapping[normalize_phrase(k)] = v

        # 2. Load from Tier 1 questions
        try:
            from backend.data.questions import QUESTIONS
            for char, q_list in QUESTIONS.items():
                for q in q_list:
                    t_en = q.get("question_tanglish")
                    t_ta = q.get("question_tamil")
                    if t_en and t_ta:
                        self.mapping[normalize_phrase(t_en)] = t_ta.strip()
                    # Also map model answer if it exists
                    m_en = q.get("model_answer")
                    if m_en and t_ta and not has_tamil(m_en):
                        self.mapping[normalize_phrase(m_en)] = t_ta.strip()
        except Exception as e:
            # Try alternate path if called outside backend
            try:
                from data.questions import QUESTIONS
                for char, q_list in QUESTIONS.items():
                    for q in q_list:
                        t_en = q.get("question_tanglish")
                        t_ta = q.get("question_tamil")
                        if t_en and t_ta:
                            self.mapping[normalize_phrase(t_en)] = t_ta.strip()
            except Exception:
                pass

        # 3. Load from all lesson files
        # Find lessons directory
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
        lessons_dir = os.path.join(base_dir, "lessons")
        if not os.path.exists(lessons_dir):
            lessons_dir = os.path.join(base_dir, "..", "lessons")

        for f in glob.glob(os.path.join(lessons_dir, "**", "*.json"), recursive=True):
            try:
                with open(f, encoding="utf-8") as fp:
                    d = json.load(fp)
                init = d.get("initial_prompt")
                if init and init.get("tanglish") and init.get("tamil"):
                    self.mapping[normalize_phrase(init["tanglish"])] = init["tamil"].strip()
                for t in d.get("turns", []):
                    p = t.get("prompt")
                    if p and p.get("tanglish") and p.get("tamil"):
                        self.mapping[normalize_phrase(p["tanglish"])] = p["tamil"].strip()
                    ncr = t.get("next_character_reply")
                    if ncr and ncr.get("tanglish") and ncr.get("tamil"):
                        self.mapping[normalize_phrase(ncr["tanglish"])] = ncr["tamil"].strip()
            except Exception:
                pass

    def resolve_text_for_speech(self, text, character):
        """
        Returns the optimal text to send to TTS.
        If character is Narrator, returns English text.
        For characters, ensures authentic Tamil script is used so words are spoken properly,
        preventing edge-tts from spelling out letters.
        """
        if not text:
            return ""

        # Strip parenthesized actions e.g. "(Talking on phone)"
        cleaned = re.sub(r'\(.*?\)', '', text).strip()
        if not cleaned:
            cleaned = text.strip()

        # Narrator stays in original (English)
        if character == "Narrator":
            return cleaned

        # If already in Tamil Unicode script, return it
        if has_tamil(cleaned):
            return cleaned

        # Look up in harvested dictionary
        norm = normalize_phrase(cleaned)
        if norm in self.mapping:
            return self.mapping[norm]

        # Partial matching: check if any key is contained in norm or vice versa
        for k, v in self.mapping.items():
            if len(k) > 10 and (k in norm or norm in k):
                return v

        # If still Tanglish, return cleaned (will be voiced by Tamil voice with gTTS fallback)
        return cleaned

    def synthesize_to_file(self, text, character, output_filepath):
        """
        Synthesizes speech to output_filepath.
        Uses edge-tts with ta-IN neural voices for characters.
        Falls back to gTTS if edge-tts fails or creates a 0-byte file.
        """
        os.makedirs(os.path.dirname(os.path.abspath(output_filepath)), exist_ok=True)
        spoken_text = self.resolve_text_for_speech(text, character)

        # Remove any 0-byte existing file
        if os.path.exists(output_filepath) and os.path.getsize(output_filepath) == 0:
            try:
                os.remove(output_filepath)
            except Exception:
                pass

        # Select voice
        if character == "Narrator":
            voice = "en-IN-NeerjaExpressiveNeural"
            lang = "en"
        elif character in ["Father", "Stranger", "Friend"]:
            voice = "ta-IN-ValluvarNeural"
            lang = "ta"
        else: # Teacher or female character
            voice = "ta-IN-PallaviNeural"
            lang = "ta"

        # Try edge-tts first
        try:
            res = subprocess.run(
                ["edge-tts", "--voice", voice, "--text", spoken_text, "--write-media", output_filepath],
                capture_output=True,
                text=True,
                timeout=12
            )
            if res.returncode == 0 and os.path.exists(output_filepath) and os.path.getsize(output_filepath) > 0:
                return True
        except Exception as e:
            print(f"[TTS] edge-tts error: {e}")

        # If edge-tts failed or generated 0 bytes, fallback to gTTS
        print(f"[TTS] Falling back to gTTS for character='{character}', text='{spoken_text[:30]}...'")
        try:
            if os.path.exists(output_filepath) and os.path.getsize(output_filepath) == 0:
                os.remove(output_filepath)
            tts = gTTS(text=spoken_text, lang=lang)
            tts.save(output_filepath)
            if os.path.exists(output_filepath) and os.path.getsize(output_filepath) > 0:
                return True
        except Exception as e:
            print(f"[TTS] gTTS fallback failed: {e}")

        return False

# Global instance
tanglish_resolver = TanglishAudioResolver()
