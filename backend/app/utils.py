import httpx

async def send_update(callback_url: str, response_body: dict):
    async with httpx.AsyncClient() as client:
        try:
            await client.post(callback_url, json=response_body)
        except Exception as e:
            print(f"Failed to send update: {e}")
