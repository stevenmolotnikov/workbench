import os
import tomllib
from typing import Dict

from nnsight import LanguageModel, CONFIG

from .schema.config import ModelsConfig


def process_name(name):
    """Fix named_modules names."""
    if name != "":
        assert name.startswith(".")
    return name[1:]


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

        self.remote = config.remote
        hf_token = os.environ["HF_TOKEN"]

        for _, cfg in config.models.items():
            model = LanguageModel(
                cfg.name, rename=cfg.rename, token=hf_token
            )
            model = self._process_model(model)
            self.models[cfg.name] = model

        return config

    def _process_model(self, model):
        """Add a get_submodule method to the model. The existing 
        method returns a Torch module rather than an Envoy
        """

        module_dict = {
            process_name(name): module for name, module in model.named_modules()
        }

        def get_submodule(name):
            return module_dict[name]
        
        setattr(model, "get_submodule", get_submodule)

        return model