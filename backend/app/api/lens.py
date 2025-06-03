from collections import defaultdict

from fastapi import APIRouter, Request
import torch as t
import nnsight as ns

from ..schema.lens import (
    TargetedLensRequest,
    GridLensRequest,
    GridLensResponse,
    LensResponse,
)

router = APIRouter()


def logit_lens_grid(model, prompt, remote: bool):
    def decode(x):
        return model.lm_head(model.model.ln_f(x))

    pred_ids = []
    probs = []
    with model.trace(prompt, remote=remote):
        for layer in model.model.layers:
            # Decode hidden state into vocabulary
            x = layer.output[0]
            logits = decode(x)

            # Compute probabilities over the relevant tokens
            relevant_tokens = logits[0, :, :]

            _probs = t.nn.functional.softmax(relevant_tokens, dim=-1)
            _pred_ids = relevant_tokens.argmax(dim=-1)

            # Gather probabilities over the predicted tokens
            _probs = t.gather(_probs, 1, _pred_ids.unsqueeze(1)).squeeze()

            pred_ids.append(_pred_ids.save())
            probs.append(_probs.save())

    # TEMPORARAY FIX FOR 0.4
    probs = [p.tolist() for p in probs]
    pred_ids = [p.tolist() for p in pred_ids]

    return pred_ids, probs


def logit_lens_targeted(model, model_requests, remote: bool):
    def decode(x):
        return model.lm_head(model.model.ln_f(x))

    tok = model.tokenizer

    all_results = []
    with model.trace(remote=remote) as tracer:
        for request in model_requests:
            # Get user queried indices
            idxs = request["idxs"]
            target_ids = request["target_ids"]
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
                            "idxs": idxs,
                            "prompt_id_strs": prompt_id_strs,
                        }
                    )

            all_results.extend(results)

    return all_results


def preprocess(lens_request: TargetedLensRequest | GridLensRequest):
    # Batch prompts for the same model
    grouped_requests = defaultdict(list)
    for completion in lens_request.completions:
        idxs = []
        target_ids = []

        for token in completion.tokens:
            # These tokens have no target token set
            if token.target_id != -1:
                idxs.append(token.idx)
                target_ids.append(token.target_id)

        target_ids = t.tensor(target_ids)

        request = {
            "name": completion.name,
            "prompt": completion.prompt,
            "idxs": idxs,
            "target_ids": target_ids,
        }
        grouped_requests[completion.model].append(request)

    return grouped_requests


def postprocess(results):
    processed_results = defaultdict(list)
    for result in results:
        # preds = result["preds"].value
        target_probs = result["target_probs"].tolist()
        target_idxs = result["idxs"]
        target_prompt_id_strs = result["prompt_id_strs"]

        # If only a single token is selected, pred_probs is a float
        if not isinstance(target_probs, list):
            target_probs = [target_probs]

        layer_idx = result["layer_idx"]
        for idx, prob in zip(target_idxs, target_probs):
            processed_results[layer_idx].append(
                {
                    "name": result["name"] + f" - (\"{target_prompt_id_strs[idx]}\" | {idx})",
                    "prob": round(prob, 2),
                }
            )

    layer_results = [
        {"layer": layer_idx, "points": processed_results[layer_idx]}
        for layer_idx in processed_results
    ]

    return layer_results


@router.post("/targeted-lens")
async def targeted_lens(lens_request: TargetedLensRequest, request: Request):
    state = request.app.state.m

    grouped_requests = preprocess(lens_request)

    # Compute logit lens for each model
    results = []
    for model_name, model_requests in grouped_requests.items():
        model = state.get_model(model_name)
        model_results = logit_lens_targeted(model, model_requests, state.remote)
        results.extend(model_results)

    results = postprocess(results)

    print(results)

    return LensResponse(
        **{"data": results, "metadata": {"maxLayer": len(results) - 1}}
    )


@router.post("/grid-lens")
async def grid_lens(lens_request: GridLensRequest, request: Request):
    state = request.app.state.m

    model = state.get_model(lens_request.completion.model)
    tok = model.tokenizer
    prompt = lens_request.completion.prompt

    pred_ids, probs = logit_lens_grid(model, prompt, state.remote)

    pred_strs = [tok.batch_decode(_pred_ids) for _pred_ids in pred_ids]

    return GridLensResponse(
        id=lens_request.completion.id,
        probs=probs,
        pred_strs=pred_strs,
    )
