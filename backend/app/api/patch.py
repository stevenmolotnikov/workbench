from fastapi import APIRouter, Request
import nnsight as ns

from ..schema.patch import PatchRequest
from ..state import AppState

router = APIRouter()


def patch_tokens(model, patch_request, submodules):
    source_prompt = patch_request.source.prompt
    destination_tokens = model.tokenizer.encode(
        patch_request.destination.prompt
    )

    def logit_difference(logits):
        return (
            logits[0, -1, patch_request.correct_id]
            - logits[0, -1, patch_request.incorrect_id]
        )

    eps = 1e-6

    with model.session(remote=True):
        source_activations = []

        with model.trace(source_prompt):
            for sm in submodules:
                x = sm.output
                if patch_request.submodule == "blocks":
                    x = x[0]
                source_activations.append(x)

            logits = model.lm_head.output
            source_diff = logit_difference(logits)

        with model.trace(destination_tokens):
            logits = model.lm_head.output
            destination_diff = logit_difference(logits)

        results = []

        for sm, acts in zip(submodules, source_activations):
            row_results = ns.list().save()
            for idx in range(len(destination_tokens)):
                with model.trace(destination_tokens):
                    if patch_request.submodule == "blocks":
                        x = sm.output[0]
                        x[:, idx, :] = acts[:, idx, :]
                        sm.output = (x, sm.output[1])
                    else:
                        x = sm.output
                        x[:, idx, :] = acts[:, idx, :]
                        sm.output = x

                    logits = model.lm_head.output
                    restored_diff = logit_difference(logits)

                    result = (restored_diff - destination_diff) / (
                        (source_diff - destination_diff) + eps
                    )

                    row_results.append(result.item())

            results.append(row_results)

        return results


def patch_blocks(model, patch_request, submodules):
    pass


def patch_heads(model, patch_request, submodules):
    pass


def activation_patching(patch_request: PatchRequest, state: AppState):
    model = state.get_model(patch_request.model)

    match patch_request.submodule:
        case "attn":
            submodules = [l.attn for l in model.model.layers]
        case "mlp":
            submodules = [l.mlp for l in model.model.layers]
        case "blocks":
            submodules = model.model.layers

    if patch_request.patch_tokens:
        return patch_tokens(model, patch_request, submodules)
    elif patch_request.submodule == "blocks":
        return patch_blocks(model, patch_request, submodules)
    elif patch_request.submodule == "heads":
        return patch_heads(model, patch_request, submodules)


@router.post("/patch")
async def patch(patch_request: PatchRequest, request: Request):
    state = request.app.state.m
    result = activation_patching(patch_request, state)
    print(result)
    return {"result": "hello"}
