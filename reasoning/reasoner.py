import os
import sys
import re
import xml.etree.ElementTree as ET

try:
    from owlready2 import get_ontology, sync_reasoner_pellet
    OWLREADY2_AVAILABLE = True
except ImportError:
    OWLREADY2_AVAILABLE = False

try:
    from ontology_service import OntologyService
except ImportError:
    from reasoning.ontology_service import OntologyService


class SocialOntologyReasoner:
    def __init__(self, owl_file_path=None):
        if owl_file_path is None:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            owl_file_path = os.path.join(base_dir, "social_communication.owl")
        
        self.owl_file_path = owl_file_path
        self.ontology_service = OntologyService(self.owl_file_path)
        self.onto = self.ontology_service.onto

    def evaluate_utterance(self, role: str, context: str, utterance_text: str, intent: str = None, has_politeness: bool = None, semantic_similarity: float = None, expected_goal: str = None, scenario_id: str = None):
        """
        Evaluates an utterance against social communication rules defined in the ontology.
        Queries the OWL knowledge graph via OntologyService to infer AppropriateSocialResponse
        based on scenario-level task expectations, context constraints, and linguistic features.
        """
        role_clean = role.lower()
        text_clean = utterance_text.lower().strip()
        
        rule_evaluations = []
        violations = []
        failures = []
        
        # Ontology Inference: Is this an AppropriateSocialResponse?
        # Requires Intent/Context agreement combined with Semantic evidence.
        # High semantic similarity alone != Correct/Appropriate answer.
        is_appropriate = False
        inference_details = "Not enough semantic/intent evidence to infer appropriateness."

        # 1. Ontology Knowledge Graph Query (Scenario-Aware & Context-Aware Reasoning)
        onto_eval = self.ontology_service.evaluate_intent(
            role=role,
            context=context,
            intent=intent or "unknown",
            scenario_id=scenario_id,
            expected_goal=expected_goal
        )

        constraints = onto_eval.get("constraints", {})
        goal_satisfied = onto_eval.get("goal_satisfied", False)
        intent_appropriate = onto_eval.get("is_appropriate", False)
        inference_details = onto_eval.get("inference_details", "")

        # Check for ontology violations
        if onto_eval.get("is_violation"):
            if "stranger" in role_clean:
                violations.append("S_SAFETY_CRITICAL")
            elif "teacher" in role_clean:
                violations.append("T_DECORUM")
            elif "peer" in role_clean:
                violations.append("F_HOSTILE")
            else:
                violations.append("SOCIAL_VIOLATION")

        # Refusal without politeness for authority figures check
        if intent == "social_refusal" and role_clean in ("parent", "teacher", "father"):
            if not has_politeness:
                intent_appropriate = False
                inference_details = f"Impolite refusal is not appropriate for {role}."
                failures.append("T_POLITE")

        # Synthesize Intent + Semantic Similarity:
        if intent_appropriate and not onto_eval.get("is_violation"):
            # When intent matches scenario goal or is an accepted alternative in ontology,
            # verify it aligns with context
            if semantic_similarity is None or semantic_similarity >= 0.45 or goal_satisfied or onto_eval.get("alternative_accepted"):
                is_appropriate = True
            else:
                is_appropriate = False
                inference_details = f"Intent '{intent}' detected but semantic context does not match scenario."
        elif semantic_similarity and semantic_similarity >= 0.88 and not onto_eval.get("is_violation"):
            # Strongly equivalent response where embeddings show clear semantic equivalence
            is_appropriate = True
            inference_details = "Inferred AppropriateSocialResponse via strong semantic equivalence (>= 0.88)."
        else:
            is_appropriate = False
            if intent in ("unknown", None):
                inference_details = "Utterance intent is unverified for this scenario; semantic similarity alone is insufficient."

        # Rule 1: Politeness & Formal Respect for Authority Figures (Teacher, Parent, Father, Doctor)
        if any(r in role_clean for r in ["teacher", "doctor", "parent", "father"]):
            polite_markers = [
                "teacher", "mr", "ms", "mrs", "good morning", "please", "excuse me",
                "mam", "ma'am", "maam", "madam", "medam", "miss", "missy", "appa", "pa", "amma"
            ]
            rude_markers = [
                "hey man", "shut up", "gimme", "stupid", "idiot", "whatever", "poda", "podi",
                "panni", "get lost", "hate you", "un vela paaru"
            ]

            has_polite = any(re.search(r'\b' + re.escape(w) + r'\b', text_clean) for w in polite_markers)
            has_rude = any(re.search(r'\b' + re.escape(w) + r'\b', text_clean) for w in rude_markers)

            if has_rude:
                status = "VIOLATION"
                details = f"Used informal or disrespectful phrase when talking to an authority figure ({role})."
                violations.append("AUTHORITY_DECORUM")
            elif has_polite or len(text_clean.split()) >= 2:
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
            is_safety_scenario = (
                "SafetyRefusal" in [self.ontology_service.normalize_intent_name(i) for i in constraints.get("expected_intents", [])]
                or expected_goal == "SafetyRefusal"
                or (scenario_id and str(scenario_id).lower() in ("stranger_22", "t2_stranger_01", "t2_stranger_02", "t2_stranger_03", "t2_stranger_04"))
                or any(re.search(r'\b' + re.escape(w) + r'\b', text_clean) for w in ["puppy", "candy", "chocolate", "car", "ride", "lift", "lure"])
            )

            # Match whole tokens to avoid "go" matching "good" or "no" matching "know"
            danger_words = ["sure", "okay", "yes", "go", "puppy", "candy", "chocolate", "car", "come", "ride"]
            refusal_words = ["no", "don't", "dont", "cant", "cannot", "parent", "mom", "dad", "teacher", "vendaam", "illa", "maten"]

            danger_accepted = any(re.search(r'\b' + re.escape(w) + r'\b', text_clean) for w in danger_words)
            safety_refused = any(re.search(r'\b' + re.escape(w) + r'\b', text_clean) for w in refusal_words)

            if is_safety_scenario:
                if danger_accepted and not safety_refused:
                    status = "VIOLATION"
                    details = "CRITICAL SAFETY VIOLATION: Complied with a stranger's request or offer!"
                    violations.append("S_SAFETY_CRITICAL")
                elif safety_refused:
                    status = "PASS"
                    details = "PASSED SAFETY RULE: Refused stranger and invoked trusted adult."
                else:
                    status = "FAIL"
                    details = "Unclear safety refusal."
                    failures.append("S_REFUSAL")
            else:
                # Non-safety stranger interaction (directions, assistance, courtesy)
                if danger_accepted and not safety_refused and any(re.search(r'\b' + re.escape(w) + r'\b', text_clean) for w in ["candy", "chocolate", "car", "ride"]):
                    status = "VIOLATION"
                    details = "CRITICAL SAFETY VIOLATION: Complied with dangerous lure!"
                    violations.append("S_SAFETY_CRITICAL")
                else:
                    status = "PASS"
                    details = "Addressed stranger politely without safety concerns."

            rule_evaluations.append({
                "id": "ONTOLOGY_STRANGER_SAFETY_RULE",
                "name": "Ontology Stranger Danger Rule",
                "status": status,
                "details": details,
                "severity": "HIGH"
            })

        # Rule 3: Peer & Friend Cooperation Rule
        if "peer" in role_clean or "friend" in role_clean:
            cooperative_words = ["share", "turn", "together", "sorry", "please", "timer", "minutes", "okay", "va", "vaa", "polam", "polaam"]
            hostile_words = ["mine", "no way", "get lost", "move", "go away", "shut up", "hate"]

            cooperative = any(re.search(r'\b' + re.escape(w) + r'\b', text_clean) for w in cooperative_words)
            hostile = any(re.search(r'\b' + re.escape(w) + r'\b', text_clean) for w in hostile_words)

            if hostile:
                status = "VIOLATION"
                details = "Hostile or uncooperative social response to peer."
                violations.append("F_HOSTILE")
            elif cooperative or len(text_clean.split()) >= 2:
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
            "scenario_individual": constraints.get("scenario_individual"),
            "context_individual": constraints.get("context_individual"),
            "goal_satisfied": goal_satisfied,
            "alternative_accepted": onto_eval.get("alternative_accepted", False),
            "input_text": utterance_text,
            "inferred_intent": intent,
            "is_appropriate": is_appropriate,
            "inference_details": inference_details,
            "rules": rule_evaluations,
            "has_violations": len(violations) > 0,
            "has_failures": len(failures) > 0
        }

if __name__ == "__main__":
    reasoner = SocialOntologyReasoner()
    res = reasoner.evaluate_utterance("Teacher", "Classroom", "Good morning Ms. Priya!")
    print("Test Evaluation:", res)
