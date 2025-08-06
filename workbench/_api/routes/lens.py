import asyncio
from collections import defaultdict

from anyio.streams.memory import MemoryObjectSendStream
from fastapi import APIRouter, Depends
from pydantic import BaseModel
import torch as t

from ..state import AppState, get_state
from ..data_models import Token
from ..jobs import jobs

##### TARGETED LENS REQUEST SCHEMA #####


class TargetedLensCompletion(BaseModel):
    name: str
    token: Token
    model: str
    prompt: str


class TargetedLensRequest(BaseModel):
    completions: list[TargetedLensCompletion]


##### TARGETED LENS RESPONSE SCHEMA #####


class Point(BaseModel):
    name: str
    prob: float


class LayerResults(BaseModel):
    layer: int
    points: list[Point]


class LensResponse(BaseModel):
    layerResults: list[LayerResults]
    maxLayer: int


##### GRID LENS REQUEST SCHEMA #####


class GridLensRequest(BaseModel):
    model: str
    prompt: str


##### GRID LENS RESPONSE SCHEMA #####


class GridLensResponse(BaseModel):
    input_strs: list[str]
    probs: list[list[float]]
    pred_strs: list[list[str]]


router = APIRouter()


def logit_lens_grid(model, prompt, remote):
    def decode(x):
        return model.lm_head(model.model.ln_f(x))

    pred_ids = []
    probs = []

    def get_stuff(logits):
        # Compute probabilities over the relevant tokens
        relevant_tokens = logits[0, :, :]

        _probs = t.nn.functional.softmax(relevant_tokens, dim=-1)
        _pred_ids = relevant_tokens.argmax(dim=-1)

        # Gather probabilities over the predicted tokens
        _probs = t.gather(_probs, 1, _pred_ids.unsqueeze(1)).squeeze()

        pred_ids.append(_pred_ids.save())
        probs.append(_probs.save())

    with model.trace(prompt, remote=remote):
        for layer in model.model.layers[:-1]:
            # Decode hidden state into vocabulary
            x = layer.output[0]
            get_stuff(decode(x))
        get_stuff(model.output.logits)

    # TEMPORARAY FIX FOR 0.4
    probs = [p.tolist() for p in probs]
    pred_ids = [p.tolist() for p in pred_ids]

    tok = model.tokenizer
    input_strs = tok.batch_decode(tok.encode(prompt))

    return pred_ids, probs, input_strs


def logit_lens_targeted(model, model_requests, remote):
    def decode(x):
        return model.lm_head(model.model.ln_f(x))

    tok = model.tokenizer

    all_results = []
    with model.trace(remote=remote) as tracer:
        for request in model_requests:
            # Get user queried indices
            idxs = request["idxs"]
            target_ids = request["target_ids"]
            target_id_strs = tok.batch_decode(target_ids)
            results = []

            prompt_id_strs = tok.batch_decode(tok.encode(request["prompt"]))
            with tracer.invoke(request["prompt"]):
                for layer_idx, layer in enumerate(model.model.layers):
                    # Decode hidden state into vocabulary
                    x = layer.output[0]
                    logits = decode(x)

                    # Compute probabilities over the relevant tokens
                    relevant_tokens = logits[0, idxs, :]

                    probs = t.nn.functional.softmax(relevant_tokens, dim=-1)

                    # Gather probabilities over the predicted tokens
                    target_probs = t.gather(
                        probs, 1, target_ids.unsqueeze(1)
                    ).squeeze()

                    # Save results
                    results.append(
                        {
                            "name": request["name"],
                            "layer_idx": layer_idx,
                            "target_probs": target_probs.save(),
                            "target_id_strs": target_id_strs,
                            "idxs": idxs,
                            "prompt_id_strs": prompt_id_strs,
                        }
                    )

            all_results.extend(results)

    return all_results


def preprocess(lens_request: TargetedLensRequest):
    # Batch prompts for the same model
    grouped_requests = defaultdict(list)
    for completion in lens_request.completions:
        idxs = []
        target_ids = []

        token = completion.token
        # These tokens have no target token set
        if token.target_id != -1:
            idxs.append(token.idx)
            target_ids.append(token.target_id)

        target_ids = t.tensor(target_ids)

        request = {
            "name": completion.name,
            "prompt": completion,
            "idxs": idxs,
            "target_ids": target_ids,
        }
        grouped_requests[completion.model].append(request)

    return grouped_requests


def postprocess(results):
    processed_results = defaultdict(list)
    for result in results:
        target_probs = result["target_probs"].tolist()
        target_idxs = result["idxs"]
        prompt_id_strs = result["prompt_id_strs"]
        target_id_strs = result["target_id_strs"]

        # If only a single token is selected, pred_probs is a float
        if not isinstance(target_probs, list):
            target_probs = [target_probs]

        layer_idx = result["layer_idx"]
        for idx, prob, id_str in zip(target_idxs, target_probs, target_id_strs):
            processed_results[layer_idx].append(
                {
                    "name": result["name"]
                    + f' - ("{prompt_id_strs[idx]}" → "{id_str}")',
                    "prob": round(prob, 2),
                }
            )

    layer_results = [
        {"layer": layer_idx, "points": processed_results[layer_idx]}
        for layer_idx in processed_results
    ]

    return layer_results


async def process_targeted_lens_background(
    lens_request: TargetedLensRequest,
    state: AppState,
    send_stream: MemoryObjectSendStream,
):
    """Background task to process targeted lens computation"""
    grouped_requests = preprocess(lens_request)

    # Process each model
    all_results = []
    for model_name, model_requests in grouped_requests.items():
        model = state.get_model(model_name)

        # Run computation in thread pool
        model_results = await asyncio.to_thread(
            logit_lens_targeted, model, model_requests, state.remote
        )
        all_results.extend(model_results)

    # Process results
    results = postprocess(all_results)

    # Send final result
    await send_stream.send(
        {
            "type": "result",
            "data": {
                "layerResults": results,
                "maxLayer": len(results) - 1,
            },
        }
    )


async def process_grid_lens_background(
    lens_request: GridLensRequest,
    state: AppState,
):
    """Background task to process grid lens computation"""
    model = state.get_model(lens_request.model)
    tok = model.tokenizer
    prompt = lens_request.prompt

    # Run computation in thread pool
    pred_ids, probs, input_strs = await asyncio.to_thread(
        logit_lens_grid, model, prompt, state.remote
    )

    pred_strs = [tok.batch_decode(_pred_ids) for _pred_ids in pred_ids]

    return {
        "input_strs": input_strs,
        "probs": probs,
        "pred_strs": pred_strs,
    }


@router.post("/get-line")
async def get_targeted_lens(
    lens_request: TargetedLensRequest, state: AppState = Depends(get_state)
):
    return jobs.create_job(
        process_targeted_lens_background, lens_request, state
    )


@router.get("/listen-line/{job_id}")
async def listen_targeted_lens(job_id: str):
    """Listen for targeted lens results via SSE using MemoryObjectStream"""
    return jobs.get_job(job_id)


@router.post("/get-grid")
async def get_grid_lens(
    lens_request: GridLensRequest, state: AppState = Depends(get_state)
):
    return jobs.create_job(process_grid_lens_background, lens_request, state)


@router.get("/listen-grid/{job_id}")
async def listen_grid_lens(job_id: str):
    """Listen for grid lens results via SSE using MemoryObjectStream"""
    return jobs.get_job(job_id)
