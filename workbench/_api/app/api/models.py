from fastapi import APIRouter, Request
import torch as t
import asyncio

from pydantic import BaseModel

from ..utils import send_update
from ..data_models import Completion, NDIFRequest, Token

router = APIRouter()

class ExecuteSelectedRequest(NDIFRequest):
    completion: Completion
    tokens: list[Token]
    model: str

class ExecutePairRequest(NDIFRequest):
    source: Completion
    destination: Completion
    model: str

class CompletionResponse(BaseModel):
    ids: list[int]
    values: list[float]

class ExecutePairResponse(NDIFRequest):
    source: CompletionResponse
    destination: CompletionResponse


async def _execute_selected(state, execute_request):

    idxs = [token.idx for token in execute_request.tokens]
    model = state.get_model(execute_request.model)

    prompt = execute_request.completion.prompt

    try:
        with model.wrapped_trace(prompt, job_id=execute_request.job_id):
            logits = model.lm_head.output

            logits = logits[0,idxs,:].softmax(dim=-1)
            values_indices = t.sort(logits, dim=-1, descending=True)

            values = values_indices[0].save()
            indices = values_indices[1].save()

    except ConnectionError:
        await send_update(execute_request.callback_url, {"status": "error", "message": "NDIF connection error"})
        return {
            "results": {}
        }
    
    return values, indices
    

@router.post("/execute_selected")
async def execute_selected(execute_request: ExecuteSelectedRequest, request: Request):
    state = request.app.state.m
    idxs = [token.idx for token in execute_request.tokens]
    values, indices = await asyncio.to_thread(_execute_selected, state, execute_request)

    results = {}

    for idx, token_index in enumerate(idxs):
        idx_values = values[idx]
        idx_indices = indices[idx]

        # Round values to 2 decimal places
        idx_values = t.round(idx_values * 100) / 100
        nonzero = idx_values > 0

        nonzero_values = idx_values[nonzero].tolist()
        nonzero_indices = idx_indices[nonzero].tolist()

        results[token_index] = {
            "ids": nonzero_indices,
            "values": nonzero_values
        }

    return results


async def _execute_pair(state, execute_request):
    model = state.get_model(execute_request.model)

    prompts = [
        execute_request.source.prompt,
        execute_request.destination.prompt
    ]

    try:
        with model.wrapped_trace(prompts, job_id=execute_request.job_id):
            logits = model.lm_head.output

            logits = logits[:,-1,:].softmax(dim=-1)
            values_indices = t.sort(logits, dim=-1, descending=True)

            raw_values = values_indices[0].save()
            raw_indices = values_indices[1].save()

    except ConnectionError:
        await send_update(execute_request.callback_url, {"status": "error", "message": "NDIF connection error"})
        return {
            "results": {}
        }

    return raw_values, raw_indices


@router.post("/execute_pair")
async def execute_pair(execute_request: ExecutePairRequest, request: Request):
    state = request.app.state.m
    
    raw_values, raw_indices = await asyncio.to_thread(_execute_pair, state, execute_request)

    def round_results(values, indices):
        # Round values to 2 decimal places
        idx_values = t.round(values * 100) / 100
        nonzero = idx_values > 0
        
        nonzero_values = values[nonzero].tolist()
        nonzero_indices = indices[nonzero].tolist()

        return {
            "ids": nonzero_indices,
            "values": nonzero_values
        }
    
    results = {
        "source": round_results(raw_values[0], raw_indices[0]),
        "destination": round_results(raw_values[1], raw_indices[1])
    }

    return results