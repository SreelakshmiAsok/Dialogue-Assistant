from pydantic import BaseModel, Field
from typing import Literal

class RegisterRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=128)
    password: str = Field(..., min_length=6, max_length=128)
    parent_name: str = Field(..., min_length=1, max_length=128)
    child_name: str = Field(..., min_length=1, max_length=128)

class LoginRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=128)
    password: str = Field(..., min_length=6, max_length=128)

class AssumeChildRequest(BaseModel):
    child_id: str = Field(..., min_length=1)
