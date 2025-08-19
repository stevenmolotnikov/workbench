# %%


from nnsight import LanguageModel
from nnsight import CONFIG

CONFIG.set_default_api_key("107481b09293453caa83de25c72c9fbf")

model = LanguageModel("openai-community/gpt2")
# %%

def decode(x):
    return model.lm_head(model.transformer.ln_f(x))

def check():
    with model.generate("hello, world", max_new_tokens=200, remote=True, blocking=False) as tracer:
        test = decode(model.transformer.h[0].output[0])

    return test

a = check()

# %%

a