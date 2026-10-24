"""
reasoning/run_reasoner.py

Runs the OWL DL reasoner (HermiT) at build time to compute inferred class
memberships and materialize the inferred knowledge graph.

Saves the materialized graph to:
  reasoning/social_communication_inferred.owl
"""

import os
import sys
import time
import shutil
import owlready2
from owlready2 import get_ontology, sync_reasoner_hermit, OwlReadyInconsistentOntologyError

def configure_java():
    """Ensure Owlready2 can locate the Java executable on Windows or POSIX."""
    if owlready2.JAVA_EXE and os.path.exists(owlready2.JAVA_EXE):
        return owlready2.JAVA_EXE

    # Common Windows Java locations
    candidates = [
        shutil.which("java"),
        shutil.which("java.exe"),
        r"C:\Program Files\Common Files\Oracle\Java\javapath\java.exe",
        os.path.join(os.environ.get("JAVA_HOME", ""), "bin", "java.exe") if os.environ.get("JAVA_HOME") else None
    ]
    for c in candidates:
        if c and os.path.exists(c):
            owlready2.JAVA_EXE = c
            return c
    return owlready2.JAVA_EXE

def run_reasoner(owl_file=None, output_file=None):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    if owl_file is None:
        owl_file = os.path.join(base_dir, "social_communication.owl")
    if output_file is None:
        output_file = os.path.join(base_dir, "social_communication_inferred.owl")

    java_path = configure_java()
    print("=" * 80)
    print("NAVIL OWL BUILD-TIME REASONER (HermiT)")
    print("=" * 80)
    print(f"[Reasoner] Java Executable: {java_path}")
    print(f"[Reasoner] Source Ontology: {owl_file}")

    if not os.path.exists(owl_file):
        raise FileNotFoundError(f"Ontology file not found: {owl_file}")

    iri_path = "file://" + owl_file.replace("\\", "/")
    onto = get_ontology(iri_path).load()

    # Pre-reasoning snapshot of class memberships
    pre_classes = {}
    for ind in onto.individuals():
        pre_classes[ind.name] = set(ind.is_a)

    inconsistencies = []
    t0 = time.time()
    try:
        with onto:
            sync_reasoner_hermit(onto, infer_property_values=True)
        elapsed = time.time() - t0
        print(f"[Reasoner] HermiT classification completed successfully in {elapsed:.2f}s.")
    except OwlReadyInconsistentOntologyError as e:
        inconsistencies.append(str(e) or "Ontology is inconsistent")
        print(f"[Reasoner] INCONSISTENCY DETECTED: {e}")
        return {
            "success": False,
            "inconsistencies": inconsistencies,
            "inferred_memberships": 0,
            "safety_critical_scenarios": []
        }
    except Exception as e:
        print(f"[Reasoner] Reasoner failed with unexpected error: {e}")
        raise

    # Post-reasoning comparison
    inferred_count = 0
    inferred_map = {}
    for ind in onto.individuals():
        post = set(ind.is_a)
        diff = post - pre_classes.get(ind.name, set())
        if diff:
            inferred_count += len(diff)
            inferred_map[ind.name] = [c.name for c in diff]

    # Collect SafetyCriticalScenario instances
    safety_cls = getattr(onto, "SafetyCriticalScenario", None)
    safety_scenarios = []
    if safety_cls:
        safety_scenarios = sorted([s.name for s in safety_cls.instances()])

    # Save inferred ontology
    onto.save(file=output_file, format="rdfxml")
    print(f"[Reasoner] Materialized inferred graph saved to: {output_file}")

    # Detailed report
    print("\n" + "=" * 80)
    print("REASONING INFERENCE REPORT")
    print("=" * 80)
    print(f"Total Individuals:                {len(list(onto.individuals()))}")
    print(f"Inferred Class Memberships:        {inferred_count}")
    print(f"Inconsistencies Found:             {len(inconsistencies)} ({'None' if not inconsistencies else inconsistencies})")
    print(f"SafetyCriticalScenario Count:      {len(safety_scenarios)}")
    print("\nInferred SafetyCriticalScenario Individuals:")
    for s in safety_scenarios:
        print(f"  * {s}")

    other_classes = [
        "TaskCompletionScenario", "PoliteInterruptionScenario",
        "AuthorityDecorumScenario", "PeerCooperationScenario"
    ]
    print("\nOther Inferred Scenario Categories:")
    for cname in other_classes:
        cls_obj = getattr(onto, cname, None)
        if cls_obj:
            insts = sorted([i.name for i in cls_obj.instances()])
            print(f"  * {cname} ({len(insts)}): {', '.join(insts[:5])}{'...' if len(insts) > 5 else ''}")

    print("=" * 80)

    return {
        "success": True,
        "inconsistencies": inconsistencies,
        "inferred_memberships": inferred_count,
        "safety_critical_scenarios": safety_scenarios,
        "output_file": output_file
    }

if __name__ == "__main__":
    run_reasoner()
