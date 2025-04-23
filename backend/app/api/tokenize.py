from fastapi import APIRouter, Request

from ..schema import TokenizeRequest

router = APIRouter()


@router.post("/tokenize")
async def tokenize(tokenize_request: TokenizeRequest, request: Request):
    state = request.app.state.m
    
    tok = state.get_model(tokenize_request.model).tokenizer
    if isinstance(tokenize_request.text, list):
        formatted = tok.apply_chat_template(
            tokenize_request.text, tokenize=False, add_special_tokens=False
        )
        tokens = tok.batch_decode(tok.encode(formatted))
    else:
        tokens = tok.batch_decode(tok.encode(tokenize_request.text))
    return {"tokens": tokens}
