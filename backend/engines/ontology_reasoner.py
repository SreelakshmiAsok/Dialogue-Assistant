# backend/engines/ontology_reasoner.py
"""Ontology Reasoner Integration

This module provides a thin wrapper around the OWL ontology defined in
`reasoning/social_communication.owl`. It is used by the Flask API (see
`backend/app.py`) to turn extracted evidence into an ontology individual,
run the Hermit reasoner, and return any inferred class names.

Only the minimal functionality required for the TalkWise pipeline is
implemented – no UI exposure, no persistence, and no heavy‑weight NLP.
"""

import os
import uuid
from owlready2 import get_ontology, sync_reasoner_hermit, Thing

# Resolve ontology file path (relative to project root)
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "reasoning"))
OWL_PATH = os.path.join(BASE_DIR, "social_communication.owl")

# Load the ontology once (cached by owlready2)
ONTOLOGY = get_ontology("file://" + OWL_PATH).load()

# Helper maps for string identifiers to ontology classes
_ROLE_TO_CONTEXT = {
    "Father": "ParentContext",
    "Parent": "ParentContext",
    "Teacher": "TeacherContext",
    "Friend": "PeerContext",
    "Stranger": "StrangerContext",
}

_INTENT_CLASS_MAP = {
    "request": "PoliteRequest",
    "polite": "PoliteRequest",
    "refusal": "SafetyRefusal",
    "safety": "SafetyRefusal",
    "apology": "HonestApology",
    "suggestion": "CooperativeSuggestion",
}

_FEATURE_CLASS_MAP = {
    "HonorificMarker": "HonorificMarker",
    "HonorifcMarker": "HonorifcMarker",
    "RespectfulAddress": "RespectfulAddress",
    "TimeExtension": "TimeExtension",
    "RefusalMarker": "RefusalMarker",
    "TrustedAdultReference": "TrustedAdultReference",
    "PurposeStatement": "PurposeStatement",
    "SlangMarker": "SlangMarker",
    "ApologyMarker": "ApologyMarker",
}


def _ensure_individual(cls_name: str):
    """Return the ontology class, creating it if missing (should not happen)."""
    cls = getattr(ONTOLOGY, cls_name, None)
    if cls is None:
        # Dynamically create a placeholder subclass of Thing
        cls = type(cls_name, (Thing,), {})
        setattr(ONTOLOGY, cls_name, cls)
    return cls


def run_reasoner(evidence: dict) -> list:
    """Create a temporary ``Response`` individual, assert evidence, run Hermit.

    Parameters
    ----------
    evidence: dict with keys ``role``, ``features`` (list of strings), ``intent``
        and optional ``text``. The values are simple strings that map to the
        ontology's existing classes.

    Returns
    -------
    list[str]
        Inferred class names for the created response (e.g. ``ParentPoliteUtterance``).
    """
    # Ensure core ontology classes exist
    Response = _ensure_individual("Response")
    Utterance = _ensure_individual("Utterance")
    hasIntent = _ensure_individual("hasIntent")
    usesFeature = _ensure_individual("usesFeature")
    appropriateFor = _ensure_individual("appropriateFor")

    # Create a unique response individual
    resp_id = f"resp_{uuid.uuid4().hex[:8]}"
    resp = Response(resp_id)

    # Attach raw text for debugging (optional)
    if "text" in evidence:
        resp.hasText = [evidence["text"]]

    # Intent
    intent_key = evidence.get("intent")
    if intent_key:
        intent_cls_name = _INTENT_CLASS_MAP.get(intent_key.lower())
        if intent_cls_name:
            intent_cls = _ensure_individual(intent_cls_name)
            resp.hasIntent.append(intent_cls())

    # Linguistic features
    for feat in evidence.get("features", []):
        cls_name = _FEATURE_CLASS_MAP.get(feat)
        if cls_name:
            feat_cls = _ensure_individual(cls_name)
            resp.usesFeature.append(feat_cls())

    # Context – map role to a SocialContext subclass. The ontology's
    # ``speakingTo`` property expects a Person, but we keep the mapping via
    # ``appropriateFor`` which already expects a ``SocialContext``.
    role = evidence.get("role")
    if role:
        ctx_name = _ROLE_TO_CONTEXT.get(role)
        if ctx_name:
            ctx_cls = _ensure_individual(ctx_name)
            # Attach context to the intent if present
            if resp.hasIntent:
                appropriateFor[resp.hasIntent[0]].append(ctx_cls())

    # Run the reasoner. Errors are caught; an empty list is returned on failure.
    try:
        with ONTOLOGY:
            sync_reasoner_hermit(infer_property_values=True)
        inferred = [c.name for c in resp.INDIRECT_is_a]
        return inferred
    except Exception as e:
        print(f"[OntologyReasoner] Reasoner error: {e}")
        return []
