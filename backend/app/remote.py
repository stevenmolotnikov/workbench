import modal

from .main import fastapi_app

dependencies = [
    "fastapi==0.115.6",
    "git+https://github.com/ndif-team/nnsight.git@main"
]

app = modal.App(name="interp-workbench")
image = (
    modal.Image.debian_slim()
    .apt_install("git") # Required for building nnsight from source
    .pip_install(*dependencies)
    .add_local_file("app/local_config.toml", remote_path="/root/app/config.toml")
)

@app.function(
    image=image,
    secrets=[modal.Secret.from_name("ndif"), modal.Secret.from_name("hf")],
)
@modal.concurrent(max_inputs=50)
@modal.asgi_app()
def modal_app():
    return fastapi_app(True, "config.toml")