from __future__ import annotations

import json
import re
import sqlite3
from copy import deepcopy
from datetime import datetime
from itertools import cycle
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, status

from app.schemas.domain import (
    AnalysisSuggestion,
    CreateInspectionRequest,
    CreateTemplateRequest,
    EditableTemplateItem,
    EditableTemplateRoom,
    InspectionRecord,
    InspectionSections,
    InspectionSummary,
    ItemRecord,
    RoomRecord,
    TemplateItem,
    TemplateRoom,
    TemplateSchema,
    TemplateSummary,
    UpdateItemRequest,
    UpdateSectionsRequest,
    UpdateTemplateRequest,
)
from app.services.ai import AIProvider
from app.services.reports import ReportService
from app.services.templates import TemplateService

STANDARD_FIXED_SECTIONS = {
    "meter_readings": {
        "types": ["gas", "electric", "water"],
        "photo_required": True,
        "ai_enabled": True,
    },
    "keys_and_fobs": {
        "common_items": ["Front door key", "Back door key", "Mailbox key", "Window key"],
    },
    "general_observations": {
        "checklist": [
            {
                "key": "smoke_alarms",
                "name": "Smoke Alarm(s)",
                "type": "boolean_with_note",
                "guidance": "Record whether alarms are present and working.",
            },
            {
                "key": "co_detector",
                "name": "Carbon Monoxide Detector",
                "type": "boolean_with_note",
                "guidance": "Record whether a detector is present and working.",
            },
            {
                "key": "overall_cleanliness",
                "name": "Overall Cleanliness",
                "type": "rating",
                "options": ["professional_clean", "good", "fair", "poor"],
            },
            {
                "key": "additional_notes",
                "name": "Additional Notes",
                "type": "free_text",
                "guidance": "Add anything material not captured elsewhere.",
            },
        ]
    },
}


class InspectionStore:
    def __init__(
        self,
        *,
        templates: TemplateService,
        report_service: ReportService,
        db_path: Path,
    ) -> None:
        self._templates = templates
        self._reports = report_service
        self._db_path = db_path
        self._conditions = cycle(["good", "fair", "good", "poor"])

    def list_templates(self) -> list[TemplateSummary]:
        built_in = self._templates.list_templates()
        custom = self._list_custom_template_summaries()
        return sorted(
            [*built_in, *custom],
            key=lambda template: (template.property_type.lower(), template.name.lower()),
        )

    def get_template(self, template_key: str) -> TemplateSchema:
        if self._templates.has_template(template_key):
            return self._templates.get_template(template_key)

        with self._connect() as connection:
            row = connection.execute(
                "SELECT payload_json FROM custom_templates WHERE template_key = ?",
                (template_key,),
            ).fetchone()

        if not row:
            raise HTTPException(status_code=404, detail=f"Unknown template '{template_key}'")

        return TemplateSchema.model_validate(json.loads(row["payload_json"]))

    def create_template(self, payload: CreateTemplateRequest) -> TemplateSchema:
        template_key = self._generate_template_key(payload.name, payload.property_type)
        template = self._build_custom_template(payload, template_key=template_key)
        now = datetime.utcnow().isoformat()

        with self._connect() as connection:
            connection.execute(
                """
                INSERT INTO custom_templates (template_key, created_at, updated_at, payload_json)
                VALUES (?, ?, ?, ?)
                """,
                (template.key, now, now, self._serialize_model(template)),
            )

        return template

    def update_template(self, template_key: str, payload: UpdateTemplateRequest) -> TemplateSchema:
        if self._templates.has_template(template_key):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Built-in templates are read-only")

        with self._connect() as connection:
            try:
                connection.execute("BEGIN")
                row = connection.execute(
                    "SELECT payload_json, created_at FROM custom_templates WHERE template_key = ?",
                    (template_key,),
                ).fetchone()
                if not row:
                    raise HTTPException(status_code=404, detail=f"Unknown template '{template_key}'")

                existing = TemplateSchema.model_validate(json.loads(row["payload_json"]))
                updated = self._build_custom_template(payload, template_key=existing.key, version=existing.version)
                connection.execute(
                    """
                    UPDATE custom_templates
                    SET payload_json = ?, updated_at = ?
                    WHERE template_key = ?
                    """,
                    (self._serialize_model(updated), datetime.utcnow().isoformat(), template_key),
                )
                connection.commit()
                return updated
            except Exception:
                connection.rollback()
                raise

    def delete_template(self, template_key: str) -> None:
        if self._templates.has_template(template_key):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Built-in templates cannot be deleted")
        if self._template_in_use(template_key):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This custom template is already attached to an inspection and cannot be deleted",
            )

        with self._connect() as connection:
            cursor = connection.execute(
                "DELETE FROM custom_templates WHERE template_key = ?",
                (template_key,),
            )
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail=f"Unknown template '{template_key}'")

    def list_inspections(self) -> list[InspectionSummary]:
        with self._connect() as connection:
            rows = connection.execute(
                "SELECT payload_json FROM inspections ORDER BY created_at DESC"
            ).fetchall()

        return [self._to_summary(InspectionRecord.model_validate(json.loads(row["payload_json"]))) for row in rows]

    def create_inspection(self, payload: CreateInspectionRequest) -> InspectionRecord:
        template = self.get_template(payload.template_key)
        template_rooms = [*template.rooms, *template.optional_rooms]
        rooms = [self._build_room(room) for room in template_rooms]
        inspection = InspectionRecord(
            id=self._new_id("insp"),
            template_key=template.key,
            property_type=template.property_type,
            property_address=payload.property_address,
            postcode=payload.postcode,
            landlord_name=payload.landlord_name,
            tenant_names=payload.tenant_names,
            created_at=datetime.utcnow(),
            inspection_date=payload.inspection_date,
            rooms=rooms,
            sections=InspectionSections(),
        )
        self._save_inspection(inspection)
        return inspection

    def get_inspection(self, inspection_id: str) -> InspectionRecord:
        with self._connect() as connection:
            row = connection.execute(
                "SELECT payload_json FROM inspections WHERE inspection_id = ?",
                (inspection_id,),
            ).fetchone()

        if not row:
            raise HTTPException(status_code=404, detail=f"Inspection '{inspection_id}' not found")
        return InspectionRecord.model_validate(json.loads(row["payload_json"]))

    def analyse_photo(
        self,
        inspection_id: str,
        room_id: str,
        file_name: str,
        *,
        ai_provider: AIProvider,
        item_id: str | None = None,
    ) -> AnalysisSuggestion:
        inspection = self.get_inspection(inspection_id)
        room = self._get_room(inspection, room_id)

        pending_items = [item for item in room.items if not item.is_confirmed]
        if not pending_items:
            pending_items = list(room.items)

        template = self.get_template(inspection.template_key)
        template_room = next(room_schema for room_schema in [*template.rooms, *template.optional_rooms] if room_schema.key == room.key)
        template_items = {item.key: item for item in template_room.items}
        item = next((candidate for candidate in room.items if candidate.id == item_id), None) if item_id else None
        if item_id and not item:
            raise HTTPException(status_code=404, detail=f"Item '{item_id}' not found")
        if not item:
            item = self._pick_item(file_name=file_name, pending_items=pending_items, template_items=template_items)
        template_item = template_items.get(item.key) or TemplateItem(
            key=item.key,
            name=item.name,
            display_order=0,
            condition_options=["good"],
        )
        condition = next(self._conditions)
        suggestion = AnalysisSuggestion(
            suggested_item_id=item.id,
            suggested_item_name=item.name,
            suggested_item_key=item.key,
            condition=condition,  # type: ignore[arg-type]
            confidence="high" if condition in {"good", "fair"} else "medium",
            description=ai_provider.describe_images(
                file_name=file_name,
                room_name=room.name,
                item_name=item.name,
                ai_hints=template_item.ai_hints,
                property_address=inspection.property_address,
            ),
            photo_name=file_name,
        )
        return suggestion

    def update_item(self, inspection_id: str, room_id: str, payload: UpdateItemRequest) -> InspectionRecord:
        inspection = self.get_inspection(inspection_id)
        room = self._get_room(inspection, room_id)
        item = next((candidate for candidate in room.items if candidate.id == payload.item_id), None)
        if not item:
            raise HTTPException(status_code=404, detail=f"Item '{payload.item_id}' not found")

        item.condition = payload.condition
        item.description = payload.description
        item.is_confirmed = payload.is_confirmed
        item.source = payload.source
        item.ai_confidence = "high" if payload.source != "manual" else None
        if payload.photo_name:
            if payload.photo_name not in item.photos:
                item.photos.append(payload.photo_name)

        self._recalculate_room(room)
        self._save_inspection(inspection)
        return inspection

    def reset_item(self, inspection_id: str, room_id: str, item_id: str) -> InspectionRecord:
        inspection = self.get_inspection(inspection_id)
        room = self._get_room(inspection, room_id)
        item = next((candidate for candidate in room.items if candidate.id == item_id), None)
        if not item:
            raise HTTPException(status_code=404, detail=f"Item '{item_id}' not found")

        item.condition = None
        item.description = ""
        item.ai_confidence = None
        item.source = "manual"
        item.is_confirmed = False
        item.photos = []

        self._recalculate_room(room)
        self._save_inspection(inspection)
        return inspection

    def scan_room_video(self, inspection_id: str, room_id: str) -> InspectionRecord:
        inspection = self.get_inspection(inspection_id)
        room = self._get_room(inspection, room_id)
        room.capture_mode = "video"
        room.status = "review"
        for item in room.items:
            if item.is_confirmed:
                continue
            item.condition = "fair"
            item.description = f"{item.name} was identified during the room scan and should be reviewed before final sign-off."
            item.source = "video_ai"
            item.ai_confidence = "medium"
        self._save_inspection(inspection)
        return inspection

    def update_sections(self, inspection_id: str, payload: UpdateSectionsRequest) -> InspectionRecord:
        inspection = self.get_inspection(inspection_id)
        if payload.meter_readings is not None:
            inspection.sections.meter_readings = payload.meter_readings
        if payload.keys_and_fobs is not None:
            inspection.sections.keys_and_fobs = payload.keys_and_fobs
        if payload.general_observations is not None:
            inspection.sections.general_observations = payload.general_observations
        inspection.sections_completed = True
        self._save_inspection(inspection)
        return inspection

    def generate_report(self, inspection_id: str, *, ai_provider: AIProvider) -> InspectionRecord:
        inspection = self.get_inspection(inspection_id)
        inspection.status = "processing"
        inspection.report_url = self._reports.generate(inspection, ai_provider)
        inspection.status = "completed"
        self._save_inspection(inspection)
        return inspection

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self._db_path)
        connection.row_factory = sqlite3.Row
        return connection

    def _save_inspection(self, inspection: InspectionRecord) -> None:
        with self._connect() as connection:
            connection.execute(
                """
                INSERT INTO inspections (inspection_id, created_at, payload_json)
                VALUES (?, ?, ?)
                ON CONFLICT(inspection_id) DO UPDATE SET
                    created_at = excluded.created_at,
                    payload_json = excluded.payload_json
                """,
                (
                    inspection.id,
                    inspection.created_at.isoformat(),
                    self._serialize_model(inspection),
                ),
            )

    def _build_room(self, room: TemplateRoom) -> RoomRecord:
        items = [
            ItemRecord(
                id=self._new_id("item"),
                key=item.key,
                name=item.name,
                photo_required=item.photo_required,
            )
            for item in room.items
        ]
        return RoomRecord(
            id=self._new_id("room"),
            key=room.key,
            name=room.name,
            display_order=room.display_order,
            items_total=len(items),
            items=items,
        )

    def _recalculate_room(self, room: RoomRecord) -> None:
        room.items_confirmed = len([candidate for candidate in room.items if candidate.is_confirmed])
        if room.items_confirmed <= 0:
            room.status = "not_started"
        elif room.items_confirmed >= room.items_total:
            room.status = "confirmed"
        else:
            room.status = "review"

    def _build_custom_template(
        self,
        payload: CreateTemplateRequest | UpdateTemplateRequest,
        *,
        template_key: str,
        version: str = "1.0.0-custom",
    ) -> TemplateSchema:
        self._validate_template_payload(payload)

        required_rooms: list[TemplateRoom] = []
        optional_rooms: list[TemplateRoom] = []
        used_room_keys: set[str] = set()

        for room_index, room in enumerate(payload.rooms, start=1):
            room_key = self._ensure_unique_key(room.key or room.name, used_room_keys, fallback=f"room-{room_index}")
            used_item_keys: set[str] = set()
            items: list[TemplateItem] = []
            for item_index, item in enumerate(room.items, start=1):
                item_key = self._ensure_unique_key(item.key or item.name, used_item_keys, fallback=f"{room_key}-item-{item_index}")
                items.append(
                    TemplateItem(
                        key=item_key,
                        name=item.name.strip(),
                        display_order=item_index,
                        condition_options=item.condition_options or ["good", "fair", "poor", "damaged"],
                        photo_required=item.photo_required,
                        max_photos=max(item.max_photos, 1),
                        guidance_note=item.guidance_note.strip(),
                        ai_hints=[hint.strip() for hint in item.ai_hints if hint.strip()],
                    )
                )

            template_room = TemplateRoom(
                key=room_key,
                name=room.name.strip(),
                display_order=room_index,
                is_required=room.is_required,
                items=items,
            )
            if room.is_required:
                required_rooms.append(template_room)
            else:
                optional_rooms.append(template_room)

        return TemplateSchema(
            key=template_key,
            name=payload.name.strip(),
            version=version,
            property_type=payload.property_type.strip(),
            rooms=required_rooms,
            optional_rooms=optional_rooms,
            fixed_sections=deepcopy(STANDARD_FIXED_SECTIONS),
            source="custom",
            is_editable=True,
        )

    def _list_custom_template_summaries(self) -> list[TemplateSummary]:
        with self._connect() as connection:
            rows = connection.execute(
                "SELECT payload_json FROM custom_templates ORDER BY updated_at DESC"
            ).fetchall()

        summaries: list[TemplateSummary] = []
        for row in rows:
            template = TemplateSchema.model_validate(json.loads(row["payload_json"]))
            summaries.append(
                TemplateSummary(
                    key=template.key,
                    name=template.name,
                    property_type=template.property_type,
                    version=template.version,
                    source=template.source,
                    is_editable=template.is_editable,
                )
            )
        return summaries

    def _validate_template_payload(self, payload: CreateTemplateRequest | UpdateTemplateRequest) -> None:
        if not payload.name.strip():
            raise HTTPException(status_code=422, detail="Template name is required")
        if not payload.property_type.strip():
            raise HTTPException(status_code=422, detail="Property type is required")
        if not payload.rooms:
            raise HTTPException(status_code=422, detail="At least one room is required")
        for room in payload.rooms:
            if not room.name.strip():
                raise HTTPException(status_code=422, detail="Each room must have a name")
            if not room.items:
                raise HTTPException(status_code=422, detail=f"Room '{room.name}' must contain at least one checklist item")
            for item in room.items:
                if not item.name.strip():
                    raise HTTPException(status_code=422, detail=f"Room '{room.name}' contains an item without a name")

    def _generate_template_key(self, name: str, property_type: str) -> str:
        base = f"{self._slugify(property_type)}-{self._slugify(name)}-custom"
        candidate = base
        suffix = 2
        while self._templates.has_template(candidate) or self._custom_template_exists(candidate):
            candidate = f"{base}-{suffix}"
            suffix += 1
        return candidate

    def _custom_template_exists(self, template_key: str) -> bool:
        with self._connect() as connection:
            row = connection.execute(
                "SELECT 1 FROM custom_templates WHERE template_key = ?",
                (template_key,),
            ).fetchone()
        return row is not None

    def _template_in_use(self, template_key: str) -> bool:
        with self._connect() as connection:
            rows = connection.execute("SELECT payload_json FROM inspections").fetchall()

        for row in rows:
            inspection = InspectionRecord.model_validate(json.loads(row["payload_json"]))
            if inspection.template_key == template_key:
                return True
        return False

    def _pick_item(
        self,
        *,
        file_name: str,
        pending_items: list[ItemRecord],
        template_items: dict[str, TemplateItem],
    ) -> ItemRecord:
        lowered = file_name.lower()
        for item in pending_items:
            template_item = template_items.get(item.key)
            if item.key.replace("_", " ") in lowered or item.name.lower() in lowered:
                return item
            if template_item and any(hint.lower() in lowered for hint in template_item.ai_hints):
                return item
        return pending_items[0]

    def _to_summary(self, inspection: InspectionRecord) -> InspectionSummary:
        total_items = sum(room.items_total for room in inspection.rooms)
        confirmed_items = sum(room.items_confirmed for room in inspection.rooms)
        return InspectionSummary(
            id=inspection.id,
            property_address=inspection.property_address,
            postcode=inspection.postcode,
            property_type=inspection.property_type,
            inspection_date=inspection.inspection_date,
            status=inspection.status,
            rooms_count=len(inspection.rooms),
            confirmed_items=confirmed_items,
            total_items=total_items,
            report_url=inspection.report_url,
        )

    def _get_room(self, inspection: InspectionRecord, room_id: str) -> RoomRecord:
        room = next((candidate for candidate in inspection.rooms if candidate.id == room_id), None)
        if not room:
            raise HTTPException(status_code=404, detail=f"Room '{room_id}' not found")
        return room

    def _ensure_unique_key(self, raw_key: str, used_keys: set[str], *, fallback: str) -> str:
        base = self._slugify(raw_key) or self._slugify(fallback)
        candidate = base
        suffix = 2
        while candidate in used_keys:
            candidate = f"{base}-{suffix}"
            suffix += 1
        used_keys.add(candidate)
        return candidate

    def _serialize_model(self, model: InspectionRecord | TemplateSchema) -> str:
        return json.dumps(model.model_dump(mode="json"))

    def _slugify(self, value: str) -> str:
        normalized = re.sub(r"[^a-z0-9]+", "-", value.strip().lower())
        return normalized.strip("-") or uuid4().hex[:8]

    def _new_id(self, prefix: str) -> str:
        return f"{prefix}_{uuid4().hex[:8]}"
