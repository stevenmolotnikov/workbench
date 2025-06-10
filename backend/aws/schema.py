from typing import Dict, List, Optional
from pydantic import BaseModel


class VolumeSchema(BaseModel):
    
    container_path: str
    
    size: Optional[int] = 0
    name:Optional[str] = "Data"
    host_path: Optional[str] = "/data"
    mount_path: Optional[str] = "/dev/xvdb"
    type: Optional[str] = "GP3"
    
    
class PortMappingSchema(BaseModel):
    container_port: int
    host_port: int
    
    public: Optional[bool] = False


class ConfigSchema(BaseModel):
    bucket_path: str  # S3 bucket path like 'my-bucket/path/to/config'
    host_path: str  # Where to store on EC2 host
    
    name: Optional[str] = "Config"


class ContainerSchema(BaseModel):
    name: str
    repo_id: str
    
    environment_variables: Optional[Dict[str, str]] = {}
    command: Optional[List[str]] = []
    port_mappings: Optional[List[PortMappingSchema]] = []
    volumes: Optional[List[VolumeSchema]] = []
    configs: Optional[List[ConfigSchema]] = []  # New field for config files


class ServiceSchema(BaseModel):
    name: str
    containers: List[ContainerSchema]
    instance_type: str # Default to GPU instance


class EnvironmentSchema(BaseModel):
    name: str
    services: List[ServiceSchema]
