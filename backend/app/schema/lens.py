from typing import List

from pydantic import BaseModel

from .base import Completion

class Token(BaseModel):
    idx: int
    target_id: int

##### TARGETED LENS REQUEST SCHEMA #####

class TargetedLensCompletion(Completion):
    name: str
    tokens: List[Token]

class TargetedLensRequest(BaseModel):
    completions: List[TargetedLensCompletion]

##### TARGETED LENS RESPONSE SCHEMA #####

class Point(BaseModel):
    name: str
    prob: float

class LayerResults(BaseModel):
    layer: int
    points: List[Point]

class LensMetadata(BaseModel):
    maxLayer: int

class LensResponse(BaseModel):
    data: List[LayerResults]
    metadata: LensMetadata

##### GRID LENS REQUEST SCHEMA #####

class GridLensRequest(BaseModel):
    completion: Completion

##### GRID LENS RESPONSE SCHEMA #####

class GridLensResponse(BaseModel):
    id: str
    probs: List[List[float]]
    pred_strs: List[List[str]]