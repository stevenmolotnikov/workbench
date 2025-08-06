from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes import lens, patch, models
from .state import AppState


ALLOWED_ORIGINS = [
    # Vercel prod deployment
    "https://interp-workbench.vercel.app",
    # Vercel dev deployment
    "https://interp-workbench-git-dev-cadentjs-projects.vercel.app",
    # Local development
    "http://localhost:3000"
]


def fastapi_app():
    app = FastAPI()

    app.add_middleware(
        CORSMiddleware,
        allow_origins=ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
        max_age=3600,
    )

    app.include_router(lens, prefix="/lens")
    app.include_router(patch, prefix="/patch")
    app.include_router(models, prefix="/models")

    app.state.m = AppState()

    return app


app = fastapi_app()
