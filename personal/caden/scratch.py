# %%


from nnsight import LanguageModel
import torch as t
from nnsight.intervention.backends.remote import RemoteBackend

import nnsight

nnsight.CONFIG.set_default_api_key("")
nnsight.CONFIG.API.HOST = (
    "dev-nlb-5bbd7ae7fcd3eea2.elb.us-east-1.amazonaws.com:8001"
)
nnsight.CONFIG.API.SSL = False
model = LanguageModel("openai-community/gpt2")


with model.trace("hello, world", remote=True, blocking=False) as tracer:
    results = []
    logits_BLV = model.lm_head.output

    logits_LV = logits_BLV[0, [0], :].softmax(dim=-1)
    values_LV_indices_LV = t.sort(logits_LV, dim=-1, descending=True)

    results.append(values_LV_indices_LV[0])
    results.append(values_LV_indices_LV[1])

    results.save()

# %%

backend = RemoteBackend(
    job_id=tracer.backend.job_id,
    blocking=False,
    model_key=model.to_model_key()
)
results = backend()

# %%
len(results["results"])

# %%
