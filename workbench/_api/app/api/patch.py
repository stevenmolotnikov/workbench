from itertools import chain
from typing import List

import einops
from fastapi import APIRouter, Request
from nnsight import LanguageModel
import nnsight as ns
import torch as t
from transformers import AutoTokenizer

from ..schema.patch import PatchRequest, Connection


"""
Dimension key:

B: batch size
L: sequence length
M: memory length (length of sequence being attended to)
D: model dimension (sometimes called d_model or embedding_dim)
V: vocabulary size
H: number of attention heads in a layer
Dh: size of each attention head
"""

EPS = 1e-10


def get_components(model, patching_request: PatchRequest):
    layers = model.model.layers
    match patching_request.submodule:
        case "blocks":
            return layers
        case "attn":
            return [layer.attn for layer in layers]
        case "mlp":
            return [layer.mlp for layer in layers]
        case _:
            raise ValueError(f"Invalid submodule: {patching_request.submodule}")


def logit_difference(model, patching_request: PatchRequest):
    logits = model.lm_head.output
    return (
        logits[0, -1, patching_request.correct_id]
        - logits[0, -1, patching_request.incorrect_id]
    )


def compute_ioi_metric(source_diff, destination_diff, patched_diff):
    return (patched_diff - destination_diff) / (
        (source_diff - destination_diff) + EPS
    )


def get_prob(model, patching_request: PatchRequest):
    logits = model.lm_head.output
    probs = t.softmax(logits, dim=-1)
    return probs[0, -1, patching_request.correct_id]


def patch_components(model: LanguageModel, patching_request: PatchRequest):
    components = get_components(model, patching_request)
    is_tuple = patching_request.submodule == "blocks"

    source_cache = {}

    with model.session():
        results = ns.list().save()

        with model.wrapped_trace(
            patching_request.source.prompt, job_id=patching_request.job_id
        ):
            for component in components:
                hidden_BLD = component.output

                if is_tuple:
                    hidden_BLD = hidden_BLD[0]

                source_cache[component] = hidden_BLD

            if patching_request.incorrect_id is not None:
                source_diff = logit_difference(model, patching_request)

        with model.wrapped_trace(
            patching_request.destination.prompt, job_id=patching_request.job_id
        ):
            destination_diff = logit_difference(model, patching_request)

        for component in components:
            with model.wrapped_trace(
                patching_request.destination.prompt,
                job_id=patching_request.job_id,
            ):
                if is_tuple:
                    hidden_BLD_tuple = component.output
                    component.output = (
                        source_cache[component],
                        hidden_BLD_tuple[1],
                    )
                else:
                    component.output = source_cache[component]

                if patching_request.incorrect_id is not None:
                    patched_diff = logit_difference(model, patching_request)
                    ioi_metric = compute_ioi_metric(
                        source_diff, destination_diff, patched_diff
                    )
                    results.append(ioi_metric)
                else:
                    prob = get_prob(model, patching_request)
                    results.append(prob)

    return results


def patch_heads(
    model: LanguageModel, n_heads: int, patching_request: PatchRequest
):
    components = [layer.attn.o_proj for layer in model.model.layers]

    source_cache = {}
    results = ns.dict().save()

    with model.session():
        # Cache source activations
        with model.wrapped_trace(
            patching_request.source.prompt, job_id=patching_request.job_id
        ):
            for component in components:
                hidden_BLD = component.input
                hidden_BLHDh = einops.rearrange(
                    hidden_BLD,
                    "b l (n_heads d_head) -> b l n_heads d_head",
                    n_heads=n_heads,
                )

                for head_idx in range(n_heads):
                    source_cache[(component, head_idx)] = hidden_BLHDh[
                        :, :, head_idx, :
                    ]

                if patching_request.incorrect_id is not None:
                    source_diff = logit_difference(model, patching_request)

        with model.wrapped_trace(
            patching_request.destination.prompt, job_id=patching_request.job_id
        ):
            destination_diff = logit_difference(model, patching_request)

        for layer_idx, component in enumerate(components):
            for head_idx in range(n_heads):
                with model.wrapped_trace(
                    patching_request.destination.prompt,
                    job_id=patching_request.job_id,
                ):
                    hidden_BLD = component.input
                    hidden_BLHDh = einops.rearrange(
                        hidden_BLD,
                        "b l (n_heads d_head) -> b l n_heads d_head",
                        n_heads=n_heads,
                    )

                    hidden_BLHDh[:, :, head_idx, :] = source_cache[
                        (component, head_idx)
                    ]

                    hidden_BLD = einops.rearrange(
                        hidden_BLHDh,
                        "b l n_heads d_head -> b l (n_heads d_head)",
                    )

                    component.input = hidden_BLD

                    if patching_request.incorrect_id is not None:
                        patched_diff = logit_difference(model, patching_request)
                        ioi_metric = compute_ioi_metric(
                            source_diff, destination_diff, patched_diff
                        )
                        results[(layer_idx, head_idx)] = ioi_metric
                    else:
                        prob = get_prob(model, patching_request)
                        results[(layer_idx, head_idx)] = prob

    return results


def patch_tokens(model: LanguageModel, patching_request: PatchRequest):
    components = get_components(model, patching_request)
    is_tuple = patching_request.submodule == "blocks"

    # Compute n_tokens
    destination_prompt = patching_request.destination.prompt
    destination_tokens = model.tokenizer.encode(destination_prompt)
    n_tokens = len(destination_tokens)

    source_cache = {}

    with model.session():
        results = ns.dict().save()

        with model.wrapped_trace(
            patching_request.source.prompt, job_id=patching_request.job_id
        ):
            for component in components:
                hidden_BLD = component.output

                if is_tuple:
                    hidden_BLD = hidden_BLD[0]

                for token_idx in range(n_tokens):
                    source_cache[(component, token_idx)] = hidden_BLD[
                        :, token_idx, :
                    ]

            if patching_request.incorrect_id is not None:
                source_diff = logit_difference(model, patching_request)

        with model.wrapped_trace(
            patching_request.destination.prompt, job_id=patching_request.job_id
        ):
            destination_diff = logit_difference(model, patching_request)

        for layer_idx, component in enumerate(components):
            ns.log(f"Patching layer {layer_idx}")
            for token_idx in range(n_tokens):
                with model.wrapped_trace(
                    destination_prompt, job_id=patching_request.job_id
                ):
                    if is_tuple:
                        hidden_BLD_tuple = component.output
                        hidden_BLD = hidden_BLD_tuple[0]

                        hidden_BLD[:, token_idx, :] = source_cache[
                            (component, token_idx)
                        ]
                        component.output = (hidden_BLD, hidden_BLD_tuple[1])

                    else:
                        hidden_BLD = component.output

                        hidden_BLD[:, token_idx, :] = source_cache[
                            (component, token_idx)
                        ]
                        component.output = hidden_BLD

                    if patching_request.incorrect_id is not None:
                        patched_diff = logit_difference(model, patching_request)
                        ioi_metric = compute_ioi_metric(
                            source_diff, destination_diff, patched_diff
                        )
                        results[(layer_idx, token_idx)] = ioi_metric
                    else:
                        prob = get_prob(model, patching_request)
                        results[(layer_idx, token_idx)] = prob

    return results


def compute_patching_idxs(
    tok: AutoTokenizer,
    connections: List[Connection],
    source_prompt: str,
    destination_prompt: str,
):
    # Tokenize prompts
    source_tokens = tok.encode(source_prompt)
    destination_tokens = tok.encode(destination_prompt)

    # Extract all token indices from connections
    start_idxs = [conn.start.token_indices for conn in connections]
    end_idxs = [conn.end.token_indices for conn in connections]

    # Get min of last tokens from each connection
    min_start = min(idxs[-1] for idxs in start_idxs)
    min_end = min(idxs[-1] for idxs in end_idxs)

    # Compute valid indices and return intersection
    source_valid = set(range(min_start, len(source_tokens))) - set(
        chain(*start_idxs)
    )
    dest_valid = set(range(min_end, len(destination_tokens))) - set(
        chain(*end_idxs)
    )

    return list(source_valid & dest_valid)


def patch_tokens_sync(model: LanguageModel, patching_request: PatchRequest):
    components = get_components(model, patching_request)
    is_tuple = patching_request.submodule == "blocks"

    connections = [
        edit for edit in patching_request.edits if isinstance(edit, Connection)
    ]

    patching_idxs = compute_patching_idxs(
        model.tokenizer,
        connections,
        patching_request.source.prompt,
        patching_request.destination.prompt,
    )

    source_cache = {}

    with model.session():
        results = ns.dict().save()

        with model.wrapped_trace(
            patching_request.source.prompt, job_id=patching_request.job_id
        ):
            for component in components:
                hidden_BLD = component.output

                if is_tuple:
                    hidden_BLD = hidden_BLD[0]

                # Cache source activations for connections
                for connection in connections:
                    start_token_last_idx = connection.start.token_indices[-1]

                    source_cache[(component, connection)] = hidden_BLD[
                        :, start_token_last_idx, :
                    ]

                # Cache source activations for tokens
                for token_idx in patching_idxs:
                    source_cache[(component, token_idx)] = hidden_BLD[
                        :, token_idx, :
                    ]

            if patching_request.incorrect_id is not None:
                source_diff = logit_difference(model, patching_request)

        with model.wrapped_trace(
            patching_request.destination.prompt, job_id=patching_request.job_id
        ):
            destination_diff = logit_difference(model, patching_request)

        for layer_idx, component in enumerate(components):
            # Patch tokens
            for token_idx in patching_idxs:
                with model.wrapped_trace(
                    patching_request.destination.prompt,
                    output_attentions=True,
                    job_id=patching_request.job_id,
                ):
                    if is_tuple:
                        hidden_BLD_tuple = component.output

                        hidden_BLD = hidden_BLD_tuple[0]

                    else:
                        hidden_BLD = component.output

                    # Patch in the token
                    hidden_BLD[:, token_idx, :] = source_cache[
                        (component, token_idx)
                    ]

                    # Set new output
                    if is_tuple:
                        component.output = (hidden_BLD, hidden_BLD_tuple[1])

                    else:
                        component.output = hidden_BLD

                    if patching_request.incorrect_id is not None:
                        patched_diff = logit_difference(model, patching_request)
                        ioi_metric = compute_ioi_metric(
                            source_diff, destination_diff, patched_diff
                        )
                        results[(layer_idx, token_idx)] = ioi_metric
                    else:
                        prob = get_prob(model, patching_request)
                        results[(layer_idx, token_idx)] = prob

            # Patch connections
            for connection in connections:
                with model.wrapped_trace(
                    patching_request.destination.prompt,
                    output_attentions=True,
                    job_id=patching_request.job_id,
                ):
                    if is_tuple:
                        hidden_BLD_tuple = component.output

                        hidden_BLD = hidden_BLD_tuple[0]

                    else:
                        hidden_BLD = component.output

                    end_token_last_idx = connection.end.token_indices[-1]

                    hidden_BLD[:, end_token_last_idx, :] = source_cache[
                        (component, connection)
                    ]

                    # Set new output
                    if is_tuple:
                        component.output = (hidden_BLD, hidden_BLD_tuple[1])

                    else:
                        component.output = hidden_BLD

                    if patching_request.incorrect_id is not None:
                        patched_diff = logit_difference(model, patching_request)
                        ioi_metric = compute_ioi_metric(
                            source_diff, destination_diff, patched_diff
                        )
                        results[(layer_idx, end_token_last_idx)] = ioi_metric
                    else:
                        prob = get_prob(model, patching_request)
                        results[(layer_idx, end_token_last_idx)] = prob

    return results


def patch_tokens_async(model: LanguageModel, patching_request: PatchRequest):
    pass
    # components = get_components(model, patching_request)

    # source_cache = {}

    # with model.session():
    #     with model.wrapped_trace(patching_request.source.prompt):
    #         for component in components:
    #             hidden_BLD = component.output


router = APIRouter()


@router.post("/patch")
def patch(patching_request: PatchRequest, request: Request):
    state = request.app.state.m
    model = state.get_model(patching_request.model)

    if patching_request.patch_tokens:
        has_connections = any(
            isinstance(edit, Connection) for edit in patching_request.edits
        )

        if has_connections:
            return patch_tokens_sync(model, patching_request)

        return patch_tokens(model, patching_request)

    else:
        if patching_request.submodule == "heads":
            return patch_heads(model, patching_request)

        return patch_components(model, patching_request)
