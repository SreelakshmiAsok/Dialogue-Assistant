import os
import sys
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

# Ensure reasoning package directory is in sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from reasoner import SocialOntologyReasoner

app = FastAPI(
    title="Dialogue Assistant Semantic Reasoning API",
    description="FastAPI service serving OWL Ontology reasoning for ASD Social Communication Training",
    version="1.0.0"
)

# Enable CORS for local web applications
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize reasoners for both Pure English and Tanglish ontologies
english_reasoner = SocialOntologyReasoner(use_tanglish=False)
tanglish_reasoner = SocialOntologyReasoner(use_tanglish=True)

class ReasoningRequest(BaseModel):
    scenarioId: str
    userText: str
    role: Optional[str] = "Teacher"
    context: Optional[str] = "Classroom"
    use_tanglish: Optional[bool] = True

class ReasoningResponse(BaseModel):
    status: str
    ontology: dict
    suggested_feedback: str

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Dialogue Assistant Semantic Reasoning Backend",
        "available_ontologies": {
            "english": "social_communication.owl",
            "english_mixed_tamil": "social_communication_tanglish.owl"
        },
        "default": "social_communication_tanglish.owl"
    }

@app.get("/ontologies")
def list_ontologies():
    return {
        "ontologies": [
            {
                "id": "english",
                "filename": "social_communication.owl",
                "language": "Pure English",
                "description": "Formal OWL ontology for ASD social communication training using standard English pragmatics and rules."
            },
            {
                "id": "english_mixed_tamil",
                "filename": "social_communication_tanglish.owl",
                "language": "English + Tamil (Tanglish)",
                "description": "Code-mixed Tanglish OWL ontology supporting Romanized Tamil, Tamil script, and bilingual pragmatic markers (e.g., vaanga, vendam, mannikkanum)."
            }
        ]
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/reason")
def reason_endpoint(req: ReasoningRequest):
    if not req.userText or not req.userText.strip():
        raise HTTPException(status_code=400, detail="userText cannot be empty")

    role = req.role
    if req.scenarioId == "teacher":
        role = "Teacher"
    elif req.scenarioId == "parent":
        role = "Parent"
    elif req.scenarioId == "friend":
        role = "Peer"
    elif req.scenarioId == "stranger":
        role = "Stranger"

    active_reasoner = tanglish_reasoner if req.use_tanglish else english_reasoner

    evaluation = active_reasoner.evaluate_utterance(
        role=role,
        context=req.context or "General",
        utterance_text=req.userText
    )

    # Determine feedback summary based on ontology status
    if evaluation["has_violations"]:
        feedback = "Ontology Warning: Your response violated a social safety or decorum rule."
    elif evaluation["has_failures"]:
        feedback = "Ontology Tip: Your response passed safety checks, but could be made more polite or explicit."
    else:
        feedback = "Ontology Pass: Perfect response! Aligns with social rules in the ontology."

    return {
        "status": "success",
        "scenarioId": req.scenarioId,
        "ontology": evaluation,
        "suggested_feedback": feedback
    }

if __name__ == "__main__":
    import uvicorn
    print("Starting Semantic Reasoning FastAPI server on http://localhost:8000 ...")
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
