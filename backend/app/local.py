from .app import _fastapi_app

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(_fastapi_app(), host="0.0.0.0", port=8000)
