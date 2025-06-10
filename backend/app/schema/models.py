from typing import List 

from pydantic import BaseModel

from .base import Completion, NDIFRequest
from .lens import Token

class ExecuteRequest(NDIFRequest):
    completions: List[Completion]
    model: str


class ExecuteSelectedRequest(NDIFRequest):
    completion: Completion
    tokens: List[Token]
    model: str