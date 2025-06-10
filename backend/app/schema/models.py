from typing import List 

from .base import Completion, NDIFRequest
from .lens import Token

class ExecuteSelectedRequest(NDIFRequest):
    completion: Completion
    tokens: List[Token]
    model: str