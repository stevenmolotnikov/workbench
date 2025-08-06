from fastapi import APIRouter, Depends
import torch as t
import asyncio

from pydantic import BaseModel

from ..jobs import jobs
from ..state import AppState, get_state
from .lens import TargetedLensCompletion
from ..data_models import Token

router = APIRouter()


def _execute_selected(
    execute_request: TargetedLensCompletion, state: AppState
) -> tuple[t.Tensor, t.Tensor]:
    idxs = [execute_request.token.idx]
    model = state.get_model(execute_request.model)

    with model.trace(execute_request.prompt, remote=state.remote):
        logits_BLD = model.lm_head.output

        logits_LD = logits_BLD[0, idxs, :].softmax(dim=-1)
        values_LD_indices_LD = t.sort(logits_LD, dim=-1, descending=True)

        values_LD = values_LD_indices_LD[0].save()
        indices_LD = values_LD_indices_LD[1].save()

    return values_LD, indices_LD


class Prediction(BaseModel):
    idx: int
    ids: list[int]
    probs: list[float]
    texts: list[str]


async def process_execute_selected_background(
    execute_request: TargetedLensCompletion,
    state: AppState,
) -> list[Prediction]:
    values_LD, indices_LD = await asyncio.to_thread(
        _execute_selected, execute_request, state
    )

    tok = state[execute_request.model].tokenizer
    idxs = [execute_request.token.idx]
    predictions = []

    for idx_values, idx_indices, token_index in zip(
        values_LD, indices_LD, idxs
    ):
        # Round values to 2 decimal places
        idx_values = t.round(idx_values * 100) / 100
        nonzero = idx_values > 0

        nonzero_values = idx_values[nonzero].tolist()
        nonzero_indices = idx_indices[nonzero].tolist()
        nonzero_texts = tok.batch_decode(nonzero_indices)

        predictions.append(
            Prediction(
                idx=token_index,
                ids=nonzero_indices,
                probs=nonzero_values,
                texts=nonzero_texts,
            ).model_dump()
        )

    return predictions


@router.post("/get-execute-selected")
async def get_execute_selected(
    execute_request: TargetedLensCompletion, state: AppState = Depends(get_state)
):
    return jobs.create_job(
        process_execute_selected_background, execute_request, state
    )


@router.get("/listen-execute-selected/{job_id}")
async def listen_execute_selected(job_id: str):
    return jobs.get_job(job_id)


@router.get("/")
async def get_models(state: AppState = Depends(get_state)):
    return state.get_config().get_model_list()


class EncodeRequest(BaseModel):
    text: str
    model: str
    add_special_tokens: bool = True


class DecodeRequest(BaseModel):
    token_ids: list[int]
    model: str
    batch: bool = False


@router.post("/encode")
async def encode(
    encode_request: EncodeRequest, state: AppState = Depends(get_state)
):
    tok = state[encode_request.model].tokenizer
    ids = tok.encode(
        encode_request.text,
        add_special_tokens=encode_request.add_special_tokens,
    )
    text_ids = tok.batch_decode(ids)
    return [
        Token(idx=i, id=id, text=text)
        for i, (id, text) in enumerate(zip(ids, text_ids))
    ]


@router.post("/decode")
async def decode(
    decode_request: DecodeRequest, state: AppState = Depends(get_state)
):
    tok = state[decode_request.model].tokenizer
    if decode_request.batch:
        return {"texts": tok.batch_decode(decode_request.token_ids)}
    else:
        return {"text": tok.decode(decode_request.token_ids)}
