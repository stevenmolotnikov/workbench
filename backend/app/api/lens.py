from collections import defaultdict

from fastapi import APIRouter, Request
import torch as t
import nnsight as ns


from ..schema.lens import LensRequest, LensResponse
from ..state import AppState

router = APIRouter()

def logit_lens(model, model_requests, remote: bool):
    def decode(x):
        return model.lm_head(model.model.ln_f(x))[:,]

    all_results = []
    with model.trace(remote=remote) as tracer:
        for request in model_requests:
            # Get user queried indices
            idxs = request["idxs"]
            target_ids = request["target_ids"]
            results = []

            ns.log(idxs)
            ns.log(target_ids)

            with tracer.invoke(request["prompt"]):
                for layer_idx, layer in enumerate(model.model.layers):
                    # Decode hidden state into vocabulary
                    x = layer.output[0]
                    logits = decode(x)

                    # Compute probabilities over the relevant tokens
                    relevant_tokens = logits[0, idxs, :]

                    probs = t.nn.functional.softmax(relevant_tokens, dim=-1)

                    # Gather probabilities over the predicted tokens
                    target_probs = t.gather(probs, 1, target_ids.unsqueeze(1)).squeeze()

                    # Save results
                    results.append({
                        "id": request["id"],
                        "layer_idx": layer_idx,
                        "target_probs": target_probs.save(),
                    })
                
            all_results.extend(results)

    return all_results



def preprocess(lens_request: LensRequest):
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
            "id" : completion.id,
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

        # If only a single token is selected, pred_probs is a float
        if not isinstance(target_probs, list):
            target_probs = [target_probs]

        layer_idx = result["layer_idx"]
        for prob in target_probs:
            processed_results[layer_idx].append({
                "id": result["id"],
                "prob": prob,
            })

    layer_results = [
        {
            "layer": layer_idx,
            "points": processed_results[layer_idx]
        } for layer_idx in processed_results
    ]

    return layer_results


@router.post("/lens")
async def lens(lens_request: LensRequest, request: Request):
    state = request.app.state.m

    grouped_requests = preprocess(lens_request)

    # Compute logit lens for each model
    results = []
    for model_name, model_requests in grouped_requests.items():
        model = state.get_model(model_name)
        model_results = logit_lens(model, model_requests, state.remote)
        results.extend(model_results)

    results = postprocess(results)

    print(results)

    return LensResponse(**{
        "data": results,
        "metadata": {
            "maxLayer": len(results) - 1
        }
    })