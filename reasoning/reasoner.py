import os
import sys
import xml.etree.ElementTree as ET

try:
    from owlready2 import get_ontology, sync_reasoner_pellet
    OWLREADY2_AVAILABLE = True
except ImportError:
    OWLREADY2_AVAILABLE = False

class SocialOntologyReasoner:
    def __init__(self, owl_file_path=None, use_tanglish=True):
        base_dir = os.path.dirname(os.path.abspath(__file__))
        
        if owl_file_path is None:
            owl_file_name = "social_communication_tanglish.owl" if use_tanglish else "social_communication.owl"
            owl_file_path = os.path.join(base_dir, owl_file_name)
        
        self.owl_file_path = owl_file_path
        self.use_tanglish = use_tanglish
        self.english_owl_path = os.path.join(base_dir, "social_communication.owl")
        self.tanglish_owl_path = os.path.join(base_dir, "social_communication_tanglish.owl")
        
        self.onto = None
        self.load_ontology()

    def load_ontology(self):
        if not os.path.exists(self.owl_file_path):
            # Fallback to standard owl if specific file missing
            self.owl_file_path = self.english_owl_path

        if OWLREADY2_AVAILABLE:
            try:
                self.onto = get_ontology(self.owl_file_path).load()
                print(f"[Ontology] Loaded successfully via Owlready2 from {os.path.basename(self.owl_file_path)}")
                return
            except Exception as e:
                print(f"[Ontology] Owlready2 load error: {e}. Falling back to XML parser.")
        
        # Fallback XML parsing for basic metadata inspection
        self.tree = ET.parse(self.owl_file_path)
        self.root = self.tree.getroot()
        print(f"[Ontology] Loaded via XML parser from {os.path.basename(self.owl_file_path)}")

    def _has_concept(self, text: str, group: str) -> bool:
        english_synonyms = {
            "polite": [
                "teacher", "mr", "ms", "mrs", "good morning", "please", "excuse me", "excuse", 
                "may i", "can i", "could i", "thank you", "thanks", "pardon", "sorry", "kindly", 
                "may", "can", "could", "is it okay", "is it ok", "will you let me", "thank", "thanks", 
                "grateful", "appreciate", "decency", "polite"
            ],
            "rude": [
                "hey man", "shut up", "gimme", "stupid", "whatever", "dumb"
            ],
            "bathroom": [
                "bathroom", "restroom", "toilet", "washroom", "loo", "potty", "lavatory", "wc", "pee", "poop", 
                "rest room", "bath room", "wash room", "boys room", "girls room"
            ],
            "ready": [
                "ready", "prepared", "set", "fine", "good", "okay", "ok", "all right", "alright", "done", "yes"
            ],
            "stranger_danger": [
                "sure", "okay", "yes", "go", "puppy", "candy", "chocolate", "car", "find", "help", "show", "will"
            ],
            "safety_refused": [
                "no", "not", "cant", "cannot", "dont", "won't", "refuse", "stop", "never", "stay away", "back off", 
                "go away", "don't", "can't", "wont", "nope", "nay", "avoid"
            ],
            "adult_invoked": [
                "parent", "mom", "dad", "teacher", "police", "adult", "family", "mother", "father", "daddy", 
                "mummy", "parents", "guardian", "officer", "grandma", "grandpa"
            ],
            "cooperative": [
                "share", "turn", "together", "sorry", "please", "timer", "minutes", "seconds", "okay", "play", 
                "slide", "swing", "divided", "half", "cooperate", "split", "joint", "turns", "sharing", "give", "take"
            ],
            "hostile": [
                "mine", "no way", "get lost", "move", "go away", "shut up"
            ],
            "honest": [
                "dropped", "accident", "broke", "playing", "slipped", "fell", "lost", "ruined", "damaged", 
                "drop", "break", "slip", "fall", "crash", "destroyed", "hurted", "toy"
            ],
            "blame": [
                "cat did it", "not me", "dog did", "cat did", "wasn't me", "wasnt me", "didn't do", "didnt do", 
                "not my fault", "didn't break", "didnt break", "didn't drop", "didnt drop", "never touched"
            ],
            "sorry": [
                "sorry", "apologize", "apologies", "forgive", "regret", "pardon", "my bad", "accident", 
                "didn't mean", "didnt mean", "remorse"
            ]
        }

        tanglish_extra = {
            "polite": ["vaanga", "poonga", "vanakkam", "seri", "poganum", "ma'am", "ji", "nandri", "mannikkanum", "nga", "neenga", "sir"],
            "rude": ["poda", "podi", "da", "di", "loose", "mental", "chi"],
            "bathroom": ["kakkoose", "bathroom poganum", "pee poganum", "potty poganum", "toilet poganum"],
            "ready": ["ready aayitten", "naan ready", "seri ready"],
            "stranger_danger": ["varreen", "vaanga pogalam", "kudunga"],
            "safety_refused": ["vendam", "venam", "maatten", "vara maatten", "poga maatten", "mudiyadhu", "mudiyaadhu"],
            "adult_invoked": ["amma", "appa", "amma kitta", "appa kitta", "teacher kitta", "police kitta"],
            "cooperative": ["maari maari", "kooda aadalaama", "share panna", "timer vakkalaama", "aadalaam"],
            "hostile": ["enaku thaan", "enadhu", "poda"],
            "honest": ["keezha pottutten", "odanjuruchu", "keezha vizhundhuruchu", "naan thaan"],
            "blame": ["poona thaan pichichi", "naan illa", "naan panna le", "naan podale"],
            "sorry": ["mannikkanum", "thappa pochug", "sorry appa", "sorry dad", "thappu"]
        }

        syn_list = list(english_synonyms.get(group, []))
        if self.use_tanglish:
            syn_list.extend(tanglish_extra.get(group, []))
        
        import re
        text_clean = re.sub(r'[.,\/#!$%\^&\*;:{}=\-_`~()?]', '', text.lower()).strip()
        words = text_clean.split()
        
        negations = {"not", "no", "never", "dont", "cant", "cannot", "wont", "un", "neither", "nor"}
        
        for syn in syn_list:
            syn_clean = syn.lower().strip()
            
            # Handle multi-word synonyms
            if " " in syn_clean:
                if syn_clean in text_clean:
                    # Check preceding 3 words for negation
                    phrase_idx = text_clean.find(syn_clean)
                    preceding_text = text_clean[:phrase_idx].strip()
                    preceding_words = preceding_text.split()
                    if preceding_words:
                        last_few = set(preceding_words[-3:])
                        if not last_few.intersection(negations):
                            return True
                    else:
                        return True
            else:
                for i, w in enumerate(words):
                    if w == syn_clean:
                        prev_words = set(words[max(0, i-2):i])
                        if not prev_words.intersection(negations):
                            return True
                            
        return False

    def evaluate_utterance(self, role: str, context: str, utterance_text: str):
        rule_evaluations = []
        violations = []
        failures = []

        import re
        text_clean = re.sub(r'[.,\/#!$%\^&\*;:{}=\-_`~()?]', '', utterance_text.lower()).strip()

        # 1. TEACHER CLASSROOM SCENARIO
        if role.lower() == "teacher":
            has_polite = self._has_concept(text_clean, "polite")
            has_rude = self._has_concept(text_clean, "rude")
            has_bathroom = self._has_concept(text_clean, "bathroom")
            has_ready = self._has_concept(text_clean, "ready")

            # T_POLITE check
            polite_status = "PASS"
            polite_details = "Utterance contains respectful markers suitable for a teacher."
            if has_rude:
                polite_status = "VIOLATION"
                polite_details = "Contains rude or disrespectful language towards a teacher."
                violations.append("T_POLITE")
            elif not has_polite:
                polite_status = "FAIL"
                polite_details = "Missing polite markers (e.g. 'please', 'vaanga', 'excuse me', 'may I')."
                failures.append("T_POLITE")

            rule_evaluations.append({
                "id": "T_POLITE",
                "name": "Teacher Politeness Rule",
                "status": polite_status,
                "details": polite_details,
                "severity": "MEDIUM"
            })

            # T_CONTEXT check
            context_status = "PASS"
            context_details = "Response addresses classroom prompt (restroom request or test readiness)."
            if not (has_bathroom or has_ready):
                context_status = "FAIL"
                context_details = "Did not answer whether bathroom is needed or ready for test."
                failures.append("T_CONTEXT")

            rule_evaluations.append({
                "id": "T_CONTEXT",
                "name": "Teacher Context Relevance Rule",
                "status": context_status,
                "details": context_details,
                "severity": "LOW"
            })

        # 2. STRANGER SAFETY SCENARIO
        elif role.lower() == "stranger":
            has_danger = self._has_concept(text_clean, "stranger_danger")
            has_refusal = self._has_concept(text_clean, "safety_refused")
            has_adult = self._has_concept(text_clean, "adult_invoked")

            # S_REFUSAL check
            refusal_status = "PASS"
            refusal_details = "Child clearly refused stranger's offer/invitation."
            if has_danger and not has_refusal:
                refusal_status = "VIOLATION"
                refusal_details = "DANGER: Accepted offer or agreed to go with stranger."
                violations.append("S_REFUSAL")
            elif not has_refusal:
                refusal_status = "FAIL"
                refusal_details = "Did not explicitly say NO or refuse (e.g. 'vendam', 'no')."
                failures.append("S_REFUSAL")

            rule_evaluations.append({
                "id": "S_REFUSAL",
                "name": "Stranger Refusal Rule",
                "status": refusal_status,
                "details": refusal_details,
                "severity": "CRITICAL"
            })

            # S_ADULT check
            adult_status = "PASS"
            adult_details = "Invoked parent/teacher authority (e.g., 'Amma kitta kekkanum')."
            if not has_adult:
                adult_status = "FAIL"
                adult_details = "Did not state need to check with parent/trusted adult."
                failures.append("S_ADULT")

            rule_evaluations.append({
                "id": "S_ADULT",
                "name": "Stranger Adult Safety Net Rule",
                "status": adult_status,
                "details": adult_details,
                "severity": "HIGH"
            })

            # S_DISTANCE check
            distance_status = "PASS"
            distance_details = "Maintained safe physical boundary distance."
            if "come" in text_clean or "pet" in text_clean or "touch" in text_clean or "varreen" in text_clean:
                distance_status = "VIOLATION"
                distance_details = "Approached stranger or offered physical contact."
                violations.append("S_DISTANCE")

            rule_evaluations.append({
                "id": "S_DISTANCE",
                "name": "Stranger Distance Rule",
                "status": distance_status,
                "details": distance_details,
                "severity": "HIGH"
            })

        # 3. FRIEND PLAYGROUND SCENARIO
        elif role.lower() in ["peer", "friend"]:
            has_cooperative = self._has_concept(text_clean, "cooperative")
            has_hostile = self._has_concept(text_clean, "hostile")

            # F_TURN check
            turn_status = "PASS"
            turn_details = "Proposed turn-taking or sharing (e.g., 'maari maari', 'timer')."
            if has_hostile:
                turn_status = "VIOLATION"
                turn_details = "Exhibited hostile or non-sharing behavior."
                violations.append("F_TURN")
            elif not has_cooperative:
                turn_status = "FAIL"
                turn_details = "Did not offer to share or set a timer."
                failures.append("F_TURN")

            rule_evaluations.append({
                "id": "F_TURN",
                "name": "Friend Turn Taking Rule",
                "status": turn_status,
                "details": turn_details,
                "severity": "MEDIUM"
            })

        # 4. PARENT HOME SCENARIO ("Did you eat?" / "Nee saapattiya?")
        elif role.lower() == "parent":
            has_rude = self._has_concept(text_clean, "rude") or any(w in text_clean.split() for w in ["poda", "podi", "da", "di", "shut up"])
            has_ate = self._has_concept(text_clean, "ate") or any(w in text_clean for w in ["saapttean", "saapaten", "saapattu", "ate", "yes dad", "yes appa", "innum illa", "not yet", "saappadu"])

            # P_RESPECT check
            respect_status = "PASS"
            respect_details = "Spoke respectfully to Father."
            if has_rude:
                respect_status = "VIOLATION"
                respect_details = "Disrespectful response to Father ('poda' / 'da' / 'shut up')."
                violations.append("P_RESPECT")
            elif not has_ate:
                respect_status = "FAIL"
                respect_details = "Did not state whether food was eaten or ask respectfully for food."
                failures.append("P_RESPECT")

            rule_evaluations.append({
                "id": "P_RESPECT",
                "name": "Parent Respectful Answering Rule",
                "status": respect_status,
                "details": respect_details,
                "severity": "HIGH"
            })

        return {
            "ontology_file": os.path.basename(self.owl_file_path),
            "use_tanglish": self.use_tanglish,
            "owlready2_active": OWLREADY2_AVAILABLE and self.onto is not None,
            "target_role": role,
            "target_context": context,
            "input_text": utterance_text,
            "rules": rule_evaluations,
            "has_violations": len(violations) > 0,
            "has_failures": len(failures) > 0
        }

if __name__ == "__main__":
    reasoner = SocialOntologyReasoner(use_tanglish=True)
    res = reasoner.evaluate_utterance("Teacher", "Classroom", "Sari Ms. Apple, naan bathroom poganum, please?")
    print("Tanglish Test Evaluation:", res)
