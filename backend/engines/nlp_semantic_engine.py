import os

_MODEL = None

def get_model():
    """
    Lazy load the SentenceTransformer model and cache it locally.
    This prevents loading the model on every API request.
    """
    global _MODEL
    if os.environ.get("DISABLE_NEURAL_MODEL") == "1":
        return False

    if _MODEL is None:
        try:
            from sentence_transformers import SentenceTransformer
            print("[NLP] Loading Tanglish semantic model...")
            try:
                _MODEL = SentenceTransformer("vishnu-n/Morgan-Tanglish-v7", local_files_only=True)
            except Exception:
                _MODEL = SentenceTransformer("vishnu-n/Morgan-Tanglish-v7")
            print("[NLP] Model loaded successfully.")
        except Exception as e:
            print(f"[NLP] Failed to load neural model ({e}). Using semantic similarity fallback.")
            _MODEL = False  # Indicate failure to avoid repeated load attempts
    return _MODEL

def semantic_similarity(response: str, expected_or_meaning: str) -> float:
    """
    Calculate semantic similarity between a child's response and expected text.
    Returns a score between 0.0 and 1.0.
    """
    model = get_model()
    if not model:
        try:
            from engines.semantic_engine import combined_similarity
            return combined_similarity(response, expected_or_meaning)
        except Exception:
            return 0.0
        
    try:
        from sentence_transformers import util
        
        # Compute embeddings
        emb1 = model.encode(response, convert_to_tensor=True)
        emb2 = model.encode(expected_or_meaning, convert_to_tensor=True)
        
        # Compute cosine similarity
        cosine_score = util.pytorch_cos_sim(emb1, emb2).item()
        
        # Clamp between 0.0 and 1.0
        return max(0.0, min(1.0, cosine_score))
    except Exception as e:
        print(f"[NLP] Error computing semantic similarity: {e}")
        try:
            from engines.semantic_engine import combined_similarity
            return combined_similarity(response, expected_or_meaning)
        except Exception:
            return 0.0
