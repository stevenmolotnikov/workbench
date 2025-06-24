from typing import List 

from pydantic import BaseModel

from .base import Completion, NDIFRequest
from .lens import Token

class ExecuteSelectedRequest(NDIFRequest):
    completion: Completion
    tokens: List[Token]
    model: str

class ExecutePairRequest(NDIFRequest):
    source: Completion
    destination: Completion
    model: str

class CompletionResponse(BaseModel):
    ids: List[int]
    values: List[float]

class ExecutePairResponse(NDIFRequest):
    source: CompletionResponse
    destination: CompletionResponse