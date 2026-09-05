import time
import os
import sys

def main():
    try:
        from sentence_transformers import SentenceTransformer, util
    except ImportError:
        print("sentence-transformers not installed yet. Waiting...")
        return
    
    print("Loading model vishnu-n/Morgan-Tanglish-v7 ...")
    start = time.time()
    # Optional: set cache folder if needed
    model = SentenceTransformer("vishnu-n/Morgan-Tanglish-v7")
    print(f"Model loaded in {time.time() - start:.2f} seconds.")

    test_cases = [
        {"response": "Vaa vaadaa", "expected": "Va da, vilayaadalaam", "label": "Accept peer invitation"},
        {"response": "Va da", "expected": "Va da, vilayaadalaam", "label": "Accept peer invitation"},
        {"response": "Va da, vilayaadalaam", "expected": "Va da, vilayaadalaam", "label": "Accept peer invitation"},
        {"response": "No", "expected": "Va da, vilayaadalaam", "label": "Accept peer invitation"},
        {"response": "No appa, I am busy", "expected": "Seri appa", "label": "Respond to father"},
        {"response": "5 min appa", "expected": "Seri appa", "label": "Respond to father"},
        {"response": "illa da", "expected": "Va da, vilayaadalaam", "label": "Accept peer invitation"},
        {"response": "saaptaen appa", "expected": "Aama appa, saaptaen", "label": "Answer eaten"},
    ]
    
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
    try:
        from engines.semantic_engine import combined_similarity, normalize_text
    except ImportError as e:
        print("Failed to import existing engine:", e)
        combined_similarity = None
        normalize_text = lambda x: x

    print("=" * 95)
    print(f"{'Response':<25} | {'Scenario (Expected)':<25} | {'NLP Sim':<8} | {'Fuzzy Sim':<9} | {'Interpretation'}")
    print("-" * 95)

    for case in test_cases:
        resp = case["response"]
        exp = case["expected"]
        
        emb1 = model.encode(resp, convert_to_tensor=True)
        emb2 = model.encode(exp, convert_to_tensor=True)
        nlp_sim = util.pytorch_cos_sim(emb1, emb2).item()
        
        fuzzy_sim = 0.0
        if combined_similarity:
            fuzzy_sim = combined_similarity(normalize_text(resp), normalize_text(exp))
            
        interpretation = "Match" if nlp_sim > 0.6 else "Different"
        print(f"{resp:<25} | {exp:<25} | {nlp_sim:<8.3f} | {fuzzy_sim:<9.3f} | {interpretation}")

    print("=" * 95)

if __name__ == '__main__':
    main()
