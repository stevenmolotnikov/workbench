import modal

from .main import fastapi_app

dependencies = [
    "fastapi==0.115.6",
    "git+https://github.com/ndif-team/nnsight.git@caden",
    "httpx==0.28.1"
]

config_path = "/Users/caden/Programming/interp-workbench/workbench/_api/_model_config_examples/ndif_remote_config.toml"
app = modal.App(name="interp-workbench")
image = (
    modal.Image.debian_slim()
    .apt_install("git") # Required for building nnsight from source
    .pip_install(*dependencies)
    .add_local_file(config_path, remote_path="/root/app/config.toml")
)

@app.function(
    image=image,
    secrets=[modal.Secret.from_name("ndif"), modal.Secret.from_name("hf")],
    scaledown_window=120
)
@modal.concurrent(max_inputs=50)
@modal.asgi_app()
def modal_app():
    return fastapi_app(True, "/root/app/config.toml")