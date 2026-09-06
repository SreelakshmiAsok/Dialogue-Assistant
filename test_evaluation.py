import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
sys.path.append(os.path.join(os.path.dirname(__file__), 'reasoning'))

from engines.semantic_engine import extract_linguistic_features, classify_response_intent
from engines.nlp_semantic_engine import semantic_similarity
from reasoner import SocialOntologyReasoner

reasoner = SocialOntologyReasoner()

scenarios = [
    {
        "name": "Stranger - Uncertainty",
        "role": "Stranger",
        "context": "Park",
        "expected": "Theriyadhu sir",
        "input": "therila medam",
        "politeness": True
    },
    {
        "name": "Friend - Acceptance",
        "role": "Friend",
        "context": "Playground",
        "expected": "Va da, vilayaadalaam",
        "input": "Vaa vaadaa",
        "politeness": True
    },
    {
        "name": "Parent - Request",
        "role": "Parent",
        "context": "Home",
        "expected": "Seri appa",
        "input": "5 min appa",
        "politeness": True
    },
    {
        "name": "Parent - Polite Refusal",
        "role": "Parent",
        "context": "Home",
        "expected": "Seri appa",
        "input": "No appa, I am busy",
        "politeness": True
    }
]

print("=" * 60)
print("ONTOLOGY EVALUATION TESTS")
print("=" * 60)

for s in scenarios:
    print(f"\nScenario: {s['name']}")
    print(f"Role: {s['role']}")
    print(f"Input: {s['input']}")
    print(f"Expected: {s['expected']}")
    
    intent = classify_response_intent(s["input"])
    sim = semantic_similarity(s["input"], s["expected"])
    
    print(f"-> Inferred Intent: {intent}")
    print(f"-> NLP Similarity: {sim:.3f}")
    
    result = reasoner.evaluate_utterance(
        role=s["role"],
        context=s["context"],
        utterance_text=s["input"],
        intent=intent,
        has_politeness=s["politeness"],
        semantic_similarity=sim
    )
    
    print(f"-> Is Appropriate: {result['is_appropriate']}")
    print(f"-> Inference Details: {result['inference_details']}")
    if result["has_violations"]:
        print(f"-> VIOLATIONS DETECTED")

print("\n" + "=" * 60)
