import os
import tomllib
import types
from functools import partial

from nnsight import LanguageModel, CONFIG
from pydantic import BaseModel

from ..ns_utils import wrapped_trace, wrapped_session
from .. import ENV, ROOT_DIR

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

    def _load(self):
        config_path = os.path.join(ROOT_DIR, "models.toml")

        with open(config_path, "rb") as f:
            config = ModelsConfig(**tomllib.load(f))

        remote = config.remote

        for _, cfg in config.models.items():
            model = LanguageModel(
                cfg.name,
                rename=cfg.rename,
                device_map="cpu",
                dispatch=not remote,
            )

            wrapped_trace_fn = partial(
                wrapped_trace, remote=remote
            )
            model.wrapped_trace = types.MethodType(wrapped_trace_fn, model)

            wrapped_session_fn = partial(
                wrapped_session, remote=remote
            )
            model.wrapped_session = types.MethodType(wrapped_session_fn, model)

            model.config.update(cfg.config)

            self.models[cfg.name] = model

        return config
