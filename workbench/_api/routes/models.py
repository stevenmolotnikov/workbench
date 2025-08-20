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

    return prediction


@router.post("/start-prediction", response_model=PredictionResponse)
async def start_prediction(
    prediction_request: LensCompletion, state: AppState = Depends(get_state)
):
    backend = state.make_backend(model=state[prediction_request.model])
    values_LV, indices_LV = prediction(prediction_request, state, backend)

    if state.remote:
        return {"job_id": backend.job_id}

    data = process_prediction(values_LV, indices_LV, prediction_request, state)
    return {"data": data}


@router.post("/results-prediction/{job_id}", response_model=PredictionResponse)
async def results_prediction(
    job_id: str,
    prediction_request: LensCompletion,
    state: AppState = Depends(get_state),
):
    values_LV, indices_LV = get_remote_prediction(job_id, state)
    data = process_prediction(values_LV, indices_LV, prediction_request, state)
    return {"data": data}


class Completion(BaseModel):
    prompt: str
    max_new_tokens: int
    model: str


class Generation(BaseModel):
    completion: list[Token]
    last_token_prediction: Prediction


class GenerationResponse(NDIFResponse):
    data: Generation | None = None


def generate(req: Completion, state: AppState, backend: RemoteBackend | None):
    model = state[req.model]

    with model.generate(
        req.prompt,
        max_new_tokens=req.max_new_tokens,
        remote=state.remote,
        backend=backend,
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


def get_remote_generate(
    job_id: str, state: AppState
) -> tuple[t.Tensor, t.Tensor, t.Tensor]:
    backend = state.make_backend(job_id=job_id)
    results = backend()
    return results["values_V"], results["indices_V"], results["new_token_ids"]


def process_generation_results(
    values_V: t.Tensor,
    indices_V: t.Tensor,
    new_token_ids: t.Tensor,
    req: Completion,
    state: AppState,
):
    tok = state[req.model].tokenizer
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

    return {
        "completion": tokens,
        "last_token_prediction": last_token_prediction,
    }


@router.post("/start-generate", response_model=GenerationResponse)
async def start_generate(
    req: Completion, state: AppState = Depends(get_state)
):
    backend = state.make_backend(model=state[req.model])
    values_V, indices_V, new_token_ids = generate(
        req, state, backend
    )
    if state.remote:
        return {"job_id": backend.job_id}

    data = process_generation_results(
        values_V, indices_V, new_token_ids, req, state
    )
    return {"data": data}


@router.post("/results-generate/{job_id}", response_model=GenerationResponse)
async def results_generate(
    job_id: str,
    req: Completion,
    state: AppState = Depends(get_state),
):
    values_V, indices_V, new_token_ids = get_remote_generate(job_id, state)
    data = process_generation_results(
        values_V, indices_V, new_token_ids, req, state
    )
    return {"data": data}
