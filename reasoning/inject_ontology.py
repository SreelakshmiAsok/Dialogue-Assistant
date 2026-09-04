from owlready2 import *
import os

base_dir = r"c:\Users\Anusree\Desktop\Dialogue-Assistant\reasoning"
owl_file_path = os.path.join(base_dir, "social_communication.owl")

# Load existing ontology
onto = get_ontology("file://" + owl_file_path).load()

with onto:
    # 1. Define base classes (Owlready2 will merge with existing if they have the same name)
    class Utterance(Thing): pass
    class SocialContext(Thing): pass
    class CommunicativeIntent(Thing): pass
    class LinguisticFeature(Thing): pass
    
    # Context Subclasses
    class TeacherContext(SocialContext): pass
    class PeerContext(SocialContext): pass
    class StrangerContext(SocialContext): pass
    class ParentContext(SocialContext): pass
    
    # Intent Subclasses
    class PoliteRequest(CommunicativeIntent): pass
    class SafetyRefusal(CommunicativeIntent): pass
    class HonestApology(CommunicativeIntent): pass
    class CooperativeSuggestion(CommunicativeIntent): pass
    
    # Linguistic Feature Subclasses
    class HonorifcMarker(LinguisticFeature): pass
    class SlangMarker(LinguisticFeature): pass
    class PurposeStatement(LinguisticFeature): pass
    class RefusalMarker(LinguisticFeature): pass
    class TrustedAdultReference(LinguisticFeature): pass
    class ApologyMarker(LinguisticFeature): pass
    
    # 2. Define Object Properties
    class hasIntent(ObjectProperty):
        domain = [Utterance]
        range = [CommunicativeIntent]
        
    class usesFeature(ObjectProperty):
        domain = [Utterance]
        range = [LinguisticFeature]
        
    class appropriateFor(ObjectProperty):
        domain = [CommunicativeIntent]
        range = [SocialContext]
        
    class violates(ObjectProperty):
        domain = [CommunicativeIntent]
        range = [SocialContext]

    # 3. Add OWL Axioms (Restrictions) for classification
    # Define a class for an Utterance that is polite
    class TeacherPoliteUtterance(Utterance):
        equivalent_to = [
            Utterance & 
            usesFeature.some(HonorifcMarker) & 
            usesFeature.some(PurposeStatement)
        ]
        
    class StrangerSafetyUtterance(Utterance):
        equivalent_to = [
            Utterance & 
            usesFeature.some(RefusalMarker) & 
            usesFeature.some(TrustedAdultReference)
        ]

onto.save(file=owl_file_path, format="rdfxml")
print("Ontology successfully injected and saved.")
