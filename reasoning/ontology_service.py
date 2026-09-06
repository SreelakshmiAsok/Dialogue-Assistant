"""
Ontology Service for TalkWise.
Queries social_communication.owl using Owlready2 to provide context-aware,
scenario-aware, and intent-aware semantic reasoning.
"""

import os
import xml.etree.ElementTree as ET

try:
    from owlready2 import get_ontology
    OWLREADY2_AVAILABLE = True
except ImportError:
    OWLREADY2_AVAILABLE = False


class OntologyService:
    """
    Interface to the Web Ontology Language (OWL) knowledge graph.
    Provides semantic querying of:
      1. Social roles and contexts (ParentContext, TeacherContext, PeerContext, StrangerContext)
      2. Scenario-level task constraints (Scenario_Father_Meals -> expectsIntent -> AnswerQuestion)
      3. Intent appropriateness and violation axioms (appropriateFor, violates, violatesScenario)
      4. Required linguistic and pragmatic features (HonorificMarker, ExcuseMeMarker, RefusalMarker)
    """

    def __init__(self, owl_file_path=None):
        if owl_file_path is None:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            owl_file_path = os.path.join(base_dir, "social_communication.owl")

        self.owl_file_path = owl_file_path
        self.onto = None
        self.owlready_active = False
        self._load_ontology()

    def _load_ontology(self):
        if not os.path.exists(self.owl_file_path):
            raise FileNotFoundError(f"Ontology file not found: {self.owl_file_path}")

        if OWLREADY2_AVAILABLE:
            try:
                iri_path = "file://" + self.owl_file_path.replace("\\", "/")
                self.onto = get_ontology(iri_path).load()
                self.owlready_active = True
                print(f"[OntologyService] Successfully loaded OWL ontology via Owlready2.")
                return
            except Exception as e:
                print(f"[OntologyService] Owlready2 load failed: {e}. Falling back to XML inspection.")

        self._fallback_tree = ET.parse(self.owl_file_path)
        self.owlready_active = False

    def normalize_intent_name(self, intent_str: str) -> str:
        """Standardize intent strings across NLP engine and OWL individuals."""
        if not intent_str:
            return ""
        clean = intent_str.strip().lower().replace("_", "").replace("-", "")
        mapping = {
            "answerquestion": "AnswerQuestion",
            "taskcompletion": "TaskCompletion",
            "taskcompletionconfirmation": "TaskCompletion",
            "incompletetask": "IncompleteTask",
            "incompletetaskreport": "IncompleteTask",
            "politrequest": "PoliteRequest",
            "politerequest": "PoliteRequest",
            "politeinterruption": "PoliteInterruption",
            "contextualrequest": "ContextualRequest",
            "safetyrefusal": "SafetyRefusal",
            "uncertainty": "Uncertainty",
            "uncertaintyresponse": "Uncertainty",
            "socialacceptance": "SocialAcceptance",
            "peerinvitationacceptance": "SocialAcceptance",
            "politerefusal": "PoliteRefusal",
            "cooperativesuggestion": "CooperativeSuggestion",
            "strangercompliance": "StrangerCompliance",
            "hostilerefusal": "HostileRefusal",
            "disrespectfulinformal": "DisrespectfulInformal"
        }
        return mapping.get(clean, intent_str)

    def resolve_scenario_individual(self, role: str, context: str, scenario_id: str = None, expected_goal: str = None):
        """
        Finds the most specific CommunicationScenario individual in the ontology
        matching the given role, context, scenario_id, or expected goal.
        """
        if not self.owlready_active or not self.onto:
            return None

        role_l = (role or "").lower()
        ctx_l = (context or "").lower()
        sc_id = (scenario_id or "").lower()
        goal_l = (expected_goal or "").lower()

        # Direct scenario-level resolution
        if "father_02" in sc_id or "meal" in ctx_l or "eat" in goal_l:
            return self.onto.search_one(iri="*Scenario_Father_Meals")

        if "interruption" in goal_l or "interruption" in ctx_l or "t2_father_02" in sc_id:
            return self.onto.search_one(iri="*Scenario_Father_PoliteInterruption")

        if "stranger" in role_l:
            return self.onto.search_one(iri="*Scenario_Stranger_Safety")

        if "teacher" in role_l:
            return self.onto.search_one(iri="*Scenario_Teacher_Greeting")

        if "peer" in role_l or "friend" in role_l:
            return self.onto.search_one(iri="*Scenario_Peer_Play")

        if "father" in role_l or "parent" in role_l:
            return self.onto.search_one(iri="*Scenario_Father_Chore")

        return None

    def resolve_context_individual(self, role: str, context: str):
        """Resolves the SocialContext individual from role and context."""
        if not self.owlready_active or not self.onto:
            return None

        role_l = (role or "").lower()
        ctx_l = (context or "").lower()

        if "meal" in ctx_l:
            return self.onto.search_one(iri="*MealContextInd")
        if "stranger" in role_l:
            return self.onto.search_one(iri="*StrangerContextInd")
        if "teacher" in role_l or "classroom" in ctx_l:
            return self.onto.search_one(iri="*TeacherContextInd")
        if "peer" in role_l or "friend" in role_l or "playground" in ctx_l:
            return self.onto.search_one(iri="*PeerContextInd")
        if "parent" in role_l or "father" in role_l:
            return self.onto.search_one(iri="*ParentContextInd")

        return None

    def get_scenario_constraints(self, role: str, context: str, scenario_id: str = None, expected_goal: str = None):
        """
        Queries the ontology for:
          - Expected intent for this specific scenario
          - Acceptable alternative intents
          - Prohibited / violating intents
          - Required linguistic features
        """
        sc = self.resolve_scenario_individual(role, context, scenario_id, expected_goal)
        ctx = self.resolve_context_individual(role, context)

        expected_intents = []
        allowed_alternatives = []
        violating_intents = []
        required_features = []

        if sc:
            if hasattr(sc, "expectsIntent"):
                expected_intents = [i.name.replace("intent_", "") for i in sc.expectsIntent]
            if hasattr(sc, "allowsAlternativeIntent"):
                allowed_alternatives = [i.name.replace("intent_", "") for i in sc.allowsAlternativeIntent]
            if hasattr(sc, "violatesScenario"):
                violating_intents = [i.name.replace("intent_", "") for i in sc.violatesScenario]
            if hasattr(sc, "requiresFeature"):
                required_features = [f.name.replace("feat_", "") for f in sc.requiresFeature]

        # Augment with context-level constraints from OWL
        if ctx:
            # Check which intents violate this context
            if self.onto:
                for intent_ind in self.onto.CommunicativeIntent.instances():
                    if hasattr(intent_ind, "violates") and ctx in intent_ind.violates:
                        name = intent_ind.name.replace("intent_", "")
                        if name not in violating_intents:
                            violating_intents.append(name)

        return {
            "scenario_individual": sc.name if sc else None,
            "context_individual": ctx.name if ctx else None,
            "expected_intents": expected_intents,
            "allowed_alternatives": allowed_alternatives,
            "violating_intents": violating_intents,
            "required_features": required_features
        }

    def evaluate_intent(self, role: str, context: str, intent: str, scenario_id: str = None, expected_goal: str = None):
        """
        Deep semantic reasoning combining:
          1. Scenario-level task expectations (does it fulfill the specific communicative task?)
          2. Social/contextual constraints (is it socially appropriate or does it violate safety/decorum?)
        """
        normalized_intent = self.normalize_intent_name(intent)
        constraints = self.get_scenario_constraints(role, context, scenario_id, expected_goal)

        expected = [self.normalize_intent_name(i) for i in constraints["expected_intents"]]
        alternatives = [self.normalize_intent_name(i) for i in constraints["allowed_alternatives"]]
        violating = [self.normalize_intent_name(i) for i in constraints["violating_intents"]]

        # Check explicit goal passed from scenario metadata
        if expected_goal:
            norm_goal = self.normalize_intent_name(expected_goal)
            if norm_goal and norm_goal not in expected:
                expected.append(norm_goal)

        # 1. Check for ontology-defined violations
        is_violation = False
        violation_reason = None
        if normalized_intent in violating:
            is_violation = True
            if "Stranger" in role:
                violation_reason = "CRITICAL SAFETY VIOLATION: Complied with or accepted stranger invitation."
            elif "Teacher" in role:
                violation_reason = "DECORUM VIOLATION: Disrespectful or hostile response to authority."
            else:
                violation_reason = f"SOCIAL VIOLATION: '{intent}' violates communication rules in this context."

        # 2. Check if intent satisfies specific scenario expectation
        goal_satisfied = normalized_intent in expected

        # 3. Check if intent is an allowed alternative
        alternative_accepted = normalized_intent in alternatives

        # 4. Context appropriateness from ontology appropriateFor
        context_appropriate = False
        ctx = self.resolve_context_individual(role, context)
        if self.onto and ctx:
            intent_ind = self.onto.search_one(iri=f"*intent_{normalized_intent}")
            if intent_ind and hasattr(intent_ind, "appropriateFor") and ctx in intent_ind.appropriateFor:
                context_appropriate = True

        is_appropriate = (goal_satisfied or alternative_accepted or context_appropriate) and not is_violation

        # Build reasoning explanation detailing the OWL path traversed
        sc_name = constraints["scenario_individual"] or "GeneralScenario"
        ctx_name = constraints["context_individual"] or "GeneralContext"

        if is_violation:
            details = f"Ontology Violation: Intent '{normalized_intent}' violates {ctx_name}."
        elif goal_satisfied:
            details = f"Ontology Inference: {sc_name} -> expectsIntent '{normalized_intent}' satisfied."
        elif alternative_accepted:
            details = f"Ontology Inference: {sc_name} accepts '{normalized_intent}' as valid alternative response."
        elif context_appropriate:
            details = f"Ontology Inference: '{normalized_intent}' is socially appropriate for {ctx_name}."
        else:
            details = f"Ontology Inference: '{normalized_intent}' does not satisfy expected communication for {sc_name}."

        return {
            "is_appropriate": is_appropriate,
            "goal_satisfied": goal_satisfied,
            "alternative_accepted": alternative_accepted,
            "is_violation": is_violation,
            "violation_reason": violation_reason,
            "inference_details": details,
            "constraints": constraints
        }
