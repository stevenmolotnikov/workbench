from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
import torch as t
import asyncio
from typing import Dict
import anyio
from anyio.streams.memory import MemoryObjectSendStream

from pydantic import BaseModel

from ..utils import (
    use_send_stream,
    format_sse_event,
    stream_from_memory_object,
)
from ..data_models import Completion, NDIFRequest, Token

router = APIRouter()

# Global storage for job streams
job_data: Dict[str, MemoryObjectSendStream] = {}


class ExecuteSelectedRequest(NDIFRequest):
    completion: Completion
    tokens: list[Token]
    model: str


class ExecutePairRequest(NDIFRequest):
    source: Completion
    destination: Completion
    model: str


class CompletionResponse(BaseModel):
    ids: list[int]
    values: list[float]


class ExecutePairResponse(NDIFRequest):
    source: CompletionResponse
    destination: CompletionResponse


def _execute_selected(
    state, execute_request
):
    idxs = [token.idx for token in execute_request.tokens]
    model = state.get_model(execute_request.model)

    prompt = execute_request.completion.prompt

    with model.wrapped_trace(prompt):
        logits = model.lm_head.output

        logits = logits[0, idxs, :].softmax(dim=-1)
        values_indices = t.sort(logits, dim=-1, descending=True)

        values = values_indices[0].save()
        indices = values_indices[1].save()

    return values, indices


async def process_execute_selected_background(
    execute_request: ExecuteSelectedRequest,
    state,
    send_stream: MemoryObjectSendStream,
):
    """Background task to process execute selected computation"""
    async with use_send_stream(send_stream):
        # Send status update
        await send_stream.send(
            {
                "type": "status",
                "message": "Starting computation...",
            }
        )

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

        # Send final result
        await send_stream.send(
            {
                "type": "result",
                "data": results,
            }
        )

        job_data.pop(execute_request.job_id, None)


async def process_execute_pair_background(
    execute_request: ExecutePairRequest,
    state,
    send_stream: MemoryObjectSendStream,
):
    """Background task to process execute pair computation"""
    async with use_send_stream(send_stream):
        # Send status update
        await send_stream.send(
            {
                "type": "status",
                "message": "Starting pair computation...",
            }
        )

        raw_values, raw_indices = await asyncio.to_thread(
            _execute_pair, state, execute_request
        )

        def round_results(values, indices):
            # Round values to 2 decimal places
            idx_values = t.round(values * 100) / 100
            nonzero = idx_values > 0

            nonzero_values = values[nonzero].tolist()
            nonzero_indices = indices[nonzero].tolist()

            return {"ids": nonzero_indices, "values": nonzero_values}

        results = {
            "source": round_results(raw_values[0], raw_indices[0]),
            "destination": round_results(raw_values[1], raw_indices[1]),
        }

        # Send final result
        await send_stream.send(
            {
                "type": "result",
                "data": results,
            }
        )

        job_data.pop(execute_request.job_id, None)


@router.post("/get-execute-selected")
async def get_execute_selected(
    execute_request: ExecuteSelectedRequest, request: Request
):
    """Start execute selected computation as background task"""
    # Create memory object stream
    send_stream, receive_stream = anyio.create_memory_object_stream()

    # Store the receive stream for later retrieval
    job_data[execute_request.job_id] = receive_stream

    # Start background task without waiting
    asyncio.create_task(
        process_execute_selected_background(
            execute_request, request.app.state.m, send_stream
        )
    )

@router.get("/listen-execute-selected/{job_id}")
async def listen_execute_selected(job_id: str, request: Request):
    """Listen for execute selected results via SSE"""
    receive_stream = job_data.get(job_id)

    if not receive_stream:
        # Return error if job not found
        async def error_stream():
            yield format_sse_event(
                {"type": "error", "message": "Job not found"}
            )

        return StreamingResponse(
            error_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
            },
        )

    return StreamingResponse(
        stream_from_memory_object(receive_stream),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Cache-Control",
        },
    )


def _execute_pair(
    state, execute_request
):
    model = state.get_model(execute_request.model)

    prompts = [
        execute_request.source.prompt,
        execute_request.destination.prompt,
    ]

    with model.wrapped_trace(prompts):
        logits = model.lm_head.output

        logits = logits[:, -1, :].softmax(dim=-1)
        values_indices = t.sort(logits, dim=-1, descending=True)

        raw_values = values_indices[0].save()
        raw_indices = values_indices[1].save()

    return raw_values, raw_indices


@router.post("/get-execute-pair")
async def get_execute_pair(
    execute_request: ExecutePairRequest, request: Request
):
    """Start execute pair computation as background task"""
    # Create memory object stream
    send_stream, receive_stream = anyio.create_memory_object_stream()

    # Store the receive stream for later retrieval
    job_data[execute_request.job_id] = receive_stream

    # Start background task without waiting
    asyncio.create_task(
        process_execute_pair_background(
            execute_request, request.app.state.m, send_stream
        )
    )


@router.get("/listen-execute-pair/{job_id}")
async def listen_execute_pair(job_id: str, request: Request):
    """Listen for execute pair results via SSE"""
    receive_stream = job_data.get(job_id)

    if not receive_stream:
        # Return error if job not found
        async def error_stream():
            yield format_sse_event(
                {"type": "error", "message": "Job not found"}
            )

        return StreamingResponse(
            error_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
            },
        )

    return StreamingResponse(
        stream_from_memory_object(receive_stream),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Cache-Control",
        },
    )
