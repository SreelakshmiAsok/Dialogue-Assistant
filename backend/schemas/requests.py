from pydantic import BaseModel, Field
from typing import Optional

class EvaluateRequest(BaseModel):
    question_id: str = Field(..., min_length=1, max_length=100)
    response: str = Field(..., max_length=1000)

class Tier2EvaluateTurnRequest(BaseModel):
    lesson_id: str = Field(..., min_length=1)
    turn_id: str = Field(..., min_length=1)
    response: str = Field(..., min_length=1, max_length=1000)
    retry_count: int = Field(default=0, ge=0)
    
class LinkChildRequest(BaseModel):
    child_email: str = Field(..., min_length=3, max_length=128)
