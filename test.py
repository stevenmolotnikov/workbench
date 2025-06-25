# %%

from transformers import AutoTokenizer

tokenizer = AutoTokenizer.from_pretrained("openai-community/gpt2")

print(tokenizer.encode("Jack and Annie went to the store."))
print(tokenizer.encode("Hello world."))