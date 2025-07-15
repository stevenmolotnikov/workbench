import json
import anyio
import httpx
from anyio.streams.memory import MemoryObjectSendStream, MemoryObjectReceiveStream
from contextlib import asynccontextmanager

async def send_update(callback_url: str, response_body: dict):
    async with httpx.AsyncClient() as client:
        try:
            await client.post(callback_url, json=response_body)
        except Exception as e:
            print(f"Failed to send update: {e}")

def format_sse_event(data: dict, event_type: str = "data") -> str:
    """Format data as Server-Sent Event"""
    return f"event: {event_type}\ndata: {json.dumps(data)}\n\n"


async def stream_from_memory_object(
    receive_stream: MemoryObjectReceiveStream,
):
    """Convert MemoryObjectStream to SSE format"""
    try:
        async with receive_stream:
            async for data in receive_stream:
                if data.get("type") == "complete":
                    yield format_sse_event(data, "complete")
                    break
                else:
                    yield format_sse_event(data, "data")
    except anyio.ClosedResourceError:
        # Stream was closed, send completion
        yield format_sse_event({"type": "complete"}, "complete")



@asynccontextmanager
async def use_send_stream(send_stream: MemoryObjectSendStream):
    async with send_stream:
        try:
            yield send_stream
        except ConnectionError:
            await send_stream.send({
                "type": "error",
                "message": "NDIF connection error",
            })
        except Exception as e:
            await send_stream.send({
                "type": "error",
                "message": f"Processing error: {str(e)}",
            })
        finally:
            # Send completion and cleanup
            await send_stream.send({
                "type": "complete",
            })