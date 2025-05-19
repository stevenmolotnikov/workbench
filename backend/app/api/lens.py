from collections import defaultdict

from fastapi import APIRouter, Request
import torch as t

from ..schema.lens import LensRequest, LensResponse
from ..state import AppState

router = APIRouter()

def logit_lens(model, model_tasks, remote: bool):
    def decode(x):
        return model.lm_head(model.model.ln_f(x))[:,]

    all_results = []
    with model.trace(remote=remote) as tracer:
        for task in model_tasks:
            # Get user queried indices
            idxs = task["selected_token_indices"]
            results = []

            with tracer.invoke(task["prompt"]):
                for layer_idx, layer in enumerate(model.model.layers):
                    # Decode hidden state into vocabulary
                    x = layer.output[0]
                    logits = decode(x)

                    # Compute probabilities over the relevant tokens
                    relevant_tokens = logits[0, idxs, :]
                    probs = t.nn.functional.softmax(relevant_tokens, dim=-1)

                    # Get the predicted token at each index
                    preds = t.argmax(probs, dim=-1)

                    # Gather probabilities over the predicted tokens
                    pred_probs = t.gather(probs, 1, preds.unsqueeze(1)).squeeze()

                    # Save results
                    results.append({
                        "layer_idx": layer_idx,
                        "pred_probs": pred_probs.save(),
                        "preds": preds.save(),
                    })
                
            all_results.append(results)

    return all_results

def process_results(model, results):
    processed_results = []
    for layer_results in results:
        # Cast to Python primatives and get Proxy values
        preds = layer_results["preds"].value
        pred_probs = layer_results["pred_probs"].tolist()

        # If only a single token is selected, pred_probs is a float
        if not isinstance(pred_probs, list):
            pred_probs = [pred_probs]

        # Get string for each token id prediction
        str_toks = model.tokenizer.batch_decode(preds)

        processed_results.append({
            "layer_idx": layer_results["layer_idx"],
            "pred_probs": pred_probs,
            "preds": str_toks,
        })

    return processed_results


def preprocess(lens_request: LensRequest):
    # Batch prompts for the same model
    grouped_requests = defaultdict(list)
    for completion in lens_request.completions:
        request = {
            "prompt": completion.prompt,
            "selected_token_indices": completion.selectedTokenIndices,
        }
        grouped_requests[completion.model].append(request)

    return grouped_requests


@router.post("/lens")
async def lens(lens_request: LensRequest, request: Request):
    state = request.app.state.m

    grouped_requests = preprocess(lens_request)

    # Compute logit lens for each model
    all_results = []
    for model_name, model_tasks in grouped_requests.items():
        model = state.get_model(model_name)
        results = logit_lens(model, model_tasks, state.remote)

        for instance_idx, instance_results in enumerate(results):
            processed_results = process_results(model, instance_results)
            all_results.append({
                "model_name": f"{model_name} | {instance_idx}",
                "layer_results": processed_results,
            })

    return LensResponse(model_results=all_results)