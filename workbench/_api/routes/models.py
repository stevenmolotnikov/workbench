from fastapi import APIRouter, Depends
from pydantic import BaseModel
import torch as t
from nnsight.intervention.backends.remote import RemoteBackend

from ..state import AppState, get_state
from ..data_models import Token, NDIFResponse

router = APIRouter()


@router.get("/")
async def get_models(state: AppState = Depends(get_state)):
    return state.get_config().get_model_list()


class LensCompletion(BaseModel):
    model: str
    prompt: str
    token: Token


def prediction(
    req: LensCompletion, state: AppState, backend: RemoteBackend | None
) -> tuple[t.Tensor, t.Tensor]:
    model = state[req.model]

    with model.trace(
        req.prompt,
        remote=state.remote,
        backend=backend,
    ):
        logits_BLV = model.lm_head.output

        # Get logits for the correct index
        logits_LV = logits_BLV[0, [req.token.idx], :].softmax(dim=-1)

        # Sort logits by descending probability
        values_LV_indices_LV = t.sort(logits_LV, dim=-1, descending=True)

        values_LV = values_LV_indices_LV[0].save()
        indices_LV = values_LV_indices_LV[1].save()

    return values_LV, indices_LV


def get_remote_prediction(
    job_id: str, state: AppState
) -> tuple[t.Tensor, t.Tensor]:
    backend = state.make_backend(job_id=job_id)
    results = backend()
    return results["values_LV"], results["indices_LV"]


class Prediction(BaseModel):
    idx: int
    ids: list[int]
    probs: list[float]
    texts: list[str]


class PredictionResponse(NDIFResponse):
    data: Prediction | None = None


def process_prediction(
    values_LV: t.Tensor,
    indices_LV: t.Tensor,
    req: LensCompletion,
    state: AppState,
):
    tok = state[req.model].tokenizer
    idxs = [req.token.idx]

    # Round values to 2 decimal places
    idx_values = t.round(values_LV[0] * 100) / 100
    nonzero = idx_values > 0

    nonzero_values = idx_values[nonzero].tolist()
    nonzero_indices = indices_LV[0][nonzero].tolist()
    nonzero_texts = tok.batch_decode(nonzero_indices)

    prediction = Prediction(
        idx=idxs[0],
        ids=nonzero_indices,
        probs=nonzero_values,
        texts=nonzero_texts,
    )

    return {"data": prediction}


@router.post("/start-prediction", response_model=PredictionResponse)
async def start_prediction(
    prediction_request: LensCompletion, state: AppState = Depends(get_state)
):
    backend = state.make_backend(model=state[prediction_request.model])
    values_LV, indices_LV = prediction(prediction_request, state, backend)

    if state.remote:
        return {"job_id": backend.job_id}

    return process_prediction(values_LV, indices_LV, prediction_request, state)


@router.post("/results-prediction/{job_id}", response_model=PredictionResponse)
async def results_prediction(
    job_id: str,
    prediction_request: LensCompletion,
    state: AppState = Depends(get_state),
):
    values_LV, indices_LV = get_remote_prediction(job_id, state)
    return process_prediction(values_LV, indices_LV, prediction_request, state)


class Completion(BaseModel):
    prompt: str
    max_new_tokens: int
    model: str


class GenerationResponse(BaseModel):
    completion: list[Token]
    last_token_prediction: Prediction


def generate_text(
    completion_request: Completion, state: AppState, job_id: str | None = None
):
    model = state.get_model(completion_request.model)

    with model.generate(
        completion_request.prompt,
        max_new_tokens=completion_request.max_new_tokens,
        remote=state.remote,
        backend=state.make_backend(model, job_id),
    ) as generator:
        logits = []
        with model.lm_head.all():
            logits.append(model.lm_head.output)

        probs_V = logits[0][0, -1, :].softmax(dim=-1)
        values_V_indices_V = t.sort(probs_V, dim=-1, descending=True)
        values_V = values_V_indices_V[0].save()
        indices_V = values_V_indices_V[1].save()

        new_token_ids = model.generator.output.save()

    if job_id is None:
        return generator.backend.job_id

    return values_V, indices_V, new_token_ids[0]


def collect_generation_results(
    completion_request: Completion, state: AppState, job_id: str
):
    values_V, indices_V, new_token_ids = generate_text(
        completion_request, state, job_id
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


@router.post("/start-generate")
async def generate(
    generate_request: Completion, state: AppState = Depends(get_state)
):
    return {"job_id": generate_text(generate_request, state)}


@router.post("/results-generate/{job_id}")
async def collect_generate(
    job_id: str,
    generate_request: Completion,
    state: AppState = Depends(get_state),
):
    return generate_text(generate_request, state, job_id)
