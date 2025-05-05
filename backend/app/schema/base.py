from typing import List, Literal

from pydantic import BaseModel

class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class Conversation(BaseModel):
    id: str
    type: Literal["chat", "base"]
    model: str
    name: str
    messages: List[Message]
    prompt: str
    isExpanded: bool
    selectedTokenIndices: List[int]




