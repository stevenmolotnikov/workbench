from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import lens, tokenize
from .state import AppState

def _fastapi_app():
    app = FastAPI()

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["https://nnterface.vercel.app", "http://localhost:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
        max_age=3600,
    )

    app.include_router(lens, prefix="/api")
    app.include_router(tokenize, prefix="/api")

    app.state.m = AppState()

    @app.get("/models")
    async def models():
        config = app.state.m.get_config()
        return config.get_model_list()

    return app
