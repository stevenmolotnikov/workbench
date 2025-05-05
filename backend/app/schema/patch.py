from typing import List, Literal

from pydantic import BaseModel, model_validator

from .base import Conversation

class Point(BaseModel):
    token_index: List[int]
    counter_index: int

class Connection(BaseModel):
    source: Point
    destination: Point

class PatchRequest(BaseModel):
    model: str
    source: Conversation
    destination: Conversation
    connections: List[Connection]
    submodule: Literal["attn", "mlp", "blocks", "heads"]
    patch_tokens: bool

    # Which tokens are being predicted
    correct_id: int
    incorrect_id: int

    @model_validator(mode="after")
    def validate_request(self):
        if self.submodule == "heads" and self.patch_tokens:
            raise ValueError("Cannot patch heads and tokens simultaneously")
        return self