from schema import (
    EnvironmentSchema,
    ServiceSchema,
    ContainerSchema,
    VolumeSchema,
    PortMappingSchema,
    ConfigSchema,
)


dev_environment = EnvironmentSchema(
    name="Dev",
    services=[
       
        ServiceSchema(
            name="WorkBenchBackend",
            instance_type="c7g.large",
            containers=[
                ContainerSchema(
                    name="WorkBenchBackend",
                    repo_id="797161732516.dkr.ecr.us-east-1.amazonaws.com/workbench:latest",
                    port_mappings=[
                        PortMappingSchema(
                            container_port=80,
                            host_port=80,
                            public=True,
                        )
                    ],
                    environment_variables={
                        "NDIF_API_KEY": "<key here>",
                        "HF_TOKEN": "<key here>"
                    },  
                ),
                
            ],
        ),
    ],
)
