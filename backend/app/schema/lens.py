from typing import List 

from pydantic import BaseModel

from .base import Conversation

class LayerResults(BaseModel):
    layer_idx: int
    pred_probs: List[float]
    preds: List[str]


class ModelResults(BaseModel):
    model_name: str
    layer_results: List[LayerResults]

class LensResponse(BaseModel):
    model_results: List[ModelResults]

class LensRequest(BaseModel):
    conversations: List[Conversation]
