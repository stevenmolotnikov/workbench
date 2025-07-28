import os
import tomllib
from fastapi import Request

from nnsight import LanguageModel, CONFIG
from pydantic import BaseModel

from . import ENV, ROOT_DIR

class ModelConfig(BaseModel):
    """Configuration for an individual model."""

    name: str
    chat: bool
    rename: dict[str, str]
    config: dict[str, int | str]

class ModelsConfig(BaseModel):
    """Root configuration containing all models."""

    remote: bool
    callback_url: str
    
    models: dict[str, ModelConfig]

    def get_model_list(self) -> list[dict[str, str]]:
        """Get list of models that are served and if they are chat or base."""
        return [
            {
                "name": model.name,
                "type": "chat" if model.chat else "base",
                "n_layers" : model.config["n_layers"],
            }
            for model in self.models.values()
        ]

class AppState:
    def __init__(self):
        # Set NDIF key
        CONFIG.set_default_api_key(ENV["NDIF_API_KEY"])

        # Defaults
        self.models: dict[str, LanguageModel] = {}
        self.remote = False

        self.config = self._load()

    def get_model(self, model_name: str):
        return self.models[model_name]

    def get_config(self):
        return self.config
    
    def __getitem__(self, model_name: str):
        return self.get_model(model_name)

    def _load(self):
        config_path = os.path.join(ROOT_DIR, "models.toml")

        with open(config_path, "rb") as f:
            config = ModelsConfig(**tomllib.load(f))

        self.remote = config.remote

        for _, cfg in config.models.items():
            model = LanguageModel(
                cfg.name,
                rename=cfg.rename,
                device_map="cpu",
                dispatch=not self.remote,
            )

            model.config.update(cfg.config)
            self.models[cfg.name] = model

        return config

def get_state(request: Request):
    return request.app.state.m