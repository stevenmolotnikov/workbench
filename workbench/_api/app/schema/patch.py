from typing import List, Literal, Union

from pydantic import BaseModel, model_validator, AliasGenerator, ConfigDict
from pydantic.alias_generators import to_camel

from .base import Completion

class Point(BaseModel):
    model_config = ConfigDict(frozen=True)

    token_indices: List[int]
    counter_index: int

    def __hash__(self):
        return hash((tuple(self.token_indices), self.counter_index))


class Connection(BaseModel):
    model_config = ConfigDict(frozen=True)

    edit_type: Literal["patch"]
    start: Point
    end: Point

    def __hash__(self):
        return hash((self.edit_type, self.start, self.end))


class Freeze(BaseModel):
    edit_type: Literal["freeze"]
    loc: Point


class Ablate(BaseModel):
    edit_type: Literal["ablate"]
    loc: Point


Edit = Union[Connection, Freeze, Ablate]


class PatchRequest(BaseModel):
    model: str
    source: Completion
    destination: Completion
    edits: List[Edit]
    submodule: Literal["attn", "mlp", "blocks", "heads"]
    patch_tokens: bool

    # Which tokens are being predicted
    correct_id: int
    incorrect_id: int = None

    @model_validator(mode="after")
    def validate_request(self):
        if self.submodule == "heads" and self.patch_tokens:
            raise ValueError("Cannot patch heads and tokens simultaneously")

        return self