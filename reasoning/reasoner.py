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

    def _has_concept(self, text: str, group: str) -> bool:
        synonyms = {
            "polite": ["teacher", "mr", "ms", "mrs", "good morning", "please", "excuse me", "excuse", "may i", "can i", "could i", "thank you", "thanks", "pardon", "sorry", "kindly", "may", "can", "could", "is it okay", "is it ok", "will you let me", "thank", "thanks", "grateful", "appreciate", "decency", "polite"],
            "rude": ["hey man", "shut up", "gimme", "stupid", "whatever", "dumb"],
            "bathroom": ["bathroom", "restroom", "toilet", "washroom", "loo", "potty", "lavatory", "wc", "pee", "poop", "rest room", "bath room", "wash room", "boys room", "girls room"],
            "ready": ["ready", "prepared", "set", "fine", "good", "okay", "ok", "all right", "alright", "done", "yes"],
            "stranger_danger": ["sure", "okay", "yes", "go", "puppy", "candy", "chocolate", "car", "find", "help", "show", "will"],
            "safety_refused": ["no", "not", "cant", "cannot", "dont", "won't", "refuse", "stop", "never", "stay away", "back off", "go away", "don't", "can't", "wont", "nope", "nay", "avoid"],
            "adult_invoked": ["parent", "mom", "dad", "teacher", "police", "adult", "family", "mother", "father", "daddy", "mummy", "parents", "guardian", "officer", "grandma", "grandpa"],
            "cooperative": ["share", "turn", "together", "sorry", "please", "timer", "minutes", "seconds", "okay", "play", "slide", "swing", "divided", "half", "cooperate", "split", "joint", "turns", "sharing", "give", "take"],
            "hostile": ["mine", "no way", "get lost", "move", "go away", "shut up"],
            "honest": ["dropped", "accident", "broke", "playing", "slipped", "fell", "lost", "ruined", "damaged", "drop", "break", "slip", "fall", "crash", "destroyed", "hurted", "toy"],
            "blame": ["cat did it", "not me", "dog did", "cat did", "wasn't me", "wasnt me", "didn't do", "didnt do", "not my fault", "didn't break", "didnt break", "didn't drop", "didnt drop", "never touched"],
            "sorry": ["sorry", "apologize", "apologies", "forgive", "regret", "pardon", "my bad", "accident", "didn't mean", "didnt mean", "remorse"]
        }
        
        import re
        text_clean = re.sub(r'[.,\/#!$%\^&\*;:{}=\-_`~()?]', '', text.lower()).strip()
        words = text_clean.split()
        
        negations = {"not", "no", "never", "dont", "cant", "cannot", "wont", "un", "neither", "nor"}
        
        for syn in synonyms.get(group, []):
            syn_clean = syn.lower().strip()
            
            # Handle multi-word synonyms
            if " " in syn_clean:
                if syn_clean in text_clean:
                    # Check preceding 3 words for negation
                    phrase_idx = text_clean.find(syn_clean)
                    preceding_text = text_clean[:phrase_idx].strip()
                    preceding_words = preceding_text.split()
                    if preceding_words:
                        last_words = preceding_words[-3:]
                        if any(nw in negations or nw.endswith("n't") for nw in last_words):
                            continue
                    return True
            else:
                # Handle single word synonyms
                if syn_clean in words:
                    indices = [i for i, w in enumerate(words) if w == syn_clean]
                    for idx in indices:
                        is_negated = False
                        for offset in range(1, 4):
                            if idx - offset >= 0:
                                prev = words[idx - offset]
                                if prev in negations or prev.endswith("n't"):
                                    is_negated = True
                                    break
                        if not is_negated:
                            return True
        return False

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
            has_polite = self._has_concept(text_clean, "polite")
            has_rude = self._has_concept(text_clean, "rude")

            # T_DECORUM check
            decorum_status = "PASS"
            decorum_details = "Avoided rude or informal phrases."
            if has_rude:
                decorum_status = "VIOLATION"
                decorum_details = "Used informal or disrespectful phrase when talking to an authority figure."
                violations.append("T_DECORUM")

            rule_evaluations.append({
                "id": "T_DECORUM",
                "name": "Formal Respect Check",
                "status": decorum_status,
                "details": decorum_details,
                "severity": "HIGH"
            })

            # T_POLITE check
            polite_status = "PASS"
            polite_details = "Addressed interlocutor with appropriate respect and politeness."
            if not has_polite and len(text_clean.split()) < 3:
                polite_status = "FAIL"
                polite_details = "Short response without explicit politeness marker."
                failures.append("T_POLITE")

            rule_evaluations.append({
                "id": "T_POLITE",
                "name": "Polite Words Rule",
                "status": polite_status,
                "details": polite_details,
                "severity": "HIGH"
            })

        # Rule 2: Stranger Safety Rule (Critical for ASD Training)
        if "stranger" in role_clean:
            danger_accepted = self._has_concept(text_clean, "stranger_danger")
            safety_refused = self._has_concept(text_clean, "safety_refused")
            adult_invoked = self._has_concept(text_clean, "adult_invoked")

            # Evaluate Say NO rule
            refusal_status = "PASS"
            refusal_details = "Refused stranger's request safely."
            if danger_accepted and not safety_refused:
                refusal_status = "VIOLATION"
                refusal_details = "CRITICAL SAFETY VIOLATION: Complied with a stranger's request!"
                violations.append("S_SAFETY_CRITICAL")
            elif not safety_refused:
                refusal_status = "FAIL"
                refusal_details = "Unclear safety refusal."
                failures.append("S_REFUSAL")

            rule_evaluations.append({
                "id": "S_REFUSAL",
                "name": "Ontology Stranger Refusal Rule",
                "status": refusal_status,
                "details": refusal_details,
                "severity": "HIGH"
            })

            # Evaluate Tell Adult rule
            adult_status = "PASS"
            adult_details = "Invoked a trusted adult."
            if not adult_invoked:
                adult_status = "FAIL"
                adult_details = "Did not mention telling a trusted adult (mom, dad, teacher, etc.)."
                failures.append("S_ADULT")

            rule_evaluations.append({
                "id": "S_ADULT",
                "name": "Ontology Stranger Adult Invoke Rule",
                "status": adult_status,
                "details": adult_details,
                "severity": "HIGH"
            })

        # Rule 3: Peer & Friend Cooperation Rule
        if "peer" in role_clean or "friend" in role_clean:
            cooperative = self._has_concept(text_clean, "cooperative")
            hostile = self._has_concept(text_clean, "hostile")

            # F_HOSTILE check
            hostile_status = "PASS"
            hostile_details = "Avoided hostile phrases."
            if hostile:
                hostile_status = "VIOLATION"
                hostile_details = "Hostile or uncooperative social response to peer."
                violations.append("F_HOSTILE")

            rule_evaluations.append({
                "id": "F_HOSTILE",
                "name": "Friendly Tone Rule",
                "status": hostile_status,
                "details": hostile_details,
                "severity": "HIGH"
            })

            # F_TURN check
            turn_status = "PASS"
            turn_details = "Cooperative social response promoting sharing/turn-taking."
            if not cooperative:
                turn_status = "FAIL"
                turn_details = "Consider adding turn-taking or polite sharing words."
                failures.append("F_TURN")

            rule_evaluations.append({
                "id": "F_TURN",
                "name": "Ontology Peer Turn-Taking Rule",
                "status": turn_status,
                "details": turn_details,
                "severity": "LOW"
            })

        # Rule 4: Parent Honesty & Apology Rule
        if "parent" in role_clean or "father" in role_clean or "mother" in role_clean or "dad" in role_clean or "mom" in role_clean:
            has_honest = self._has_concept(text_clean, "honest")
            has_blame = self._has_concept(text_clean, "blame")
            has_sorry = self._has_concept(text_clean, "sorry")

            # P_HONESTY check
            honesty_status = "PASS"
            honesty_details = "Honest explanation given to parent."
            if has_blame:
                honesty_status = "VIOLATION"
                honesty_details = "Blamed someone else or was dishonest to parent."
                violations.append("P_HONESTY")
            elif not has_honest:
                honesty_status = "FAIL"
                honesty_details = "Did not explain what happened honestly."
                failures.append("P_HONESTY")

            rule_evaluations.append({
                "id": "P_HONESTY",
                "name": "Parent Honesty Rule",
                "status": honesty_status,
                "details": honesty_details,
                "severity": "HIGH"
            })

            # P_APOLOGY check
            apology_status = "PASS"
            apology_details = "Apology given to parent."
            if not has_sorry:
                apology_status = "FAIL"
                apology_details = "Did not apologize to parent."
                failures.append("P_APOLOGY")

            rule_evaluations.append({
                "id": "P_APOLOGY",
                "name": "Parent Apology Rule",
                "status": apology_status,
                "details": apology_details,
                "severity": "HIGH"
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
