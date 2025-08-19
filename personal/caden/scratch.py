# %%


from nnsight import LanguageModel

import nnsight
nnsight.CONFIG.set_default_api_key("")
nnsight.CONFIG.API.HOST = "dev-nlb-5bbd7ae7fcd3eea2.elb.us-east-1.amazonaws.com:8001"
nnsight.CONFIG.API.SSL = False
model = LanguageModel("openai-community/gpt2")


import torch as t

from nnsight import LanguageModel
from nnsight.intervention.backends.remote import RemoteBackend

def make_backend(model: LanguageModel | None = None, job_id: str | None = None):
    return RemoteBackend(
        job_id=job_id, blocking=False, model_key=model.to_model_key() if model is not None else None
    )

import nnsight as ns

with model.trace(
    "hello, world",
    remote=True,
    backend=make_backend(model)
) as tracer:
    results = []
    logits_BLV = model.lm_head.output

    logits_LV = logits_BLV[0, [0], :].softmax(dim=-1)
    values_LV_indices_LV = t.sort(logits_LV, dim=-1, descending=True)

    results.append(values_LV_indices_LV[0])
    results.append(values_LV_indices_LV[1])

    results.save()

# %%

backend = make_backend(model, job_id=tracer.backend.job_id)
results = backend()

# %%
len(results['results'])

# %%
