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
from fastapi import Request


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


class ExceptionWrappingSendStream:
    def __init__(self, send_stream: MemoryObjectSendStream):
        self._send_stream = send_stream
        self._started = False
        self._completed = False

    async def send(self, data):
        """Send data with automatic exception handling"""
        try:
            # Send startup message on first use
            if not self._started:
                await self._send_stream.send(
                    {
                        "type": "status",
                        "message": "Starting computation...",
                    }
                )
                self._started = True

            await self._send_stream.send(data)
        except ConnectionError:
            await self._send_error("NDIF connection error")
        except Exception as e:
            await self._send_error(f"Processing error: {str(e)}")

    async def complete(self):
        """Send completion signal"""
        if not self._completed:
            try:
                await self._send_stream.send({"type": "complete"})
                self._completed = True
            except anyio.ClosedResourceError:
                pass

    async def _send_error(self, message: str):
        """Send error message"""
        try:
            await self._send_stream.send({"type": "error", "message": message})
        except:
            pass  # Best effort

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if exc_type is None:
            await self.complete()
        else:
            await self._send_error(f"Processing error: {str(exc_val)}")


class JobManager:
    def __new__(cls):
        if not hasattr(cls, "instance"):
            cls.instance = super(JobManager, cls).__new__(cls)
        return cls.instance

    def __init__(self):
        self.job_data: dict[str, MemoryObjectReceiveStream] = {}

    def create_job(
        self, endpoint_request: Any, background_fn: Callable, request: Request
    ):
        job_id = str(uuid.uuid4())

        send_stream, receive_stream = anyio.create_memory_object_stream()
        self.job_data[job_id] = receive_stream

        wrapped_send_stream = ExceptionWrappingSendStream(send_stream)

        task = asyncio.create_task(
            background_fn(
                endpoint_request, request.app.state.m, wrapped_send_stream
            )
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
