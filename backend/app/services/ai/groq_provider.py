from __future__ import annotations

from groq import Groq

from app.schemas.domain import InspectionRecord
from app.services.ai.base import AIProvider


_NOT_ACTIVE_MESSAGE = "GroqProvider not active — set AI_PROVIDER=groq and add GROQ_API_KEY to enable"


class GroqProvider(AIProvider):
    def transcribe_audio(self, *, file_name: str, room_name: str, property_address: str) -> str:
        # Future implementation pattern:
        # client = Groq(api_key=os.environ["GROQ_API_KEY"])
        # transcript = client.audio.transcriptions.create(
        #     file=(file_name, audio_bytes),
        #     model="whisper-large-v3",
        # )
        # return transcript.text
        raise NotImplementedError(_NOT_ACTIVE_MESSAGE)

    def describe_images(
        self,
        *,
        file_name: str,
        room_name: str,
        item_name: str,
        ai_hints: list[str],
        property_address: str,
    ) -> str:
        # Future implementation pattern:
        # client = Groq(api_key=os.environ["GROQ_API_KEY"])
        # response = client.chat.completions.create(
        #     model="llama-3.2-11b-vision-preview",
        #     messages=[... image content ...],
        # )
        # NOTE: llama-3.1-8b-instant is text-only and must not be used for image inputs.
        # return response.choices[0].message.content
        _ = (Groq, file_name, room_name, item_name, ai_hints, property_address)
        raise NotImplementedError(_NOT_ACTIVE_MESSAGE)

    def generate_report(self, *, inspection: InspectionRecord) -> str:
        # Future implementation pattern:
        # client = Groq(api_key=os.environ["GROQ_API_KEY"])
        # response = client.chat.completions.create(
        #     model="llama-3.1-8b-instant",
        #     messages=[... structured inspection summary ...],
        # )
        # return response.choices[0].message.content
        _ = (Groq, inspection)
        raise NotImplementedError(_NOT_ACTIVE_MESSAGE)
