from typing import List 

from pydantic import BaseModel

from .base import Completion

class ExecuteRequest(BaseModel):
    completions: List[Completion]
