from __future__ import annotations

from abc import ABC, abstractmethod

from app.schemas.domain import InspectionRecord


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
    ) -> str:
        raise NotImplementedError

    @abstractmethod
    def generate_report(self, *, inspection: InspectionRecord) -> str:
        raise NotImplementedError
