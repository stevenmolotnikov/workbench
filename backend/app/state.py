import os
import tomllib
import types
from typing import Dict
from functools import partial

from nnsight import LanguageModel, CONFIG
from nnsight.intervention.backends.callback import CallbackBackend

from .schema.config import ModelsConfig


def process_name(name):
    """Fix named_modules names."""
    if name != "":
        assert name.startswith(".")
    return name[1:]


def _wrapped_trace(self, *args, callback_url: str, remote: bool, **kwargs):
    backend = None

    if remote:
        backend = CallbackBackend(
            callback_url, self.to_model_key(), blocking=True
        )

    return self.trace(*args, backend=backend, **kwargs)


class AppState:
    def __init__(self, config_path: str):
        # Set NDIF key
        CONFIG.set_default_api_key(os.environ["NDIF_API_KEY"])

        # Defaults
        self.models: Dict[str, LanguageModel] = {}
        self.remote = False

        self.config = self._load(config_path)

    def get_model(self, model_name: str):
        return self.models[model_name]

    def get_config(self):
        return self.config

    def _load(self, config_path: str):
        current_dir = os.path.dirname(os.path.abspath(__file__))
        config_path = os.path.join(current_dir, config_path)

        with open(config_path, "rb") as f:
            config = ModelsConfig(**tomllib.load(f))

        remote = config.remote
        next_public_base_url = config.next_public_base_url
        callback_url = f"{next_public_base_url}{config.callback_url}"

        hf_token = os.environ.get("HF_TOKEN", None)

        for _, cfg in config.models.items():
            model = LanguageModel(
                cfg.name,
                rename=cfg.rename,
                token=hf_token,
                device_map="cpu",
                dispatch=not remote,
            )

            wrapped_trace = partial(
                _wrapped_trace, remote=remote, callback_url=callback_url
            )
            model.wrapped_trace = types.MethodType(wrapped_trace, model)
            
            self.models[cfg.name] = model

        return config
