"""
Ontology Service for Navil.
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

    def __init__(self, owl_file_path=None, mode=None):
        base_dir = os.path.dirname(os.path.abspath(__file__))
        self.mode = (mode or os.environ.get("ONTOLOGY_MODE", "inferred")).strip().lower()

        if owl_file_path is None:
            if self.mode == "inferred":
                inferred_path = os.path.join(base_dir, "social_communication_inferred.owl")
                if os.path.exists(inferred_path):
                    owl_file_path = inferred_path
                else:
                    owl_file_path = os.path.join(base_dir, "social_communication.owl")
            else:
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
                from owlready2 import default_world
                self.world = default_world
                iri_path = "file://" + self.owl_file_path.replace("\\", "/")
                self.onto = get_ontology(iri_path).load()
                self.owlready_active = True
                print(f"[OntologyService] Loaded OWL ontology ({self.mode} mode) via Owlready2: {os.path.basename(self.owl_file_path)}.")
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
            "socialrefusal": "PoliteRefusal",
            "cooperativesuggestion": "CooperativeSuggestion",
            "strangercompliance": "StrangerCompliance",
            "hostilerefusal": "HostileRefusal",
            "disrespectfulinformal": "DisrespectfulInformal"
        }
        return mapping.get(clean, intent_str)

    def resolve_scenario_individual(self, role: str, context: str, scenario_id: str = None, expected_goal: str = None):
        """
        Finds the most specific CommunicationScenario individual in the ontology.
        Primary: Looks up the dataset-linked scenario individual by scenario_id first.
        Fallback: Falls back to domain archetype if/else when scenario_id is absent or unmapped.
        """
        if not self.owlready_active or not self.onto:
            return None

        # 1. Primary Lookup: Look up scenario individual by scenario_id first
        if scenario_id:
            clean_id = str(scenario_id).strip()
            alias_map = {
                "father_tier2": "t2_father_01",
                "father_tier2_02": "t2_father_02",
                "friend_tier2": "t2_friend_01",
                "friend_tier2_02": "t2_friend_02",
                "stranger_tier2": "t2_stranger_01",
                "stranger_tier2_02": "t2_stranger_02",
                "teacher_tier2": "t2_teacher_01",
                "teacher_tier2_02": "t2_teacher_02",
            }
            mapped_id = alias_map.get(clean_id.lower(), clean_id)
            if mapped_id.lower().startswith("peer_"):
                mapped_id = "friend_" + mapped_id[5:]
            candidates = [
                f"Scenario_{mapped_id}",
                f"Scenario_{mapped_id.lower()}",
                f"Scenario_{clean_id}",
                f"Scenario_{clean_id.lower()}",
                mapped_id,
                clean_id
            ]
            for cand in candidates:
                ind = getattr(self.onto, cand, None)
                if ind is not None:
                    return ind
                ind = self.onto.search_one(iri=f"*{cand}")
                if ind is not None:
                    return ind

        # 2. Fallback: Old archetype if/else when scenario_id is not found
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
            if "safety" in goal_l or "refus" in goal_l or "lure" in goal_l:
                return self.onto.search_one(iri="*Scenario_Stranger_Safety")
            general_stranger = self.onto.search_one(iri="*Scenario_stranger_01")
            return general_stranger or self.onto.search_one(iri="*Scenario_Stranger_Safety")

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
                        # Specific scenario expectation or allowance always overrides generic context constraint
                        if name not in expected_intents and name not in allowed_alternatives:
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
                if normalized_intent in ("StrangerCompliance", "SocialAcceptance"):
                    violation_reason = "CRITICAL SAFETY VIOLATION: Complied with or accepted stranger invitation."
                else:
                    violation_reason = f"SOCIAL VIOLATION: '{intent}' is inappropriate in this context."
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

    def is_safety_critical(self, scenario_id: str) -> bool:
        """
        Determines whether a scenario is a SafetyCriticalScenario.
        In legacy mode: uses the legacy list.
        In inferred mode: queries the inferred ontology via SPARQL (with fallback to Python property access).
        """
        if not scenario_id:
            return False

        clean_id = str(scenario_id).strip().lower()

        # Legacy mode comparison branch
        if self.mode == "legacy":
            legacy_safety = ("stranger_22", "t2_stranger_01", "t2_stranger_02", "t2_stranger_03", "t2_stranger_04", "t2_stranger_05")
            res = clean_id in legacy_safety
            print(f"[OntologyService] is_safety_critical({scenario_id}) evaluated via legacy rule: {res}")
            return res

        # Inferred mode: 1. Try SPARQL via default_world
        if self.owlready_active and hasattr(self, "world") and self.world is not None:
            try:
                sparql_query = f"""
                PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
                PREFIX onto: <http://www.semanticweb.org/dialogue-assistant/social-communication#>
                SELECT ?s WHERE {{
                    ?s rdf:type <http://www.semanticweb.org/dialogue-assistant/social-communication#SafetyCriticalScenario> .
                    FILTER(
                        STRENDS(LCASE(STR(?s)), "#scenario_{clean_id}") ||
                        STRENDS(LCASE(STR(?s)), "/scenario_{clean_id}") ||
                        STRENDS(LCASE(STR(?s)), "#{clean_id}") ||
                        STRENDS(LCASE(STR(?s)), "/{clean_id}")
                    )
                }}
                """
                results = list(self.world.sparql(sparql_query))
                is_crit = len(results) > 0
                return is_crit
            except Exception as e:
                print(f"[OntologyService] SPARQL query failed ({e}); falling back to Python property access.")

        # 2. Fallback: Python property access
        sc_ind = self.resolve_scenario_individual(None, None, scenario_id=scenario_id)
        if sc_ind and self.onto and hasattr(self.onto, "SafetyCriticalScenario"):
            is_crit = self.onto.SafetyCriticalScenario in sc_ind.is_a
            return is_crit

        return False

    def expected_intents(self, scenario_id: str) -> list:
        """
        Returns expected communicative intent names for this scenario.
        Queries the ontology via SPARQL, with fallback to Python property access.
        """
        if not scenario_id:
            return []

        clean_id = str(scenario_id).strip().lower()

        # 1. Try SPARQL
        if self.owlready_active and hasattr(self, "world") and self.world is not None:
            try:
                sparql_query = f"""
                PREFIX onto: <http://www.semanticweb.org/dialogue-assistant/social-communication#>
                SELECT ?intent WHERE {{
                    ?sc onto:expectsIntent ?intent .
                    FILTER(
                        STRENDS(LCASE(STR(?sc)), "#scenario_{clean_id}") ||
                        STRENDS(LCASE(STR(?sc)), "/scenario_{clean_id}") ||
                        STRENDS(LCASE(STR(?sc)), "#{clean_id}") ||
                        STRENDS(LCASE(STR(?sc)), "/{clean_id}")
                    )
                }}
                """
                results = list(self.world.sparql(sparql_query))
                intents = [r[0].name.replace("intent_", "") for r in results if hasattr(r[0], "name")]
                return intents
            except Exception as e:
                print(f"[OntologyService] SPARQL query failed ({e}); falling back to Python property access.")

        # 2. Fallback: Python property access
        sc_ind = self.resolve_scenario_individual(None, None, scenario_id=scenario_id)
        if sc_ind and hasattr(sc_ind, "expectsIntent"):
            intents = [i.name.replace("intent_", "") for i in sc_ind.expectsIntent]
            return intents

        return []

    def violating_intents(self, scenario_id: str) -> list:
        """
        Returns violating intent names for this scenario.
        Queries the ontology via SPARQL, with fallback to Python property access.
        """
        if not scenario_id:
            return []

        clean_id = str(scenario_id).strip().lower()

        # 1. Try SPARQL
        if self.owlready_active and hasattr(self, "world") and self.world is not None:
            try:
                sparql_query = f"""
                PREFIX onto: <http://www.semanticweb.org/dialogue-assistant/social-communication#>
                SELECT ?intent WHERE {{
                    ?sc onto:violatesScenario ?intent .
                    FILTER(
                        STRENDS(LCASE(STR(?sc)), "#scenario_{clean_id}") ||
                        STRENDS(LCASE(STR(?sc)), "/scenario_{clean_id}") ||
                        STRENDS(LCASE(STR(?sc)), "#{clean_id}") ||
                        STRENDS(LCASE(STR(?sc)), "/{clean_id}")
                    )
                }}
                """
                results = list(self.world.sparql(sparql_query))
                intents = [r[0].name.replace("intent_", "") for r in results if hasattr(r[0], "name")]
                return intents
            except Exception as e:
                print(f"[OntologyService] SPARQL query failed ({e}); falling back to Python property access.")

        # 2. Fallback: Python property access
        sc_ind = self.resolve_scenario_individual(None, None, scenario_id=scenario_id)
        if sc_ind and hasattr(sc_ind, "violatesScenario"):
            intents = [i.name.replace("intent_", "") for i in sc_ind.violatesScenario]
            return intents

        return []

# Singleton instance & module-level exports
_default_ontology_service = None

def get_ontology_service(mode=None):
    global _default_ontology_service
    env_mode = (mode or os.environ.get("ONTOLOGY_MODE", "inferred")).strip().lower()
    if _default_ontology_service is None or _default_ontology_service.mode != env_mode:
        _default_ontology_service = OntologyService(mode=env_mode)
    return _default_ontology_service

def is_safety_critical(scenario_id: str, mode=None) -> bool:
    return get_ontology_service(mode=mode).is_safety_critical(scenario_id)

def expected_intents(scenario_id: str, mode=None) -> list:
    return get_ontology_service(mode=mode).expected_intents(scenario_id)

def violating_intents(scenario_id: str, mode=None) -> list:
    return get_ontology_service(mode=mode).violating_intents(scenario_id)
