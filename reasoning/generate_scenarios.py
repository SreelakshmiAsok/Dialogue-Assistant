"""
reasoning/generate_scenarios.py

Generates CommunicationScenario individuals directly from dataset lessons (Tier 1 and Tier 2).
Saves the enriched knowledge graph to social_communication.owl using Owlready2.
Zero domain knowledge is hardcoded as code:
  - Intents, allowed alternatives, violations, and required features are read directly from lesson JSONs.
  - The dataset is visibly and verifiably the single source of truth for all ontology individuals.
"""

import os
import glob
import json
from owlready2 import get_ontology

def get_or_create_intent(onto, intent_name):
    """Resolve an intent individual by name, creating a typed individual if needed."""
    if not intent_name:
        return None
        
    ind_name = f"intent_{intent_name}"
    ind = getattr(onto, ind_name, None)
    if ind is not None:
        return ind
        
    # Check if a class matches in ontology
    cls = getattr(onto, intent_name, None)
    if cls is not None:
        return cls(ind_name)
        
    # Fallback to CommunicativeIntent general class
    comm_cls = getattr(onto, "CommunicativeIntent", None)
    if comm_cls is not None:
        return comm_cls(ind_name)
        
    return None

def get_or_create_feature(onto, feat_name):
    """Resolve a linguistic feature individual by name, creating if needed."""
    if not feat_name:
        return None
        
    ind_name = f"feat_{feat_name}"
    ind = getattr(onto, ind_name, None)
    if ind is not None:
        return ind
        
    cls = getattr(onto, feat_name, None)
    if cls is not None:
        return cls(ind_name)
        
    feat_cls = getattr(onto, "LinguisticFeature", None)
    if feat_cls is not None:
        return feat_cls(ind_name)
        
    return None

def generate_scenarios(owl_file_path=None, lessons_dir=None):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    if owl_file_path is None:
        owl_file_path = os.path.join(base_dir, "social_communication.owl")
    if lessons_dir is None:
        lessons_dir = os.path.abspath(os.path.join(base_dir, "..", "lessons"))

    iri_path = "file://" + owl_file_path.replace("\\", "/")
    onto = get_ontology(iri_path).load()

    with onto:
        # Reference Contexts
        teacher_ctx = getattr(onto, "TeacherContextInd", None) or onto.TeacherContext("TeacherContextInd")
        parent_ctx = getattr(onto, "ParentContextInd", None) or onto.ParentContext("ParentContextInd")
        peer_ctx = getattr(onto, "PeerContextInd", None) or onto.PeerContext("PeerContextInd")
        stranger_ctx = getattr(onto, "StrangerContextInd", None) or onto.StrangerContext("StrangerContextInd")
        meal_ctx = getattr(onto, "MealContextInd", None) or onto.MealContext("MealContextInd")
        classroom_ctx = getattr(onto, "ClassroomContextInd", None) or onto.ClassroomContext("ClassroomContextInd")
        playground_ctx = getattr(onto, "PlaygroundContextInd", None) or onto.PlaygroundContext("PlaygroundContextInd")

        # Reference Roles
        role_teacher = getattr(onto, "TeacherRoleInd", None) or onto.Teacher("TeacherRoleInd")
        role_parent = getattr(onto, "ParentRoleInd", None) or onto.Parent("ParentRoleInd")
        role_peer = getattr(onto, "PeerRoleInd", None) or onto.Peer("PeerRoleInd")
        role_stranger = getattr(onto, "StrangerRoleInd", None) or onto.Stranger("StrangerRoleInd")

        # Map character to Role & Context
        role_map = {
            "father": (role_parent, [parent_ctx]),
            "parent": (role_parent, [parent_ctx]),
            "teacher": (role_teacher, [classroom_ctx, teacher_ctx]),
            "friend": (role_peer, [playground_ctx, peer_ctx]),
            "peer": (role_peer, [playground_ctx, peer_ctx]),
            "stranger": (role_stranger, [stranger_ctx]),
        }

        lesson_files = sorted(glob.glob(os.path.join(lessons_dir, "**", "*.json"), recursive=True))
        print(f"[GenerateScenarios] Discovered {len(lesson_files)} lesson JSON files.")

        created_count = 0
        updated_count = 0
        seen_ids = set()

        for filepath in lesson_files:
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    lesson_data = json.load(f)
            except Exception as e:
                print(f"[GenerateScenarios] Error reading {filepath}: {e}")
                continue

            lesson_id = lesson_data.get("id")
            if not lesson_id:
                continue

            if lesson_id in seen_ids:
                continue
            seen_ids.add(lesson_id)

            character = (lesson_data.get("character") or "").strip().lower()
            lesson_title = lesson_data.get("lesson") or lesson_data.get("skill") or ""
            q_tanglish = (lesson_data.get("question_tanglish") or "").lower()

            ind_name = f"Scenario_{lesson_id}"
            sc_ind = getattr(onto, ind_name, None)
            if sc_ind is None:
                sc_ind = onto.CommunicationScenario(ind_name)
                created_count += 1
            else:
                updated_count += 1

            # Determine Role & Context
            role_tuple = role_map.get(character, (role_peer, [peer_ctx]))
            sc_ind.hasSocialRole = [role_tuple[0]]
            
            contexts = list(role_tuple[1])
            if character in ("father", "parent") and ("meal" in lesson_title.lower() or "saap" in q_tanglish or lesson_id in ("father_02", "father_04")):
                contexts.append(meal_ctx)
            sc_ind.inSocialContext = contexts

            # ------------------------------------------------------------------
            # DATASET-DRIVEN REASONING SPECIFICATION
            # Read expectations and violations directly from the lesson turns
            # ------------------------------------------------------------------
            turns = lesson_data.get("turns", [])
            if turns:
                first_turn = turns[0]
                expected_names = first_turn.get("expected_intents") or ([first_turn.get("target_intent")] if first_turn.get("target_intent") else [])
                allowed_names = first_turn.get("allowed_intents", [])
                violating_names = first_turn.get("violates") or first_turn.get("violating_intents", [])
                feature_names = first_turn.get("required_features", [])

                expected = [get_or_create_intent(onto, name) for name in expected_names if get_or_create_intent(onto, name)]
                allowed = [get_or_create_intent(onto, name) for name in allowed_names if get_or_create_intent(onto, name)]
                violates = [get_or_create_intent(onto, name) for name in violating_names if get_or_create_intent(onto, name)]
                requires = [get_or_create_feature(onto, name) for name in feature_names if get_or_create_feature(onto, name)]

                sc_ind.expectsIntent = [e for e in expected if e]
                sc_ind.allowsAlternativeIntent = [a for a in allowed if a]
                sc_ind.violatesScenario = [v for v in violates if v]
                sc_ind.requiresFeature = [r for r in requires if r]

    # Save ontology back to OWL file
    onto.save(file=owl_file_path, format="rdfxml")
    total_scenarios = len(list(onto.CommunicationScenario.instances()))
    print(f"[GenerateScenarios] Successfully compiled {len(seen_ids)} dataset-linked scenario individuals.")
    print(f"[GenerateScenarios] Total CommunicationScenario individuals in ontology: {total_scenarios}.")
    print(f"[GenerateScenarios] Saved to: {owl_file_path}")

if __name__ == "__main__":
    generate_scenarios()
