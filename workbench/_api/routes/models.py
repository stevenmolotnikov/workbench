from fastapi import APIRouter, Depends
import torch as t
import asyncio

from pydantic import BaseModel

from ..jobs import jobs
from ..state import AppState, get_state
from ..data_models import Token

router = APIRouter()


@router.get("/")
async def get_models(state: AppState = Depends(get_state)):
    return state.get_config().get_model_list()


class LensCompletion(BaseModel):
    model: str
    prompt: str
    token: Token


def execute_selected(
    execute_request: LensCompletion, state: AppState, job_id: str | None = None
) -> tuple[t.Tensor, t.Tensor]:
    idxs = [execute_request.token.idx]
    model = state.get_model(execute_request.model)

    with model.trace(
        execute_request.prompt,
        remote=state.remote,
        blocking=False,
        job_id=job_id,
    ) as tracer:
        logits_BLV = model.lm_head.output

        logits_LV = logits_BLV[0, idxs, :].softmax(dim=-1)
        values_LV_indices_LV = t.sort(logits_LV, dim=-1, descending=True)

        values_LV = values_LV_indices_LV[0].save()
        indices_LV = values_LV_indices_LV[1].save()

    if job_id is None:
        return tracer.backend.job_id

    return values_LV, indices_LV


class Prediction(BaseModel):
    idx: int
    ids: list[int]
    probs: list[float]
    texts: list[str]


def collect_execute_selected_results(
    execute_request: LensCompletion,
    state: AppState,
    job_id: str,
) -> list[Prediction]:
    values_LV, indices_LV = execute_selected(execute_request, state, job_id)

    tok = state[execute_request.model].tokenizer
    idxs = [execute_request.token.idx]
    predictions = []

    for idx_values, idx_indices, token_index in zip(
        values_LV, indices_LV, idxs
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


@router.post("/start-execute-selected")
async def start_execute_selected(
    execute_request: LensCompletion, state: AppState = Depends(get_state)
):
    return {"job_id": execute_selected(execute_request, state)}


@router.post("/results-execute-selected/{job_id}")
async def collect_execute_selected(
    job_id: str,
    execute_request: LensCompletion,
    state: AppState = Depends(get_state),
):
    return collect_execute_selected_results(execute_request, state, job_id)


# class EncodeRequest(BaseModel):
#     text: str
#     model: str
#     add_special_tokens: bool = True


# class DecodeRequest(BaseModel):
#     token_ids: list[int]
#     model: str
#     batch: bool = False


# @router.post("/encode")
# async def encode(
#     encode_request: EncodeRequest, state: AppState = Depends(get_state)
# ):
#     tok = state[encode_request.model].tokenizer
#     ids = tok.encode(
#         encode_request.text,
#         add_special_tokens=encode_request.add_special_tokens,
#     )
#     text_ids = tok.batch_decode(ids)
#     return [
#         Token(idx=i, id=id, text=text, targetIds=[])
#         for i, (id, text) in enumerate(zip(ids, text_ids))
#     ]


# @router.post("/decode")
# async def decode(
#     decode_request: DecodeRequest, state: AppState = Depends(get_state)
# ):
#     tok = state[decode_request.model].tokenizer
#     if decode_request.batch:
#         return {"texts": tok.batch_decode(decode_request.token_ids)}
#     else:
#         return {"text": tok.decode(decode_request.token_ids)}


class Completion(BaseModel):
    prompt: str
    max_new_tokens: int
    model: str


class GenerationResponse(BaseModel):
    completion: list[Token]
    last_token_prediction: Prediction


async def generate_text(completion_request: Completion, state: AppState):
    def _generate_text(completion_request: Completion, state: AppState):
        model = state.get_model(completion_request.model)

        with model.generate(
            completion_request.prompt,
            max_new_tokens=completion_request.max_new_tokens,
            remote=state.remote,
        ):
            logits = []
            with model.lm_head.all():
                logits.append(model.lm_head.output)

            probs_V = logits[0][0, -1, :].softmax(dim=-1)
            values_V_indices_V = t.sort(probs_V, dim=-1, descending=True)
            values_V = values_V_indices_V[0].save()
            indices_V = values_V_indices_V[1].save()

            new_token_ids = model.generator.output.save()

        return values_V, indices_V, new_token_ids[0]

    values_V, indices_V, new_token_ids = await asyncio.to_thread(
        _generate_text, completion_request, state
    )

    tok = state[completion_request.model].tokenizer
    new_token_text = tok.batch_decode(new_token_ids)
    tokens = [
        Token(idx=i, id=id, text=text, targetIds=[])
        for i, (id, text) in enumerate(zip(new_token_ids, new_token_text))
    ]

    # Round values to 2 decimal places
    idx_values = t.round(values_V * 100) / 100
    nonzero = idx_values > 0

    nonzero_values = idx_values[nonzero].tolist()
    nonzero_indices = indices_V[nonzero].tolist()
    nonzero_texts = tok.batch_decode(nonzero_indices)

    last_token_prediction = Prediction(
        idx=new_token_ids[-1],
        ids=nonzero_indices,
        probs=nonzero_values,
        texts=nonzero_texts,
    ).model_dump()

    return GenerationResponse(
        completion=tokens, last_token_prediction=last_token_prediction
    ).model_dump()


@router.post("/generate")
async def generate(
    generate_request: Completion, state: AppState = Depends(get_state)
):
    return jobs.create_job(generate_text, generate_request, state)


@router.get("/listen-generate/{job_id}")
async def listen_generate(job_id: str):
    return jobs.get_job(job_id)
