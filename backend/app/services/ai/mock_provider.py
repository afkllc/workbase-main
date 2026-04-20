from __future__ import annotations

from app.schemas.domain import InspectionRecord
from app.services.ai.base import AIProvider, ImageAssessment


def _pick_mock_condition(file_name: str, ai_hints: list[str]) -> tuple[str, str]:
    lowered = f"{file_name} {' '.join(ai_hints)}".lower()
    if any(token in lowered for token in ("broken", "crack", "chip", "damage", "stain", "fray", "missing")):
        return "poor", "medium"
    if any(token in lowered for token in ("scuff", "wear", "mark", "scratch", "faded")):
        return "fair", "high"
    return "good", "high"


class MockProvider(AIProvider):
    def transcribe_audio(self, *, file_name: str, room_name: str, property_address: str) -> str:
        return (
            f"Walk-through note for {room_name} at {property_address}: the clerk described a calm sweep of the room, "
            f"called out minor cosmetic wear, and confirmed that the key fixtures shown were visible."
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
        hint_fragment = ", ".join(ai_hints[:2]) if ai_hints else item_name.lower()
        condition, confidence = _pick_mock_condition(file_name, ai_hints)
        if condition == "poor":
            description = (
                f"The {item_name} in the {room_name} shows visible deterioration around {hint_fragment}. "
                "The finish appears materially worn and should be reviewed."
            )
        elif condition == "fair":
            description = (
                f"The {item_name} in the {room_name} shows light scuffs and routine wear near {hint_fragment}. "
                "No obvious structural damage is visible."
            )
        else:
            description = (
                f"The {item_name} in the {room_name} appears intact and generally serviceable around {hint_fragment}. "
                "Only minor everyday wear is suggested from the current context."
            )
        _ = image_url
        return ImageAssessment(
            condition=condition,  # type: ignore[arg-type]
            confidence=confidence,  # type: ignore[arg-type]
            description=description,
        )

    def generate_report(self, *, inspection: InspectionRecord) -> str:
        confirmed_items = sum(room.items_confirmed for room in inspection.rooms)
        total_items = sum(room.items_total for room in inspection.rooms)
        return (
            f"Inspection summary for {inspection.property_address}: {confirmed_items} of {total_items} checklist items "
            f"have been reviewed across {len(inspection.rooms)} rooms. The overall record presents as a standard "
            f"lettings inventory with routine cosmetic wear notes and no major structural concerns flagged in the current draft."
        )
