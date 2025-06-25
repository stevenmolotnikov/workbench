import os
from dotenv import dotenv_values

def load_env(root_dir: str):
    env_path = os.path.join(root_dir, ".env")
    env = dotenv_values(env_path)
    return env