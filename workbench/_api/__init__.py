import nnsight
from .backend import RemoteBackend

# Patch in a backend which doesn't default to the NDIF CONFIG.API.JOB_ID
nnsight.intervention.backends.RemoteBackend = RemoteBackend

# Temp 0.5 pre-release dev deployment
from .setup import _