from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import torch as t
from typing import List, Optional
import logging

from ..state import AppState, get_state
from ..data_models import NDIFResponse
from ..auth import require_user_email

logger = logging.getLogger(__name__)

router = APIRouter()


class TokenProbability(BaseModel):
    token: str
    probability: float
    rank: int
    top_alternatives: List[dict]


class PerplexRequest(BaseModel):
    model: str
    prompt: str
    output: str
    top_k: int = 3


class PerplexData(BaseModel):
    prompt: str
    vocab_size: int
    model_name: str
    prompt_tokens: List[TokenProbability]
    output_tokens: List[TokenProbability]


class PerplexResponse(NDIFResponse):
    data: PerplexData | None = None


def calculate_token_probabilities(
    model_name: str,
    prompt: str,
    output: str,
    state: AppState,
    top_k: int = 3
) -> tuple[List[TokenProbability], List[TokenProbability], int]:
    """
    Calculate token probabilities for the output text given the prompt.
    """
    model = state[model_name]
    tokenizer = model.tokenizer
    
    # Tokenize prompt and output separately
    prompt_ids = tokenizer.encode(prompt, return_tensors="pt")
    if prompt_ids.dim() == 2:
        prompt_ids = prompt_ids[0]
    
    output_ids = tokenizer.encode(output, return_tensors="pt")
    if output_ids.dim() == 2:
        output_ids = output_ids[0]
    
    # For remote execution, we need to handle this differently
    if state.remote:
        raise HTTPException(
            status_code=501, 
            detail="Remote perplex not yet implemented"
        )
    
    # Concatenate prompt and output for tracing
    full_text = prompt + output
    
    # Run the model with tracing
    with model.trace(full_text, remote=False) as tracer:
        # Get logits from the model output
        logits_BLV = model.output.logits
        logits_BLV.save()
    
    # Remove batch dimension
    logits_LV = logits_BLV[0]
    prompt_len = prompt_ids.size(0)
    vocab_size = logits_LV.size(-1)
    
    prompt_token_data = []
    output_token_data = []
    
    # For the first token, we need to use BOS token to get initial predictions
    # Get the BOS token ID if it exists, otherwise use an empty tensor approach
    bos_token_id = tokenizer.bos_token_id if tokenizer.bos_token_id is not None else tokenizer.eos_token_id
    
    if bos_token_id is not None:
        # Trace with just the BOS token to get predictions for the first position
        bos_ids = t.tensor([[bos_token_id]])
        with model.trace(tokenizer.decode([bos_token_id]), remote=False) as bos_tracer:
            bos_logits_BLV = model.output.logits
            bos_logits_BLV.save()
        bos_logits_available = True
    else:
        bos_logits_available = False
    
    # Calculate probabilities for all prompt tokens
    for i, token_id in enumerate(prompt_ids):
        token_id_int = token_id.item()
        token_str = tokenizer.decode([token_id_int])
        
        if i == 0:
            if bos_logits_available:
                # Get predictions from position after BOS
                bos_logits = bos_logits_BLV[0, 0]
                probabilities = t.softmax(bos_logits, dim=-1)
            else:
                # If no BOS token, skip the first token (can't predict without context)
                continue
        else:
            # Get logits for position that predicts current token
            current_logits = logits_LV[i - 1]
            probabilities = t.softmax(current_logits, dim=-1)
        
        # Calculate probability
        actual_prob = probabilities[token_id_int].item()
        
        # Get top k alternatives first
        top_k_probs, top_k_indices = t.topk(probabilities, min(top_k, vocab_size))
        top_k_tokens = [tokenizer.decode([idx.item()]) for idx in top_k_indices]
        
        top_alternatives = [
            {"token": token, "probability": prob.item()}
            for token, prob in zip(top_k_tokens, top_k_probs)
        ]
        
        # Calculate rank - check if token is in top_k first for consistency
        actual_rank = None
        for rank_idx, top_token_id in enumerate(top_k_indices):
            if top_token_id.item() == token_id_int:
                actual_rank = rank_idx + 1
                break
        
        # If not in top_k, calculate full rank
        if actual_rank is None:
            sorted_indices = t.argsort(probabilities, descending=True)
            actual_rank = (sorted_indices == token_id_int).nonzero(as_tuple=True)[0].item() + 1
        
        prompt_token_data.append(
            TokenProbability(
                token=token_str,
                probability=actual_prob,
                rank=actual_rank,
                top_alternatives=top_alternatives
            )
        )
    
    # Calculate probabilities for output tokens
    for i, token_id in enumerate(output_ids):
        token_id = token_id.item()
        
        # Get logits for position that predicts current token
        # The logit at position (prompt_len + i - 1) predicts token at position (prompt_len + i)
        current_logits = logits_LV[prompt_len + i - 1]
        probabilities = t.softmax(current_logits, dim=-1)
        
        # Get probability of actual token
        actual_prob = probabilities[token_id].item()
        
        # Get token string
        token_str = tokenizer.decode([token_id])
        
        # Get top k alternatives first
        top_k_probs, top_k_indices = t.topk(probabilities, min(top_k, vocab_size))
        top_k_tokens = [tokenizer.decode([idx.item()]) for idx in top_k_indices]
        
        top_alternatives = [
            {"token": token, "probability": prob.item()}
            for token, prob in zip(top_k_tokens, top_k_probs)
        ]
        
        # Calculate rank - check if token is in top_k first for consistency
        actual_rank = None
        for rank_idx, top_token_id in enumerate(top_k_indices):
            if top_token_id.item() == token_id:
                actual_rank = rank_idx + 1
                break
        
        # If not in top_k, calculate full rank
        if actual_rank is None:
            sorted_indices = t.argsort(probabilities, descending=True)
            actual_rank = (sorted_indices == token_id).nonzero(as_tuple=True)[0].item() + 1
        
        output_token_data.append(
            TokenProbability(
                token=token_str,
                probability=actual_prob,
                rank=actual_rank,
                top_alternatives=top_alternatives
            )
        )
    
    return prompt_token_data, output_token_data, vocab_size


@router.post("/calculate", response_model=PerplexResponse)
async def calculate_probabilities(
    req: PerplexRequest,
    state: AppState = Depends(get_state),
    user_email: str = Depends(require_user_email)
):
    """
    Calculate token probabilities for a given prompt and output.
    """
    try:
        prompt_tokens, output_tokens, vocab_size = calculate_token_probabilities(
            req.model, req.prompt, req.output, state, req.top_k
        )
        
        return {
            "data": PerplexData(
                prompt=req.prompt,
                vocab_size=vocab_size,
                model_name=req.model,
                prompt_tokens=prompt_tokens,
                output_tokens=output_tokens
            )
        }
    except Exception as e:
        logger.error(f"Error calculating probabilities: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
