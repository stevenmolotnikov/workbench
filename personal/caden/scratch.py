# %%


from nnsight import LanguageModel
import torch as t

model = LanguageModel("meta-llama/Llama-3.1-8B")

with model.trace("hello, world", remote=True) as tracer:
    output = model.model.layers[0].output

    if isinstance(output, tuple):
        output = output[0]

    print(output.shape)

# %%

import nnsight

nnsight.CONFIG.API.HOST

# %%

# %%

print(tracer.backend.job_id)

# %%

backend = RemoteBackend(
    job_id=tracer.backend.job_id,
    blocking=False,
    model_key=model.to_model_key()
)
results = backend()

# %%

path = "http://dev-nlb-5bbd7ae7fcd3eea2.elb.us-east-1.amazonaws.com:8001/response/{job_id}"
print(path.format(job_id=tracer.backend.job_id))

# %%
len(results["results"])

# %%
