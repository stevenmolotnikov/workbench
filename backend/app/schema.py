from typing import Dict, List, Literal

from pydantic import BaseModel


class ModelConfig(BaseModel):
    """Configuration for an individual model."""

    name: str
    serve: bool
    chat: bool
    rename: Dict[str, str]


class ModelsConfig(BaseModel):
    """Root configuration containing all models."""

    models: Dict[str, ModelConfig]

    def get_model_list(self) -> List[str]:
        """Get list of models that are served and if they are chat or base."""
        return [
            {
                "name": model.name,
                "type": "chat" if model.chat else "base",
            }
            for model in self.models.values()
            if model.serve
        ]

# REQUEST SCHEMAS


class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class Conversation(BaseModel):
    type: Literal["chat", "base"]
    model: str
    name: str
    messages: List[Message]
    prompt: str
    isExpanded: bool
    selectedTokenIndices: List[int]


class LensRequest(BaseModel):
    conversations: List[Conversation]


class TokenizeRequest(BaseModel):
    text: str | List[Message]
    model: str


# RESPONSE SCHEMAS


class LayerResults(BaseModel):
    layer_idx: int
    pred_probs: List[float]
    preds: List[str]


class ModelResults(BaseModel):
    model_name: str
    layer_results: List[LayerResults]


class LensResponse(BaseModel):
    model_results: List[ModelResults]
