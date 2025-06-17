from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware

from .api import lens, patch, models
from .state import AppState

def fastapi_app(remote: bool = False, config_path: str = "models.local.toml"):
    app = FastAPI()

    allowed_origins = []
    if remote:
        allowed_origins.append("https://interp-workbench.vercel.app")
    else:
        allowed_origins.append("http://localhost:3000")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
        max_age=3600,
    )    

    app.include_router(lens, prefix="/api")
    app.include_router(patch, prefix="/api")
    app.include_router(models, prefix="/api")

    app.state.m = AppState(config_path)

    @app.get("/models")
    async def get_models():
        config = app.state.m.get_config()
        return config.get_model_list()

    return app