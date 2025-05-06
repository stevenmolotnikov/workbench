from typing import List 

from pydantic import BaseModel

from .base import Completion

class ExecuteRequest(BaseModel):
    completions: List[Completion]
    model: str


class ExecuteSelectedRequest(BaseModel):
    completion: Completion
    selected_token_indices: List[int]
    model: str