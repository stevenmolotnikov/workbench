import os
from pathlib import Path

from .config import load_env

environment = os.environ.get("ENVIRONMENT", "dev")
match environment:
    case "docker":
        ROOT_DIR = Path(__file__).parent.parent
    case "modal":
        ROOT_DIR = "/root/"
    case "dev":
        ROOT_DIR = Path(__file__).parent.parent.parent
    case _:
        raise ValueError(f"Invalid environment: {environment}")

ENV = load_env(ROOT_DIR)

os.environ["HF_TOKEN"] = ENV["HF_TOKEN"]

__all__ = ["ENV", "ROOT_DIR"]