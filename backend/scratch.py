from nnsight import LanguageModel

rename = {
    "layers" : 'h',
    "self_attn" : "attn"
}
model = LanguageModel("meta-llama/Meta-Llama-3.1-8B", rename=rename)

print(model.model.h[0].attn)
# def process_name(name):
#     if name != "":
#         assert name.startswith(".")
#     return name[1:]

# module_dict = {process_name(name):module for name, module in model.named_modules()}

# def get_module(name):
#     return module_dict[name]

# # %%


