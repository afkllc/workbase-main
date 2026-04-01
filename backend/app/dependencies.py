from functools import lru_cache

from fastapi import Request

from app.config import AI_PROVIDER
from app.services.ai import AIProvider, GroqProvider, MockProvider
from app.services.store import InspectionStore


def get_store(request: Request) -> InspectionStore:
    return request.app.state.store


@lru_cache
def _provider_factory() -> AIProvider:
    if AI_PROVIDER == "groq":
        return GroqProvider()
    return MockProvider()


def get_ai_provider() -> AIProvider:
    return _provider_factory()
