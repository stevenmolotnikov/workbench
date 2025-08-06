import anyio
import asyncio
import json
import httpx
from anyio.streams.memory import (
    MemoryObjectSendStream,
    MemoryObjectReceiveStream,
)
from typing import Callable, Any
from fastapi.responses import StreamingResponse
import uuid
from contextlib import asynccontextmanager
from .state import AppState


async def send_update(callback_url: str, response_body: dict):
    async with httpx.AsyncClient() as client:
        try:
            await client.post(callback_url, json=response_body)
        except Exception as e:
            print(f"Failed to send update: {e}")


def format_sse_event(data: dict) -> str:
    """Format data as Server-Sent Event"""
    return f"data: {json.dumps(data)}\n\n"


async def stream_from_memory_object(
    receive_stream: MemoryObjectReceiveStream,
):
    """Convert MemoryObjectStream to SSE format"""
    try:
        async with receive_stream:
            async for data in receive_stream:
                if data.get("type") == "complete":
                    yield format_sse_event(data)
                    yield "data: [DONE]\n\n"
                    break
                else:
                    yield format_sse_event(data)
    except anyio.ClosedResourceError:
        # Stream was closed, send completion
        yield format_sse_event({"type": "complete"})
        yield "data: [DONE]\n\n"


@asynccontextmanager
async def use_send_stream(send_stream: MemoryObjectSendStream):
    try:
        async with send_stream:
            await send_stream.send(
                {
                    "type": "status",
                    "message": "Starting computation...",
                }
            )
            
            yield send_stream

            try:
                await send_stream.send({
                    "type": "complete",
                })
            except anyio.ClosedResourceError:
                pass  # Stream already closed
    except ConnectionError:
        async with send_stream:
            await send_stream.send({
                "type": "error",
                "message": "NDIF connection error",
            })
    except Exception as e:
        async with send_stream:
            await send_stream.send({
                "type": "error",
                "message": f"Processing error: {str(e)}",
            })


class JobManager:
    def __new__(cls):
        if not hasattr(cls, "instance"):
            cls.instance = super(JobManager, cls).__new__(cls)
        return cls.instance

    def __init__(self):
        self.job_data: dict[str, MemoryObjectReceiveStream] = {}

    def create_job(
        self, background_fn: Callable, endpoint_request: Any, state: AppState
    ):
        job_id = str(uuid.uuid4())

        send_stream, receive_stream = anyio.create_memory_object_stream()
        self.job_data[job_id] = receive_stream

        async def wrapped_background_fn(
            endpoint_request: Any,
            state: AppState,
        ):
            async with use_send_stream(send_stream):
                result = await background_fn(endpoint_request, state)
                await send_stream.send({
                    "type": "result",
                    "data": result,
                })

        task = asyncio.create_task(
            wrapped_background_fn(endpoint_request, state)
        )

        task.add_done_callback(lambda _: self.job_data.pop(job_id, None))

        return {"job_id": job_id}

    def get_job(self, job_id: str):
        receive_stream = self.job_data[job_id]

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


jobs = JobManager()
