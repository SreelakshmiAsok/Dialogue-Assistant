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

# Initialize reasoner
reasoner = SocialOntologyReasoner()

class ReasoningRequest(BaseModel):
    scenarioId: str
    userText: str
    role: Optional[str] = "Teacher"
    context: Optional[str] = "Classroom"
    intent: Optional[str] = None
    has_politeness: Optional[bool] = None
    semantic_similarity: Optional[float] = None

class ReasoningResponse(BaseModel):
    status: str
    ontology: dict
    suggested_feedback: str

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Dialogue Assistant Semantic Reasoning Backend",
        "ontology_file": "social_communication.owl"
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

    evaluation = reasoner.evaluate_utterance(
        role=role,
        context=req.context or "General",
        utterance_text=req.userText,
        intent=req.intent,
        has_politeness=req.has_politeness,
        semantic_similarity=req.semantic_similarity,
        scenario_id=req.scenarioId
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
