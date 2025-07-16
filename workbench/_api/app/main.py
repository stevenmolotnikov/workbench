from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .api import lens, patch, models
from .state import AppState


ALLOWED_ORIGINS = [
    "https://interp-workbench.vercel.app",
    "http://localhost:3000",
    "http://0.0.0.0:3000"
]


def fastapi_app():
    app = FastAPI()

    app.add_middleware(
        CORSMiddleware,
        allow_origins=ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
        max_age=3600,
    )

    app.include_router(lens, prefix="/lens")
    app.include_router(patch, prefix="/api")
    app.include_router(models, prefix="/models")

    app.state.m = AppState()

    @app.get("/models")
    async def get_models():
        config = app.state.m.get_config()
        return config.get_model_list()

    class TokenizeRequest(BaseModel):
        text: list[str] = []  # Make optional with default empty list
        add_special_tokens: bool = True
        model: str
        operation: str = "tokenize"  # Added to support different operations
        token_ids: list[int] = None  # For decode operation

    @app.post("/tokenize")
    async def tokenize(request: TokenizeRequest):
        tok = app.state.m.get_model(request.model).tokenizer
        
        if request.operation == "decode":
            # Decode token IDs to text
            if not request.token_ids:
                return {"error": "No token IDs provided for decode operation"}
            
            decoded_tokens = [tok.decode([token_id]) for token_id in request.token_ids]
            return {"decoded_tokens": decoded_tokens}
        
        # Default tokenize operation
        if len(request.text) == 1:
            # Single text input
            text_to_encode = request.text[0]
            token_ids = tok.encode(
                text_to_encode, add_special_tokens=request.add_special_tokens
            )
            
            # Decode each token to get its text representation
            decoded_tokens = [tok.decode([token_id]) for token_id in token_ids]
            return {
                "token_ids": token_ids,
                "tokens": [
                    {"id": token_id, "text": decoded_text, "idx": idx}
                    for idx, (token_id, decoded_text) in enumerate(zip(token_ids, decoded_tokens))
                ]
            }
        else:
            # Multiple text inputs - process each separately
            results = []
            for text in request.text:
                text_token_ids = tok.encode(text, add_special_tokens=request.add_special_tokens)
                decoded_tokens = [tok.decode([token_id]) for token_id in text_token_ids]
                results.append({
                    "token_ids": text_token_ids,
                    "tokens": [
                        {"id": token_id, "text": decoded_text, "idx": idx}
                        for idx, (token_id, decoded_text) in enumerate(zip(text_token_ids, decoded_tokens))
                    ]
                })
            return {"results": results}

    return app


app = fastapi_app()
