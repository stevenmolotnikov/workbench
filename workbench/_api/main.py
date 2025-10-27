from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import os

from .routes import lens, patch, models, perplex
from .state import AppState

from dotenv import load_dotenv; load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)


ALLOWED_ORIGINS = [
    # Local development
    "http://localhost:3000",
    # Prod
    "https://workbench.ndif.us"
]

ALLOWED_ORIGIN_REGEX = (
    r"^https://workbench-env[a-z0-9\-]*\.vercel\.app$"  # dev/staging previews
    if os.environ.get('ENVIRONMENT') != "prod"
    else None  # in prod, rely on the fixed list above
)


def fastapi_app():
    app = FastAPI()

    app.add_middleware(
        CORSMiddleware,
        allow_origins=ALLOWED_ORIGINS,
        allow_origin_regex=ALLOWED_ORIGIN_REGEX,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
        max_age=3600,
    )

    app.include_router(lens, prefix="/lens")
    app.include_router(patch, prefix="/patch")
    app.include_router(models, prefix="/models")
    app.include_router(perplex, prefix="/perplex")

    app.state.m = AppState()

    return app


app = fastapi_app()
