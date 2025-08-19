from .state import get_state

from nnsight import LanguageModel
from nnsight.intervention.backends.remote import RemoteBackend

def make_backend(model: LanguageModel | None = None, job_id: str | None = None):
    """Create a new backend object. LanguageModel does not instantiate a new object for each request
    so this needs to be done manually to prevent conflicting jobs."""

    state = get_state()
    if state.remote:
        return RemoteBackend(
            job_id=job_id, blocking=False, model_key=model.to_model_key() if model is not None else None
        )
    else:
        return None