import os

_MODEL = None

def get_model():
    """
    Lazy load the SentenceTransformer model and cache it locally.
    This prevents loading the model on every API request.
    """
    global _MODEL
    if _MODEL is None:
        try:
            from sentence_transformers import SentenceTransformer
            print("[NLP] Loading Tanglish semantic model...")
            _MODEL = SentenceTransformer("vishnu-n/Morgan-Tanglish-v7")
            print("[NLP] Model loaded successfully.")
        except Exception as e:
            print(f"[NLP] Failed to load model: {e}")
            _MODEL = False  # Indicate failure to avoid repeated load attempts
    return _MODEL

def semantic_similarity(response: str, expected_or_meaning: str) -> float:
    """
    Calculate semantic similarity between a child's response and expected text.
    Returns a score between 0.0 and 1.0.
    """
    model = get_model()
    if not model:
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
        return 0.0
