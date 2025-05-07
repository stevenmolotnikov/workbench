from typing import List, Literal

from pydantic import BaseModel, model_validator, AliasGenerator, ConfigDict
from pydantic.alias_generators import to_camel

from .base import Completion

class Point(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel
    )

    token_indices: List[int]
    counter_index: int

class Connection(BaseModel):
    start: Point
    end: Point

class PatchRequest(BaseModel):
    model: str
    source: Completion
    destination: Completion
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