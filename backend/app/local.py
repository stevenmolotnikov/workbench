from .app import _fastapi_app

if __name__ == "__main__":
    import argparse
    import uvicorn

    parser = argparse.ArgumentParser()
    parser.add_argument("--config_path", type=str, required=True)
    parser.add_argument("--reload", action="store_true")
    args = parser.parse_args()

    uvicorn.run(_fastapi_app(args.config_path), host="0.0.0.0", port=8000)
