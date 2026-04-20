from __future__ import annotations

import json
import re
from typing import Any
from urllib import error, request

from app.schemas.domain import InspectionRecord
from app.services.ai.base import (
    AIProvider,
    AIProviderConfigurationError,
    AIProviderResponseError,
    AIProviderUnavailableError,
    AIProviderUpstreamError,
    ImageAssessment,
)


class VerbaProvider(AIProvider):
    def __init__(
        self,
        *,
        api_base_url: str,
        api_key: str,
        capture_character: str,
        report_character: str,
    ) -> None:
        self._api_base_url = api_base_url.rstrip("/")
        self._api_key = api_key
        self._capture_character = capture_character
        self._report_character = report_character
        self._validate_configuration()

    def transcribe_audio(self, *, file_name: str, room_name: str, property_address: str) -> str:
        _ = (file_name, room_name, property_address)
        raise NotImplementedError(
            "Verba's public API documents text and image endpoints, but not a public audio transcription endpoint yet."
        )

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
        if not image_url:
            raise AIProviderUnavailableError(
                "Verba photo analysis requires PUBLIC_API_BASE_URL to be a publicly reachable HTTPS URL. "
                "Use Railway or an HTTPS tunnel for image analysis."
            )

        hint_text = ", ".join(ai_hints) if ai_hints else "none"
        prompt = (
            "Assess a single inspection item from the attached photo.\n"
            f"Property: {property_address}\n"
            f"Room: {room_name}\n"
            f"Item: {item_name}\n"
            f"Photo file name: {file_name}\n"
            f"Relevant item hints: {hint_text}\n\n"
            "Return JSON only with exactly these keys:\n"
            '{"condition":"good|fair|poor|damaged|na","confidence":"high|medium|low","description":"1-2 short UK English sentences"}\n'
            "Use condition='na' only if the image is too unclear or incomplete to assess.\n"
            "Do not wrap the JSON in markdown."
        )

        response = self._post_response(
            character=self._capture_character,
            message_content=[
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": image_url}},
            ],
            temperature=0.1,
            top_p=0.2,
            max_tokens=220,
        )
        payload = self._parse_json_object(self._extract_message_text(response))
        condition = str(payload.get("condition", "")).strip().lower()
        confidence = str(payload.get("confidence", "")).strip().lower()
        description = str(payload.get("description", "")).strip()

        if condition not in {"good", "fair", "poor", "damaged", "na"}:
            raise AIProviderResponseError("Verba returned an unsupported condition value for image analysis.")
        if confidence not in {"high", "medium", "low"}:
            raise AIProviderResponseError("Verba returned an unsupported confidence value for image analysis.")
        if not description:
            raise AIProviderResponseError("Verba returned an empty image description.")

        return ImageAssessment(
            condition=condition,  # type: ignore[arg-type]
            confidence=confidence,  # type: ignore[arg-type]
            description=description,
        )

    def generate_report(self, *, inspection: InspectionRecord) -> str:
        inspection_json = json.dumps(inspection.model_dump(mode="json"), ensure_ascii=True)
        prompt = (
            "Write a concise, factual inspection summary for a lettings-style inventory report.\n"
            "Use only the facts provided in the JSON.\n"
            "Do not invent issues, causes, blame, costs, or legal conclusions.\n"
            "Keep the output to 2-3 short paragraphs in plain text.\n\n"
            f"Inspection JSON:\n{inspection_json}"
        )

        response = self._post_response(
            character=self._report_character,
            message_content=prompt,
            temperature=0.2,
            top_p=0.35,
            max_tokens=900,
        )
        summary = self._extract_message_text(response).strip()
        if not summary:
            raise AIProviderResponseError("Verba returned an empty report summary.")
        return summary

    def _post_response(
        self,
        *,
        character: str,
        message_content: str | list[dict[str, Any]],
        temperature: float,
        top_p: float,
        max_tokens: int,
    ) -> dict[str, Any]:
        payload = {
            "character": character,
            "messages": [
                {
                    "role": "user",
                    "content": message_content,
                }
            ],
            "temperature": temperature,
            "top_p": top_p,
            "max_tokens": max_tokens,
            "tool_choice": "none",
            "stream": False,
        }
        body = json.dumps(payload).encode("utf-8")
        req = request.Request(
            f"{self._api_base_url}/v1/response",
            data=body,
            method="POST",
            headers={
                "Authorization": f"Bearer {self._api_key}",
                "Content-Type": "application/json",
            },
        )

        try:
            with request.urlopen(req, timeout=60) as response:
                return json.loads(response.read().decode("utf-8"))
        except error.HTTPError as exc:
            details = exc.read().decode("utf-8", errors="replace")
            if exc.code in {401, 403}:
                raise AIProviderConfigurationError(
                    "Verba rejected the configured credentials. Check VERBA_API_KEY and the verb slugs."
                ) from exc
            if exc.code == 429:
                raise AIProviderUpstreamError("Verba is rate limiting requests right now. Try again shortly.", status_code=503) from exc
            raise AIProviderUpstreamError(
                f"Verba request failed with status {exc.code}. {details[:180]}".strip(),
                status_code=502,
            ) from exc
        except error.URLError as exc:
            raise AIProviderUpstreamError(
                "Unable to reach the Verba API right now. Check network access or try again later.",
                status_code=503,
            ) from exc
        except json.JSONDecodeError as exc:
            raise AIProviderResponseError("Verba returned a non-JSON response.") from exc

    def _extract_message_text(self, response: dict[str, Any]) -> str:
        try:
            content = response["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError) as exc:
            raise AIProviderResponseError("Unexpected Verba response shape.") from exc
        return str(content).strip()

    def _parse_json_object(self, text: str) -> dict[str, Any]:
        cleaned = text.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
            cleaned = re.sub(r"\s*```$", "", cleaned)

        try:
            parsed = json.loads(cleaned)
        except json.JSONDecodeError:
            match = re.search(r"\{.*\}", cleaned, re.DOTALL)
            if not match:
                raise AIProviderResponseError("Verba did not return valid JSON for image analysis.") from None
            try:
                parsed = json.loads(match.group(0))
            except json.JSONDecodeError as exc:
                raise AIProviderResponseError("Verba returned malformed JSON for image analysis.") from exc

        if not isinstance(parsed, dict):
            raise AIProviderResponseError("Verba JSON payload must be an object.")
        return parsed

    def _validate_configuration(self) -> None:
        if self._looks_like_placeholder(self._api_key, {"vka_your_api_key", "your_verba_api_key"}):
            raise AIProviderConfigurationError(
                "VERBA_API_KEY is still using a placeholder value. Set a real key in backend/.env or Railway variables."
            )
        if self._looks_like_placeholder(
            self._capture_character,
            {"your_capture_verb_slug", "your_capture_character", "your_character_slug"},
        ):
            raise AIProviderConfigurationError(
                "VERBA_CAPTURE_CHARACTER is still using a placeholder value. Set the real capture verb slug."
            )
        if self._looks_like_placeholder(
            self._report_character,
            {"your_report_verb_slug", "your_report_character", "your_character_slug"},
        ):
            raise AIProviderConfigurationError(
                "VERBA_REPORT_CHARACTER is still using a placeholder value. Set the real report verb slug."
            )
        if not self._api_base_url.startswith("https://"):
            raise AIProviderConfigurationError("VERBA_API_BASE_URL must be an HTTPS URL.")

    def _looks_like_placeholder(self, value: str, placeholders: set[str]) -> bool:
        cleaned = value.strip()
        if not cleaned:
            return True
        return cleaned in placeholders
