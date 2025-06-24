# %%


from typing import List, Literal, Union, Optional

from pydantic import BaseModel, model_validator, Field, ConfigDict


class Completion(BaseModel):
    id: str
    prompt: str

class Point(BaseModel):
    model_config = ConfigDict(frozen=True)

    token_indices: List[int] = Field(alias="tokenIndices")

    def __hash__(self):
        return hash((tuple(self.token_indices), self.counter_index))


class Connection(BaseModel):
    model_config = ConfigDict(frozen=True)

    start: Point
    end: Point

    def __hash__(self):
        return hash((self.start, self.end))


class Freeze(BaseModel):
    loc: Point


class Ablate(BaseModel):
    loc: Point


Edit = Union[Connection, Freeze, Ablate]


class PatchRequest(BaseModel):
    model_config = ConfigDict(
        # Allow extra fields (like x, y) to be ignored
        extra='ignore'
    )
    
    model: str
    source: Completion
    destination: Completion
    edits: List[Edit]
    submodule: Literal["attn", "mlp", "blocks", "heads"]
    patch_tokens: bool = Field(alias="patchTokens")

    # Which tokens are being predicted
    correct_id: int = Field(alias="correctId")
    incorrect_id: Optional[int] = Field(default=None, alias="incorrectId")

    @model_validator(mode="after")
    def validate_request(self):
        if self.submodule == "heads" and self.patch_tokens:
            raise ValueError("Cannot patch heads and tokens simultaneously")

        return self


# %%
test = {"edits":[{"start":{"x":64.72500991821289,"y":22.800000190734863,"tokenIndices":[1,1],"counterIndex":1},"end":{"x":64.72500991821289,"y":53.600006103515625,"tokenIndices":[1,1],"counterIndex":0}}],"model":"Qwen/Qwen3-0.6B","source":{"id":"source","prompt":"counter_index"},"destination":{"id":"destination","prompt":"counter_index"},"submodule":"blocks","correctId":0,"patchTokens":False,"incorrectId":0}
# %%

from nnsight import LanguageModel

model = LanguageModel("Qwen/Qwen3-0.6B")
# %%

with model.trace("counter_index", output_attentions=True):
    test = model.model.layers[0].output.save()

test[1]