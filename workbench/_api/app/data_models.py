from typing import Literal

from pydantic import BaseModel

class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str

class Completion(BaseModel):
    id: str
    prompt: str

class NDIFRequest(BaseModel):
    job_id: str

class Token(BaseModel):
    idx: int
    target_id: int