from fastapi import APIRouter, Request
import torch as t

from ..schema.models import ExecuteRequest

router = APIRouter()

@router.post("/execute")
async def execute(execute_request: ExecuteRequest, request: Request):
    state = request.app.state.m
    
    results = []
    for conversation in execute_request.conversations:
        model = state.get_model(conversation.model)
        tok = model.tokenizer
        prompt = conversation.prompt

        with model.trace(prompt, remote=True):
            logits = model.lm_head.output
            values_indices = t.topk(logits[:,-1,:], k=10, dim=-1)
            # values = values_indices[0].tolist().save()
            indices = values_indices[1].tolist().save()

        results.append({
            "id": conversation.id,
            "str_indices": tok.batch_decode(indices[0]),
            "indices": indices[0]
        })

        print(results)

    return {
        "results": results
    }
