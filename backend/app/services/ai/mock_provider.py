from __future__ import annotations

from app.schemas.domain import InspectionRecord
from app.services.ai.base import AIProvider


class MockProvider(AIProvider):
    def transcribe_audio(self, *, file_name: str, room_name: str, property_address: str) -> str:
        return (
            f"Walk-through note for {room_name} at {property_address}: the clerk described a calm sweep of the room, "
            f"called out minor cosmetic wear, and confirmed that the key fixtures shown in {file_name} were visible."
        )

    def describe_images(
        self,
        *,
        file_name: str,
        room_name: str,
        item_name: str,
        ai_hints: list[str],
        property_address: str,
    ) -> str:
        hint_fragment = ", ".join(ai_hints[:2]) if ai_hints else item_name.lower()
        return (
            f"{item_name} in {room_name} at {property_address} shows minor scuff marks and light everyday wear near "
            f"{hint_fragment}. No structural damage is visible in {file_name}, and the finish appears serviceable for check-in reporting."
        )

    def generate_report(self, *, inspection: InspectionRecord) -> str:
        confirmed_items = sum(room.items_confirmed for room in inspection.rooms)
        total_items = sum(room.items_total for room in inspection.rooms)
        return (
            f"Inspection summary for {inspection.property_address}: {confirmed_items} of {total_items} checklist items "
            f"have been reviewed across {len(inspection.rooms)} rooms. The overall record presents as a standard "
            f"lettings inventory with routine cosmetic wear notes and no major structural concerns flagged in the current draft."
        )
