import os
import tomllib
from typing import Dict

from nnsight import LanguageModel

from .schema import ModelsConfig

class AppState:
    def __init__(self):
        self._login()
        self.models: Dict[str, LanguageModel] = {}
        self.config = self._load()

    def _login(self):
        """Set NDIF API key."""
        from nnsight import CONFIG

        # ndif_key = "018cf72e1e3b427f8067e4bf4d9c0aac"
        # ndif_key = modal.Secret.from_name("ndif")

        CONFIG.set_default_api_key(os.environ["NDIF_KEY"])

    def get_model(self, model_name: str):
        return self.models[model_name]

    def get_config(self):
        return self.config
    
    def _load(self):
        with open("/root/config.toml", "rb") as f:
            config = ModelsConfig(**tomllib.load(f))

        for _, cfg in config.models.items():
            # Load model if served
            if cfg.serve:
                model = LanguageModel(cfg.name, rename=cfg.rename, token=os.environ["HF_TOKEN"])
                self.models[cfg.name] = model

        return config
