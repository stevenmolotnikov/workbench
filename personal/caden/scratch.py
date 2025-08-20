# %%


from nnsight import LanguageModel
import torch as t
from nnsight.intervention.backends.remote import RemoteBackend


model = LanguageModel("openai-community/gpt2")

with model.trace("hello, world", remote=True) as tracer:
    results = []
    for layer in model.model.layers:
        # Decode hidden state into vocabulary
        hidden_BLD = layer.output[0]
        logits_BLV = model.lm_head(model.model.ln_f(hidden_BLD))

        # Compute probabilities over the relevant tokens
        logits_V = logits_BLV[0, -1, :]

        probs_V = t.nn.functional.softmax(logits_V, dim=-1)

        # Gather probabilities over the predicted tokens
        target_ids_tensor = t.tensor([1,2,3]).to(probs_V.device)
        target_probs_X = t.gather(
            probs_V, 0, target_ids_tensor
        )

        results.append(target_probs_X)
    results.save()
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
