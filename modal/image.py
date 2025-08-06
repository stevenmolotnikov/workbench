import os
import modal

dependencies = [
    "fastapi==0.115.6",
    "nnsight>=0.4.7",
    "python-dotenv>=1.0.1"
]

app = modal.App(name=os.environ.get("MODAL_APP_NAME", "interp-workbench"))
image = (
    modal.Image.debian_slim()
    .pip_install(*dependencies)
    .env({"ENVIRONMENT" : "dev"}) # Configures which models are loaded
    .add_local_dir("./workbench/_api", remote_path="/root/workbench/_api", ignore=["__pycache__"])
)

@app.function(
    image=image,
    secrets=[modal.Secret.from_name("ndif"), modal.Secret.from_name("hf")],
    scaledown_window=180
)
@modal.concurrent(max_inputs=50)
@modal.asgi_app()
def modal_app():
    from workbench._api.main import fastapi_app

    return fastapi_app()