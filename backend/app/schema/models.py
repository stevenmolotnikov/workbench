from typing import List 

from pydantic import BaseModel

from .base import Conversation

class ExecuteRequest(BaseModel):
    conversations: List[Conversation]
