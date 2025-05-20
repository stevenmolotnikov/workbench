from typing import List 

from pydantic import BaseModel

from .base import Completion

# Request Schema

class Token(BaseModel):
    idx: int
    target_token: str = None
    target_token_id: int = None

class LensCompletion(Completion):
    model: str
    tokens: List[Token]

class LensRequest(BaseModel):
    completions: List[LensCompletion]

# Response Schema

class Point(BaseModel):
    id: str
    prob: float

class LayerResults(BaseModel):
    layer: int
    points: List[Point]

class LensMetadata(BaseModel):
    maxLayer: int

class LensResponse(BaseModel):
    data: List[LayerResults]
    metadata: LensMetadata