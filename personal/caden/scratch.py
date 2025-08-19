# %%


from nnsight import LanguageModel


model = LanguageModel("openai-community/gpt2")
# %%



with model.generate("hello, world", max_new_tokens=200, remote=True, blocking=False, job_id=None) as tracer:
    pass


# %%

tracer.backend.job_id
# %%
