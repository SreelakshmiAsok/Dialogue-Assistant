from owlready2 import *
import os

base_dir = r"c:\Users\Anusree\Desktop\Dialogue-Assistant\reasoning"
owl_file_path = os.path.join(base_dir, "social_communication.owl")

print("Loading ontology...")
onto = get_ontology("file://" + owl_file_path).load()

with onto:
    # Let's create an individual Utterance and some Features
    u1 = onto.Utterance("test_utterance_1")
    f1 = onto.HonorifcMarker("marker_please")
    f2 = onto.PurposeStatement("purpose_bathroom")
    
    u1.usesFeature.append(f1)
    u1.usesFeature.append(f2)
    
    # Let's say we detected this is a PoliteRequest (based on rules/NLP)
    # The reasoner can then check if this PoliteRequest satisfies its constraints.
    pr1 = onto.PoliteRequest("intent_1")
    u1.hasIntent.append(pr1)
    
    print(f"Before reasoning: u1 classes = {u1.INDIRECT_is_a}")

# Run Pellet reasoner
print("Running Pellet reasoner...")
try:
    sync_reasoner_hermit(infer_property_values=True)
    print(f"After reasoning: u1 classes = {u1.INDIRECT_is_a}")
    print("Reasoner finished without inconsistencies!")
except Exception as e:
    print(f"Inconsistency or error found: {e}")
