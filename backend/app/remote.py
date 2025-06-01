import modal

from .app import _fastapi_app

app = modal.App(name="nnsight-backend")
image = (
    modal.Image.debian_slim()
    .pip_install("fastapi==0.115.6")
    .pip_install("nnsight==0.4.6")
    .add_local_file("app/local_config.toml", remote_path="/root/app/config.toml")
)

@app.function(
    image=image,
    secrets=[modal.Secret.from_name("ndif"), modal.Secret.from_name("hf")],
)
@modal.concurrent(max_inputs=50)
@modal.asgi_app()
def fastapi_app():
    return _fastapi_app()