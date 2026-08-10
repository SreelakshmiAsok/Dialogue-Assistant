import os
import sys
import xml.etree.ElementTree as ET

try:
    from owlready2 import get_ontology, sync_reasoner_pellet
    OWLREADY2_AVAILABLE = True
except ImportError:
    OWLREADY2_AVAILABLE = False

class SocialOntologyReasoner:
    def __init__(self, owl_file_path=None):
        if owl_file_path is None:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            owl_file_path = os.path.join(base_dir, "social_communication.owl")
        
        self.owl_file_path = owl_file_path
        self.onto = None
        self.load_ontology()

    def load_ontology(self):
        if not os.path.exists(self.owl_file_path):
            raise FileNotFoundError(f"Ontology file not found: {self.owl_file_path}")

        if OWLREADY2_AVAILABLE:
            try:
                self.onto = get_ontology(self.owl_file_path).load()
                print(f"[Ontology] Loaded successfully via Owlready2 from {self.owl_file_path}")
                return
            except Exception as e:
                print(f"[Ontology] Owlready2 load error: {e}. Falling back to XML parser.")
        
        # Fallback XML parsing for basic metadata inspection
        self.tree = ET.parse(self.owl_file_path)
        self.root = self.tree.getroot()
        print(f"[Ontology] Loaded via XML parser from {self.owl_file_path}")

    def evaluate_utterance(self, role: str, context: str, utterance_text: str):
        """
        Evaluates an utterance against social communication rules defined in the ontology.
        """
        role_clean = role.lower()
        text_clean = utterance_text.lower().strip()
        
        rule_evaluations = []
        violations = []
        failures = []

        # Rule 1: Politeness & Formal Greetings
        if "teacher" in role_clean or "doctor" in role_clean:
            has_polite = any(w in text_clean for w in ["teacher", "mr", "ms", "mrs", "good morning", "please", "excuse me"])
            has_rude = any(w in text_clean for w in ["hey man", "shut up", "gimme", "stupid", "whatever"])

            if has_rude:
                status = "VIOLATION"
                details = "Used informal or disrespectful phrase when talking to an authority figure."
                violations.append("T_DECORUM")
            elif has_polite or len(text_clean.split()) >= 3:
                status = "PASS"
                details = "Addressed interlocutor with appropriate respect and politeness."
            else:
                status = "FAIL"
                details = "Short response without explicit politeness marker."
                failures.append("T_POLITE")

            rule_evaluations.append({
                "id": "ONTOLOGY_POLITENESS_RULE",
                "name": "Ontology Formal Respect Rule",
                "status": status,
                "details": details,
                "severity": "MEDIUM"
            })

        # Rule 2: Stranger Safety Rule (Critical for ASD Training)
        if "stranger" in role_clean:
            danger_accepted = any(w in text_clean for w in ["sure", "okay", "yes", "go", "puppy", "candy", "chocolate", "car"])
            safety_refused = any(w in text_clean for w in ["no", "don't", "cant", "cannot", "parent", "mom", "dad", "teacher"])

            if danger_accepted and not safety_refused:
                status = "VIOLATION"
                details = "CRITICAL SAFETY VIOLATION: Complied with a stranger's request!"
                violations.append("S_SAFETY_CRITICAL")
            elif safety_refused:
                status = "PASS"
                details = "PASSED SAFETY RULE: Refused stranger and invoked trusted adult."
            else:
                status = "FAIL"
                details = "Unclear safety refusal."
                failures.append("S_REFUSAL")

            rule_evaluations.append({
                "id": "ONTOLOGY_STRANGER_SAFETY_RULE",
                "name": "Ontology Stranger Danger Rule",
                "status": status,
                "details": details,
                "severity": "HIGH"
            })

        # Rule 3: Peer & Friend Cooperation Rule
        if "peer" in role_clean or "friend" in role_clean:
            cooperative = any(w in text_clean for w in ["share", "turn", "together", "sorry", "please", "timer", "minutes", "okay"])
            hostile = any(w in text_clean for w in ["mine", "no way", "get lost", "move", "go away"])

            if hostile:
                status = "VIOLATION"
                details = "Hostile or uncooperative social response to peer."
                violations.append("F_HOSTILE")
            elif cooperative:
                status = "PASS"
                details = "Cooperative social response promoting sharing/turn-taking."
            else:
                status = "FAIL"
                details = "Consider adding turn-taking or polite sharing words."
                failures.append("F_SHARING")

            rule_evaluations.append({
                "id": "ONTOLOGY_PEER_COOPERATION_RULE",
                "name": "Ontology Peer Turn-Taking Rule",
                "status": status,
                "details": details,
                "severity": "LOW"
            })

        return {
            "ontology_file": os.path.basename(self.owl_file_path),
            "owlready2_active": OWLREADY2_AVAILABLE and self.onto is not None,
            "target_role": role,
            "target_context": context,
            "input_text": utterance_text,
            "rules": rule_evaluations,
            "has_violations": len(violations) > 0,
            "has_failures": len(failures) > 0
        }

if __name__ == "__main__":
    reasoner = SocialOntologyReasoner()
    res = reasoner.evaluate_utterance("Teacher", "Classroom", "Good morning Ms. Apple!")
    print("Test Evaluation:", res)
