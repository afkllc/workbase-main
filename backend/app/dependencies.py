from fastapi import HTTPException, Request

from app.config import (
    get_ai_provider_name,
    get_verba_api_base_url,
    get_verba_api_key,
    get_verba_capture_character,
    get_verba_report_character,
)
from app.services.ai import AIProvider, AIProviderConfigurationError, AIProviderError, MockProvider, VerbaProvider
from app.services.store import InspectionStore


def get_store(request: Request) -> InspectionStore:
    return request.app.state.store


def _build_verba_provider() -> AIProvider:
    api_key = get_verba_api_key()
    capture_character = get_verba_capture_character()
    report_character = get_verba_report_character()
    missing = [
        name
        for name, value in (
            ("VERBA_API_KEY", api_key),
            ("VERBA_CAPTURE_CHARACTER", capture_character),
            ("VERBA_REPORT_CHARACTER", report_character),
        )
        if not value
    ]
    if missing:
        raise AIProviderConfigurationError(
            f"AI_PROVIDER='verba' requires these backend env vars: {', '.join(missing)}"
        )
    return VerbaProvider(
        api_base_url=get_verba_api_base_url(),
        api_key=api_key,
        capture_character=capture_character,
        report_character=report_character,
    )


def get_ai_provider() -> AIProvider:
    provider_name = get_ai_provider_name()
    try:
        if provider_name == "mock":
            return MockProvider()

        if provider_name == "verba":
            return _build_verba_provider()

        raise AIProviderConfigurationError(
            f"Unsupported AI_PROVIDER={provider_name!r}. Use 'mock' or 'verba'."
        )
    except AIProviderError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.public_detail) from exc
