# Current Project Structure
This document reflects the actual, current state of the TalkWise/Samvaad codebase as verified.

## 1. High-Level Folder Tree
```text
Dialogue-Assistant/
│
├── backend/                  # Python Flask Backend
│   ├── app.py                # Main Flask application and API entry point
│   ├── core/                 # Core infrastructure
│   │   └── db.py             # MongoDB connection with local JSON fallback
│   ├── data/                 # Static data / fallback content
│   │   ├── progress.json     # Local store for child progress
│   │   └── questions.py      # Hardcoded scenarios (Friend, Stranger, etc.)
│   ├── engines/              # Evaluation & Processing Engines
│   │   ├── feedback_engine.py      # Generates child-friendly feedback
│   │   ├── nlp_semantic_engine.py  # Pretrained SentenceTransformer (Morgan-Tanglish)
│   │   ├── ontology_reasoner.py    # Integrates with OWL ontology for inference
│   │   ├── rule_engine.py          # Pragmatic rules and respect/honorific checks
│   │   ├── semantic_engine.py      # Linguistic feature extraction & intent classification
│   │   └── tier2_engine.py         # Advanced multi-turn dialogue evaluation
│   └── nlp/
│       ├── bad_words.txt
│       ├── bad_words_filter.py     # Safety layer
│       └── sentiment.py
│
├── reasoning/                # Semantic Web / Ontology Layer
│   └── social_communication.owl # The actual OWL ontology file defining intents/responses
│
├── src/                      # Next.js Frontend (Modern UI)
│   ├── app/                  # Next.js App Router pages
│   ├── components/           # React components
│   └── lib/                  # Frontend utilities (api.ts, progress.ts)
│
├── lessons/                  # JSON Fallback Data for Tier 2 scenarios
│   └── tier2/
│
├── public/                   # Next.js static assets
├── static/                   # Flask static assets (audio, images for legacy UI)
│
├── index.html                # Legacy Vanilla JS Frontend entry point
├── app.js                    # Legacy Vanilla JS core logic
├── scenarios.js              # Legacy Vanilla JS data
├── pipeline.js               # Legacy Vanilla JS pipeline
├── characters.js             # Legacy Vanilla JS characters
├── attention.js              # Legacy Vanilla JS attention logic
└── style.css                 # Legacy Vanilla JS styling
```

## 2. Execution Flow
1. **Frontend (Next.js or Legacy UI):** Child provides an audio/text response.
2. **Backend Entry (`app.py`):** Receives the response via `/api/evaluate`.
3. **Safety Check (`bad_words_filter.py`):** Checks for inappropriate language.
4. **Pragmatics (`rule_engine.py`):** Checks for expected respect markers (e.g. "appa", "sir") based on the character role.
5. **Semantic/Intent Match (`semantic_engine.py`):** Extracts linguistic features (polarity, come-markers) and classifies the pragmatic intent (e.g. `social_acceptance`).
6. **NLP Semantic Signal (`nlp_semantic_engine.py`):** Uses `vishnu-n/Morgan-Tanglish-v7` to provide a pure vector similarity score (`nlp_similarity`) as supplementary evidence.
7. **Ontology Reasoning (`ontology_reasoner.py`):** Feeds the intent/features into `social_communication.owl` to infer higher-level concepts (e.g., `CooperativeSuggestion`).
8. **Scoring (`app.py`):** Calculates final stars based on the semantic match, pragmatics, and safety.
9. **Feedback (`feedback_engine.py`):** Generates encouraging, context-aware feedback (utilizing ontology inferences).
10. **Database (`db.py`):** Saves progress to MongoDB (or local JSON fallback).
11. **Frontend:** Displays stars, feedback, and handles navigation to the next scenario.

## 3. Technology Verification
- **Flask:** ✅ DEFINITELY USED. `backend/app.py` imports and uses Flask for all routing. (FastAPI is in `requirements.txt` but not used for the core server).
- **MongoDB:** ✅ DEFINITELY USED. `backend/core/db.py` uses PyMongo if available.
- **JSON Fallback:** ✅ DEFINITELY USED. `backend/core/db.py` gracefully falls back to `lessons/` JSON files and `progress.json` if MongoDB is unavailable.
- **OWL Ontology:** ✅ DEFINITELY USED. Loaded by `ontology_reasoner.py` and actively queried during evaluation.
- **NLP Semantic Model:** ✅ DEFINITELY USED. `nlp_semantic_engine.py` is actively integrated into `app.py` to provide a similarity score.
- **Semantic Engine:** ✅ DEFINITELY USED. `semantic_engine.py` drives the core linguistic feature extraction and intent matching.

## 4. Unused / Legacy Files
- The project is currently running a **Dual-UI** system (Next.js in `src/` and Vanilla JS in the root directory). Therefore, files like `index.html`, `app.js`, `scenarios.js` are considered **ACTIVE LEGACY** and are intentionally kept.
- `requirements.txt` lists `fastapi` and `uvicorn`, but the application is actively running on `Flask`. These dependencies might be unused or reserved for future migrations.

## 5. Uncertain Usage
- Image assets in the root folder (`classroom_bg.png`, `dad_user.png`, etc.) might be duplicates of assets in `public/` or `static/`, but are kept as they may be directly referenced by the Legacy Vanilla JS UI.
