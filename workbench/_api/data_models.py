from typing import Literal

from pydantic import BaseModel, Field

class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str

class NDIFRequest(BaseModel):
    job_id: str

class Token(BaseModel):
    idx: int
    id: int
    text: str
    target_ids: list[int] = Field(alias="targetIds")