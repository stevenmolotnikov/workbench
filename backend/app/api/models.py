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
    tok = model.tokenizer
    prompt = execute_request.completion.prompt

    with model.trace(prompt, remote=state.remote):
        logits = model.lm_head.output

        logits = logits[0,idxs,:].softmax(dim=-1)
        values_indices = t.topk(logits, k=3, dim=-1)

        values = values_indices[0].tolist().save()
        indices = values_indices[1].tolist().save()

    all_str_idxs = [
        tok.batch_decode(idx) for idx in indices
    ]

    results = {
        token_index : {
            "str_idxs": all_str_idxs[idx],
            "values": values[idx],
            "indices": indices[idx]
        } for idx, token_index in enumerate(idxs)
    }

    return results