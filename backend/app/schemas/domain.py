from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


Condition = Literal["good", "fair", "poor", "damaged", "na"]
Confidence = Literal["high", "medium", "low"]
InspectionStatus = Literal["draft", "processing", "completed"]
RoomStatus = Literal["not_started", "capturing", "review", "confirmed"]
CaptureMode = Literal["photo", "video"]
Source = Literal["manual", "photo_ai", "video_ai"]
TemplateSource = Literal["built_in", "custom"]


class TemplateItem(BaseModel):
    key: str
    name: str
    display_order: int
    condition_options: list[Condition]
    photo_required: bool = False
    max_photos: int = 1
    guidance_note: str = ""
    ai_hints: list[str] = Field(default_factory=list)


class TemplateRoom(BaseModel):
    key: str
    name: str
    display_order: int
    is_required: bool = True
    items: list[TemplateItem] = Field(default_factory=list)


class TemplateSchema(BaseModel):
    key: str
    name: str
    version: str
    property_type: str
    rooms: list[TemplateRoom]
    optional_rooms: list[TemplateRoom] = Field(default_factory=list)
    fixed_sections: dict = Field(default_factory=dict)
    source: TemplateSource = "built_in"
    is_editable: bool = False


class ItemRecord(BaseModel):
    id: str
    key: str
    name: str
    photo_required: bool = False
    condition: Condition | None = None
    description: str = ""
    ai_confidence: Confidence | None = None
    source: Source = "manual"
    is_confirmed: bool = False
    photos: list[str] = Field(default_factory=list)


class RoomRecord(BaseModel):
    id: str
    key: str
    name: str
    display_order: int
    status: RoomStatus = "not_started"
    capture_mode: CaptureMode = "photo"
    items_total: int
    items_confirmed: int = 0
    items: list[ItemRecord] = Field(default_factory=list)


class MeterReadings(BaseModel):
    gas: str = ""
    electric: str = ""
    water: str = ""


class GeneralObservations(BaseModel):
    smoke_alarms: bool = False
    co_detector: bool = False
    overall_cleanliness: str = "good"
    additional_notes: str = ""


class InspectionSections(BaseModel):
    meter_readings: MeterReadings = Field(default_factory=MeterReadings)
    keys_and_fobs: dict[str, int] = Field(
        default_factory=lambda: {
            "Front door key": 0,
            "Back door key": 0,
            "Mailbox key": 0,
            "Window key": 0,
        }
    )
    general_observations: GeneralObservations = Field(default_factory=GeneralObservations)


class InspectionRecord(BaseModel):
    id: str
    template_key: str
    property_type: str
    property_address: str
    postcode: str
    landlord_name: str = ""
    tenant_names: str = ""
    created_at: datetime
    inspection_date: str
    status: InspectionStatus = "draft"
    rooms: list[RoomRecord]
    sections: InspectionSections = Field(default_factory=InspectionSections)
    sections_completed: bool = False
    report_url: str | None = None


class TemplateSummary(BaseModel):
    key: str
    name: str
    property_type: str
    version: str
    source: TemplateSource = "built_in"
    is_editable: bool = False


class InspectionSummary(BaseModel):
    id: str
    property_address: str
    postcode: str
    property_type: str
    inspection_date: str
    status: InspectionStatus
    rooms_count: int
    confirmed_items: int
    total_items: int
    report_url: str | None = None


class CreateInspectionRequest(BaseModel):
    template_key: str
    property_address: str
    postcode: str
    landlord_name: str = ""
    tenant_names: str = ""
    inspection_date: str


class EditableTemplateItem(BaseModel):
    key: str = ""
    name: str
    condition_options: list[Condition] = Field(default_factory=lambda: ["good", "fair", "poor", "damaged"])
    photo_required: bool = False
    max_photos: int = 1
    guidance_note: str = ""
    ai_hints: list[str] = Field(default_factory=list)


class EditableTemplateRoom(BaseModel):
    key: str = ""
    name: str
    is_required: bool = True
    items: list[EditableTemplateItem] = Field(default_factory=list)


class CreateTemplateRequest(BaseModel):
    name: str
    property_type: str
    rooms: list[EditableTemplateRoom] = Field(default_factory=list)


class UpdateTemplateRequest(CreateTemplateRequest):
    pass


class UpdateItemRequest(BaseModel):
    item_id: str
    condition: Condition
    description: str
    is_confirmed: bool = True
    source: Source = "photo_ai"
    photo_name: str | None = None


class UpdateSectionsRequest(BaseModel):
    meter_readings: MeterReadings | None = None
    keys_and_fobs: dict[str, int] | None = None
    general_observations: GeneralObservations | None = None


class AnalysisSuggestion(BaseModel):
    suggested_item_id: str
    suggested_item_name: str
    suggested_item_key: str
    condition: Condition
    confidence: Confidence
    description: str
    photo_name: str
