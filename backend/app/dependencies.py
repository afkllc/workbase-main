from functools import lru_cache
import warnings

from fastapi import Request

from app.config import AI_PROVIDER
from app.services.ai import AIProvider, MockProvider
from app.services.store import InspectionStore


def get_store(request: Request) -> InspectionStore:
    return request.app.state.store


@lru_cache
def _provider_factory() -> AIProvider:
    if AI_PROVIDER != "mock":
        warnings.warn(
            f"AI_PROVIDER={AI_PROVIDER!r} is not supported in this MVP build. Falling back to the mock provider.",
            stacklevel=2,
        )
    return MockProvider()


def get_ai_provider() -> AIProvider:
    return _provider_factory()
