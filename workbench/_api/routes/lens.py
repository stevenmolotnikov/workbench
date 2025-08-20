from fastapi import APIRouter, Depends
from pydantic import BaseModel
import torch as t

from ..state import AppState, get_state
from ..data_models import Token, NDIFResponse


class LensLineRequest(BaseModel):
    model: str
    prompt: str
    token: Token


class Point(BaseModel):
    x: int
    y: float


class Line(BaseModel):
    id: str
    data: list[Point]


class LensLineResponse(NDIFResponse):
    data: list[Line] | None = None


router = APIRouter()


def line(req: LensLineRequest, state: AppState) -> list[t.Tensor]:
    model = state[req.model]
    idx = req.token.idx
    target_ids = req.token.target_ids

    with model.trace(
        req.prompt,
        remote=state.remote,
        backend=state.make_backend(model=model),
    ) as tracer:
        results = []
        for layer in model.model.layers:
            # Decode hidden state into vocabulary
            hidden_BLD = layer.output[0]

            # NOTE(cadentj): Can't pickle local decode function atm
            logits_BLV = model.lm_head(model.model.ln_f(hidden_BLD))

            # Compute probabilities over the relevant tokens
            logits_V = logits_BLV[0, idx, :]

            probs_V = t.nn.functional.softmax(logits_V, dim=-1)

            # Gather probabilities over the predicted tokens
            target_ids_tensor = t.tensor(target_ids).to(probs_V.device)
            target_probs_X = t.gather(probs_V, 0, target_ids_tensor)

            results.append(target_probs_X)

        results.save()

    if state.remote:
        return tracer.backend.job_id

    return results


def get_remote_line(job_id: str, state: AppState):
    backend = state.make_backend(job_id=job_id)
    results = backend()
    return results["results"]


def process_line_results(
    results: list[t.Tensor],
    req: LensLineRequest,
    state: AppState,
):
    tok = state[req.model].tokenizer
    target_token_strs = tok.batch_decode(req.token.target_ids)

    lines = []

    # Get results into a format for the FE component
    for layer_idx, probs in enumerate(results):
        for line_idx, prob in enumerate(probs.tolist()):
            if layer_idx == 0:
                lines.append(
                    Line(
                        id=target_token_strs[line_idx].replace(" ", "_"),
                        data=[Point(x=layer_idx, y=prob)],
                    )
                )
            else:
                lines[line_idx].data.append(Point(x=layer_idx, y=prob))

    return lines


@router.post("/start-line", response_model=LensLineResponse)
async def start_line(
    req: LensLineRequest, state: AppState = Depends(get_state)
):
    result = line(req, state)
    if state.remote:
        return {"job_id": result}

    return {"data": process_line_results(result, req, state)}


@router.post("/results-line/{job_id}", response_model=LensLineResponse)
async def collect_line(
    job_id: str,
    req: LensLineRequest,
    state: AppState = Depends(get_state),
):
    results = get_remote_line(job_id, state)
    return {"data": process_line_results(results, req, state)}


class GridLensRequest(BaseModel):
    model: str
    prompt: str


class GridCell(Point):
    label: str


class GridRow(BaseModel):
    # Token ID
    id: str
    data: list[GridCell]


class GridLensResponse(NDIFResponse):
    data: list[GridRow] | None = None


def heatmap(
    req: GridLensRequest, state: AppState
) -> tuple[list[t.Tensor], list[t.Tensor]]:
    model = state[req.model]

    def _compute_top_probs(
        logits_BLV: t.Tensor,
        # NOTE(cadentj): Can't put this in the trace body bc of pickling issues
        probs: list[t.Tensor],
        pred_ids: list[t.Tensor],
    ):
        relevant_tokens_LV = logits_BLV[0, :, :]

        probs_LV = t.nn.functional.softmax(relevant_tokens_LV, dim=-1)
        pred_ids_L = relevant_tokens_LV.argmax(dim=-1)

        # Gather probabilities over the predicted tokens
        pred_ids_L1 = pred_ids_L.unsqueeze(1)
        probs_L = t.gather(probs_LV, 1, pred_ids_L1).squeeze()

        pred_ids.append(pred_ids_L.tolist())
        probs.append(probs_L.tolist())

    with model.trace(
        req.prompt,
        remote=state.remote,
        backend=state.make_backend(model=model),
    ) as tracer:
        pred_ids = []
        probs = []

        for layer in model.model.layers[:-1]:
            _compute_top_probs(
                # NOTE(cadentj): Can't put this in the trace body bc of pickling issues
                model.lm_head(model.model.ln_f(layer.output[0])),
                probs,
                pred_ids,
            )
        _compute_top_probs(model.output.logits, probs, pred_ids)

        probs.save()
        pred_ids.save()

    if state.remote:
        return tracer.backend.job_id

    return probs, pred_ids


def get_remote_heatmap(
    job_id: str, state: AppState
) -> tuple[list[t.Tensor], list[t.Tensor]]:
    backend = state.make_backend(job_id=job_id)
    results = backend()
    return results["probs"], results["pred_ids"]


def process_grid_results(
    probs: list[t.Tensor],
    pred_ids: list[t.Tensor],
    lens_request: GridLensRequest,
    state: AppState,
):
    """Background task to process grid lens computation"""
    # Get the stringified tokens of the input
    tok = state[lens_request.model].tokenizer
    input_strs = tok.batch_decode(tok.encode(lens_request.prompt))

    rows = []
    for seq_idx, input_str in enumerate(input_strs):
        points = [
            GridCell(
                x=layer_idx,
                y=prob[seq_idx],
                label=tok.decode(pred_id[seq_idx]),
            )
            for layer_idx, (prob, pred_id) in enumerate(zip(probs, pred_ids))
        ]
        # Add the input string to the row id to make it unique
        rows.append(GridRow(id=f"{input_str}-{seq_idx}", data=points))

    return rows


@router.post("/start-grid", response_model=GridLensResponse)
async def get_grid(req: GridLensRequest, state: AppState = Depends(get_state)):
    result = heatmap(req, state)
    if state.remote:
        return {"job_id": result}

    probs, pred_ids = result
    return {"data": process_grid_results(probs, pred_ids, req, state)}


@router.post("/results-grid/{job_id}", response_model=GridLensResponse)
async def collect_grid(
    job_id: str,
    lens_request: GridLensRequest,
    state: AppState = Depends(get_state),
):
    probs, pred_ids = get_remote_heatmap(job_id, state)
    return {"data": process_grid_results(probs, pred_ids, lens_request, state)}
