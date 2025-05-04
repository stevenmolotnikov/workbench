import os
import tomllib
from typing import Dict

from nnsight import LanguageModel, CONFIG

from .schema import ModelsConfig

class AppState:
    def __init__(self):
        self._login()
        self.models: Dict[str, LanguageModel] = {}
        self.config = self._load()

    def _login(self):
        CONFIG.set_default_api_key(os.environ["NDIF_KEY"])

    def get_model(self, model_name: str):
        return self.models[model_name]

    def get_config(self):
        return self.config

    def _load(self):
        current_dir = os.path.dirname(os.path.abspath(__file__))
        config_path = os.path.join(current_dir, "config.toml")
        
        with open(config_path, "rb") as f:
            config = ModelsConfig(**tomllib.load(f))

        for _, cfg in config.models.items():
            # Load model if served
            if cfg.serve:
                hf_token = os.environ["HF_TOKEN"]
                model = LanguageModel(
                    cfg.name, rename=cfg.rename, token=hf_token
                )
                self.models[cfg.name] = model

        return config
