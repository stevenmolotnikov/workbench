from typing import List 

from pydantic import BaseModel

from .base import Completion

# Request Schema

class Token(BaseModel):
    target_token: str
    token_idx: int

class LensCompletion(Completion):
    model: str
    name: str
    tokens: List[Token]

class LensRequest(BaseModel):
    completions: List[LensCompletion]

# Response Schema

class Point(BaseModel):
    model_name: str
    prob: float

class LayerResults(BaseModel):
    layer: int
    points: List[Point]

class LensMetadata(BaseModel):
    maxLayer: int

class LensResponse(BaseModel):
    data: List[LayerResults]
    metadata: LensMetadata