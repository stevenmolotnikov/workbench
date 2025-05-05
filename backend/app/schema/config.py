from typing import Dict, List

from pydantic import BaseModel


class ModelConfig(BaseModel):
    """Configuration for an individual model."""

    name: str
    serve: bool
    chat: bool
    rename: Dict[str, str]


class ModelsConfig(BaseModel):
    """Root configuration containing all models."""

    models: Dict[str, ModelConfig]

    def get_model_list(self) -> List[str]:
        """Get list of models that are served and if they are chat or base."""
        return [
            {
                "name": model.name,
                "type": "chat" if model.chat else "base",
            }
            for model in self.models.values()
            if model.serve
        ]
