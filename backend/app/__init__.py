from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import modal

from .api import lens, tokenize
from .state import AppState

app = modal.App(name="nnsight-backend")
image = (
    modal.Image.debian_slim()
    .pip_install("fastapi==0.115.6")
    .pip_install("nnsight==0.4.5")
    .add_local_file("app/config.toml", remote_path="/root/config.toml")
)


@app.function(
    image=image,
    secrets=[modal.Secret.from_name("ndif"), modal.Secret.from_name("hf")],
)
@modal.concurrent(max_inputs=50)
@modal.asgi_app()
def fastapi_app():
    web_app = FastAPI()

    web_app.add_middleware(
        CORSMiddleware,
        allow_origins=["https://nnterface.vercel.app", "http://localhost:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
        max_age=3600,
    )

    web_app.include_router(lens, prefix="/api")
    web_app.include_router(tokenize, prefix="/api")

    web_app.state.m = AppState()

    @web_app.get("/models")
    async def models():
        config = web_app.state.m.get_config()
        return config.get_model_list()

    return web_app
