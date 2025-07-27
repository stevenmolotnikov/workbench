from fastapi import APIRouter, Request
import torch as t
import asyncio

from pydantic import BaseModel

from ..jobs import jobs
from ..data_models import Token
from ..state import AppState

router = APIRouter()

class ExecuteSelectedRequest(BaseModel):
    tokens: list[Token]
    model: str
    prompt: str

class CompletionResponse(BaseModel):
    ids: list[int]
    values: list[float]

def _execute_selected(
    state, execute_request
):
    idxs = [token.idx for token in execute_request.tokens]
    model = state.get_model(execute_request.model)

    prompt = execute_request.prompt

    with model.trace(prompt, remote=state.remote):
        logits = model.lm_head.output

        logits = logits[0, idxs, :].softmax(dim=-1)
        values_indices = t.sort(logits, dim=-1, descending=True)

        values = values_indices[0].save()
        indices = values_indices[1].save()

    return values, indices


async def process_execute_selected_background(
    execute_request: ExecuteSelectedRequest,
    state: AppState,
):
    """Background task to process execute selected computation"""
    values, indices = await asyncio.to_thread(
        _execute_selected, state, execute_request
    )

    idxs = [token.idx for token in execute_request.tokens]
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
            "values": nonzero_values,
        }

    return results

@router.post("/get-execute-selected")
async def get_execute_selected(
    execute_request: ExecuteSelectedRequest, request: Request
):
    return jobs.create_job(
        process_execute_selected_background, execute_request, request
    )

@router.get("/listen-execute-selected/{job_id}")
async def listen_execute_selected(job_id: str):
    return jobs.get_job(job_id)


@router.get("/")
async def get_models(request: Request):
    config = request.app.state.m.get_config()
    return config.get_model_list()


class TokenizeRequest(BaseModel):
    text: list[str] = []  # Make optional with default empty list
    add_special_tokens: bool = True
    model: str
    operation: str = "tokenize"  # Added to support different operations
    token_ids: list[int] = None  # For decode operation


@router.post("/tokenize")
async def tokenize(tokenize_request: TokenizeRequest, request: Request):
    tok = request.app.state.m.get_model(tokenize_request.model).tokenizer
    
    if tokenize_request.operation == "decode":
        # Decode token IDs to text
        if not tokenize_request.token_ids:
            return {"error": "No token IDs provided for decode operation"}
        
        decoded_tokens = [tok.decode([token_id]) for token_id in tokenize_request.token_ids]
        return {"decoded_tokens": decoded_tokens}
    
    # Default tokenize operation
    if len(tokenize_request.text) == 1:
        # Single text input
        text_to_encode = tokenize_request.text[0]
        token_ids = tok.encode(
            text_to_encode, add_special_tokens=tokenize_request.add_special_tokens
        )
        
        # Decode each token to get its text representation
        decoded_tokens = [tok.decode([token_id]) for token_id in token_ids]
        return {
            "token_ids": token_ids,
            "tokens": [
                {"id": token_id, "text": decoded_text, "idx": idx}
                for idx, (token_id, decoded_text) in enumerate(zip(token_ids, decoded_tokens))
            ]
        }
    else:
        # Multiple text inputs - process each separately
        results = []
        for text in tokenize_request.text:
            text_token_ids = tok.encode(text, add_special_tokens=tokenize_request.add_special_tokens)
            decoded_tokens = [tok.decode([token_id]) for token_id in text_token_ids]
            results.append({
                "token_ids": text_token_ids,
                "tokens": [
                    {"id": token_id, "text": decoded_text, "idx": idx}
                    for idx, (token_id, decoded_text) in enumerate(zip(text_token_ids, decoded_tokens))
                ]
            })
        return {"results": results}