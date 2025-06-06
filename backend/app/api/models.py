from fastapi import APIRouter, Request
import torch as t

from ..schema.models import ExecuteRequest, ExecuteSelectedRequest

router = APIRouter()

@router.post("/execute")
async def execute(execute_request: ExecuteRequest, request: Request):
    state = request.app.state.m
    
    results = []
    for completion in execute_request.completions:
        model = state.get_model(execute_request.model)
        tok = model.tokenizer
        prompt = completion.prompt

        with model.trace(prompt, remote=state.remote):
            logits = model.lm_head.output
            values_indices = t.topk(logits[:,-1,:], k=10, dim=-1)
            # values = values_indices[0].tolist().save()
            indices = values_indices[1].tolist().save()

        results.append({
            "id": completion.id,
            "str_indices": tok.batch_decode(indices[0]),
            "indices": indices[0]
        })

        print(results)

    return {
        "results": results
    }


@router.post("/execute_selected")
async def execute_selected(execute_request: ExecuteSelectedRequest, request: Request):
    state = request.app.state.m
    
    idxs = [token.idx for token in execute_request.tokens]
    model = state.get_model(execute_request.model)

    prompt = execute_request.completion.prompt

    with model.wrapped_trace(prompt):
        logits = model.lm_head.output

        logits = logits[0,idxs,:].softmax(dim=-1)
        values_indices = t.sort(logits, dim=-1, descending=True)

        values = values_indices[0].save()
        indices = values_indices[1].save()


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