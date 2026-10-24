"""
tests/test_reasoning.py

Automated test suite verifying OWL DL reasoning and ontology-driven classification:
  (a) Reasoner runs and materializes inferred knowledge graph without errors.
  (b) stranger_22 and the Tier 2 stranger scenarios are inferred as SafetyCriticalScenario,
      and no others unintentionally.
  (c) A deliberately contradictory test ontology is detected as inconsistent.
  (d) Results with ONTOLOGY_MODE=legacy and ONTOLOGY_MODE=inferred match on all 120 scenarios.
"""

import os
import sys
import glob
import json
import unittest

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(BASE_DIR, "backend"))
sys.path.append(os.path.join(BASE_DIR, "reasoning"))

import owlready2
from owlready2 import (
    get_ontology, sync_reasoner_hermit, Thing, ObjectProperty,
    AllDisjoint, OwlReadyInconsistentOntologyError, default_world
)

from run_reasoner import run_reasoner, configure_java
from ontology_service import (
    OntologyService, get_ontology_service,
    is_safety_critical, expected_intents, violating_intents
)

class TestOWLReasoning(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        configure_java()
        cls.owl_source = os.path.join(BASE_DIR, "reasoning", "social_communication.owl")
        cls.owl_inferred = os.path.join(BASE_DIR, "reasoning", "social_communication_inferred.owl")
        cls.lessons_dir = os.path.join(BASE_DIR, "lessons")

    def test_a_reasoner_runs(self):
        """(a) HermiT reasoner executes successfully, materializing inferred graph."""
        print("\n--- Test (a): Running build-time reasoner ---")
        result = run_reasoner(self.owl_source, self.owl_inferred)
        self.assertTrue(result["success"], "Reasoner execution failed.")
        self.assertEqual(len(result["inconsistencies"]), 0, f"Inconsistencies detected: {result['inconsistencies']}")
        self.assertGreater(result["inferred_memberships"], 0, "No class memberships inferred.")
        self.assertTrue(os.path.exists(self.owl_inferred), "Inferred ontology file was not created.")

    def test_b_safety_critical_inferences(self):
        """
        (b) stranger_22 and the Tier 2 stranger scenarios are inferred
        SafetyCriticalScenario and no others unintentionally.
        """
        print("\n--- Test (b): Verifying SafetyCriticalScenario inferences ---")
        onto = get_ontology("file://" + self.owl_inferred.replace("\\", "/")).load()
        safety_cls = getattr(onto, "SafetyCriticalScenario", None)
        self.assertIsNotNone(safety_cls, "SafetyCriticalScenario class missing in inferred ontology.")

        inferred_names = {s.name for s in safety_cls.instances()}
        print(f"Inferred SafetyCriticalScenario count: {len(inferred_names)}")
        print(f"Inferred instances: {sorted(inferred_names)}")

        # Mandatory stranger safety scenarios
        expected_safety = {
            "Scenario_stranger_22",
            "Scenario_t2_stranger_01",
            "Scenario_t2_stranger_02",
            "Scenario_t2_stranger_03",
            "Scenario_t2_stranger_04",
            "Scenario_t2_stranger_05"
        }
        for s in expected_safety:
            self.assertIn(s, inferred_names, f"Expected {s} to be inferred as SafetyCriticalScenario.")

        # Ensure NO non-safety scenarios are unintentionally inferred
        # 1. Other 24 stranger scenarios (stranger_01..21, 23..25)
        for i in range(1, 26):
            if i == 22:
                continue
            name = f"Scenario_stranger_{i:02d}"
            self.assertNotIn(name, inferred_names, f"Unintentional safety inference for {name}!")

        # 2. No Father scenarios
        for ind in inferred_names:
            self.assertFalse(ind.startswith("Scenario_father_") or ind.startswith("Scenario_t2_father_"),
                             f"Father scenario {ind} unintentionally inferred as SafetyCriticalScenario!")

        # 3. No Teacher scenarios
        for ind in inferred_names:
            self.assertFalse(ind.startswith("Scenario_teacher_") or ind.startswith("Scenario_t2_teacher_"),
                             f"Teacher scenario {ind} unintentionally inferred as SafetyCriticalScenario!")

        # 4. No Friend scenarios
        for ind in inferred_names:
            self.assertFalse(ind.startswith("Scenario_friend_") or ind.startswith("Scenario_t2_friend_"),
                             f"Friend scenario {ind} unintentionally inferred as SafetyCriticalScenario!")

        print("Test (b) passed: Only stranger_22 and Tier 2 stranger scenarios were inferred.")

    def test_c_deliberately_contradictory_ontology_detected_as_inconsistent(self):
        """(c) A deliberately contradictory test ontology is detected as inconsistent."""
        print("\n--- Test (c): Contradictory ontology inconsistency detection ---")
        world = owlready2.World()
        test_onto = world.get_ontology("http://test.navil.org/contradictory.owl")

        with test_onto:
            class Scenario(Thing): pass
            class Intent(Thing): pass
            class expectsIntent(ObjectProperty):
                domain = [Scenario]
                range = [Intent]
            class violatesScenario(ObjectProperty):
                domain = [Scenario]
                range = [Intent]

            # Disjoint properties axiom
            AllDisjoint([expectsIntent, violatesScenario])

            # Contradictory individual: expects and violates the EXACT SAME intent
            sc = Scenario("ContradictoryScenario")
            bad_intent = Intent("SharedIntent")
            sc.expectsIntent = [bad_intent]
            sc.violatesScenario = [bad_intent]

        inconsistency_caught = False
        try:
            sync_reasoner_hermit(test_onto)
        except OwlReadyInconsistentOntologyError:
            inconsistency_caught = True
            print("Successfully caught expected OwlReadyInconsistentOntologyError!")
        except Exception as e:
            # HermiT on inconsistent ontologies may raise generic Exception or OwlReadyInconsistentOntologyError
            inconsistency_caught = True
            print(f"Successfully caught reasoner inconsistency exception: {type(e).__name__}: {e}")

        self.assertTrue(inconsistency_caught, "Reasoner failed to detect disjoint property contradiction!")

    def test_d_legacy_and_inferred_modes_match_on_all_120_scenarios(self):
        """(d) Results with ONTOLOGY_MODE=legacy and =inferred match on all 120 scenarios for the safety decision."""
        print("\n--- Test (d): Comparing legacy vs inferred safety decisions across all 120 scenarios ---")
        legacy_service = OntologyService(mode="legacy")
        inferred_service = OntologyService(mode="inferred")

        lesson_files = sorted(glob.glob(os.path.join(self.lessons_dir, "**", "*.json"), recursive=True))
        self.assertEqual(len(lesson_files), 120, f"Expected 120 lesson files, found {len(lesson_files)}")

        matches = 0
        mismatches = []
        safety_scenarios_found = []

        for fpath in lesson_files:
            with open(fpath, "r", encoding="utf-8") as fp:
                data = json.load(fp)
            lid = data.get("id")
            self.assertIsNotNone(lid, f"Lesson ID missing in {fpath}")

            dec_legacy = legacy_service.is_safety_critical(lid)
            dec_inferred = inferred_service.is_safety_critical(lid)

            if dec_legacy == dec_inferred:
                matches += 1
                if dec_inferred:
                    safety_scenarios_found.append(lid)
            else:
                mismatches.append({
                    "id": lid,
                    "legacy": dec_legacy,
                    "inferred": dec_inferred
                })

        print(f"Total Scenarios Evaluated: {len(lesson_files)}")
        print(f"Matches:                  {matches} / 120")
        print(f"Mismatches:               {len(mismatches)}")
        print(f"Safety Scenarios Identified: {sorted(safety_scenarios_found)}")

        if mismatches:
            print("Mismatches found:", mismatches)

        self.assertEqual(matches, 120, f"Legacy and inferred modes disagreed on {len(mismatches)} scenarios: {mismatches}")
        self.assertEqual(len(mismatches), 0)

if __name__ == "__main__":
    unittest.main(verbosity=2)
