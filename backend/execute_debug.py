# %%

from nnsight import LanguageModel

model = LanguageModel("meta-llama/Meta-Llama-3.1-8B")

# %%

tok = model.tokenizer

prompt = "hello, my name is caden"
tokens = tok.encode(prompt)
print(tokens, len(tokens))

# %%

import torch as t
for i in range(10):
    with model.trace(prompt, remote=True):
        logits = model.lm_head.output

        logits = logits[0,len(tokens),:].softmax(dim=-1)
        values_indices = t.sort(logits, dim=-1, descending=True)

        values = values_indices[0].save()
        indices = values_indices[1].save()
