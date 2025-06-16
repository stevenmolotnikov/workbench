#!/usr/bin/env python3
from aws_cdk import App, Environment
from ecs_stack import NDIFEcsStack
from dev import dev_environment

AWS_ACCOUNT_ID = "797161732516"  # Your 12-digit AWS account ID
AWS_REGION = "us-east-1"        
# Your desired AWS region  
env = Environment(
    account=AWS_ACCOUNT_ID,
    region=AWS_REGION
)
app = App()

# You can now create multiple stacks with different names
# Example: Creating stacks for different environments or versions
NDIFEcsStack(
    app, 
    f"InterpWorkbench-{dev_environment.name}",  # Stack name includes environment name
    env=env,
    environment=dev_environment, 
    ssh_key_name="DevKeyPair"
)

# Example of how to deploy another stack with a different name
# Uncomment and modify as needed:
# from prod import prod_environment
# NDIFEcsStack(
#     app, 
#     f"NDIFEcsStack-{prod_environment.name}",
#     env=env,
#     environment=prod_environment, 
#     ssh_key_name="ProdKeyPair"
# )

app.synth() 