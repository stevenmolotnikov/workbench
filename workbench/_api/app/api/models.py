from fastapi import APIRouter, Request
import torch as t

from ..schema.models import ExecuteSelectedRequest
from ..utils import send_update

router = APIRouter()

@router.post("/execute_selected")
async def execute_selected(execute_request: ExecuteSelectedRequest, request: Request):
    state = request.app.state.m
    
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