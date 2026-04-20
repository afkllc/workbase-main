from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass

from app.schemas.domain import Condition, Confidence, InspectionRecord


@dataclass(frozen=True)
class ImageAssessment:
    condition: Condition
    confidence: Confidence
    description: str


class AIProviderError(Exception):
    status_code = 503
    public_detail = "The AI provider request failed."

    def __init__(self, public_detail: str | None = None, *, status_code: int | None = None) -> None:
        self.public_detail = public_detail or self.public_detail
        self.status_code = status_code or self.status_code
        super().__init__(self.public_detail)


class AIProviderConfigurationError(AIProviderError):
    status_code = 503
    public_detail = "The AI provider is not configured correctly."


class AIProviderUpstreamError(AIProviderError):
    status_code = 502
    public_detail = "The AI provider could not be reached."


class AIProviderResponseError(AIProviderError):
    status_code = 502
    public_detail = "The AI provider returned an invalid response."


class AIProviderUnavailableError(AIProviderError):
    status_code = 409
    public_detail = "The requested AI workflow is not available in the current environment."


class AIProvider(ABC):
    @abstractmethod
    def transcribe_audio(self, *, file_name: str, room_name: str, property_address: str) -> str:
        raise NotImplementedError

    @abstractmethod
    def describe_images(
        self,
        *,
        file_name: str,
        room_name: str,
        item_name: str,
        ai_hints: list[str],
        property_address: str,
        image_url: str | None = None,
    ) -> ImageAssessment:
        raise NotImplementedError

    @abstractmethod
    def generate_report(self, *, inspection: InspectionRecord) -> str:
        raise NotImplementedError
