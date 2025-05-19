from typing import List 

from pydantic import BaseModel

from .base import Completion
from .lens import Token

class ExecuteRequest(BaseModel):
    completions: List[Completion]
    model: str


class ExecuteSelectedRequest(BaseModel):
    completion: Completion
    tokens: List[Token]
    model: str