from nnsight import LanguageModel
from nnsight.intervention.backends import RemoteBackend

def make_backend(model: LanguageModel, job_id: str | None = None):
    """Create a new backend object. LanguageModel does not instantiate a new object for each request
    so this needs to be done manually to prevent conflicting jobs."""
    return RemoteBackend(
        job_id=job_id, blocking=False, model_key=model.to_model_key()
    )