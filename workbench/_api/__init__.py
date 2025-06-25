import os
from pathlib import Path

from .config import load_env

_is_docker = os.environ.get("ENVIRONMENT", "dev").lower() == "docker"
ROOT_DIR = Path(__file__).parent.parent if _is_docker else Path(__file__).parent.parent.parent
ENV = load_env(ROOT_DIR)

__all__ = ["ENV", "ROOT_DIR"]