from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from app.config import UPLOADS_DIR, get_public_api_base_url, public_api_base_url_is_reachable
from app.dependencies import get_ai_provider, get_store
from app.schemas.domain import (
    AnalysisSuggestion,
    CreateInspectionRequest,
    InspectionRecord,
    InspectionSummary,
    UpdateItemRequest,
    UpdateSectionsRequest,
)
from app.services.ai import AIProvider
from app.services.store import InspectionStore


router = APIRouter(prefix="/api/inspections", tags=["inspections"])


def _save_uploaded_photo(photo: UploadFile) -> tuple[str, str | None]:
    original_name = photo.filename or "capture.jpg"
    suffix = Path(original_name).suffix or ".jpg"
    stored_name = f"{uuid4().hex}{suffix.lower()}"
    target = UPLOADS_DIR / stored_name

    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    target.write_bytes(photo.file.read())

    public_api_base_url = get_public_api_base_url()
    if not public_api_base_url_is_reachable(public_api_base_url):
        return original_name, None

    return original_name, f"{public_api_base_url}/api/uploads/{stored_name}"


@router.get("", response_model=list[InspectionSummary])
def list_inspections(store: InspectionStore = Depends(get_store)):
    return store.list_inspections()


@router.post("", response_model=InspectionRecord)
def create_inspection(payload: CreateInspectionRequest, store: InspectionStore = Depends(get_store)):
    return store.create_inspection(payload)


@router.get("/{inspection_id}", response_model=InspectionRecord)
def get_inspection(inspection_id: str, store: InspectionStore = Depends(get_store)):
    return store.get_inspection(inspection_id)


@router.patch("/{inspection_id}/sections", response_model=InspectionRecord)
def update_sections(
    inspection_id: str,
    payload: UpdateSectionsRequest,
    store: InspectionStore = Depends(get_store),
):
    return store.update_sections(inspection_id, payload)


@router.patch("/{inspection_id}/rooms/{room_id}/items", response_model=InspectionRecord)
def update_item(
    inspection_id: str,
    room_id: str,
    payload: UpdateItemRequest,
    store: InspectionStore = Depends(get_store),
):
    return store.update_item(inspection_id, room_id, payload)


@router.post("/{inspection_id}/rooms/{room_id}/items/{item_id}/reset", response_model=InspectionRecord)
def reset_item(
    inspection_id: str,
    room_id: str,
    item_id: str,
    store: InspectionStore = Depends(get_store),
):
    return store.reset_item(inspection_id, room_id, item_id)


@router.post("/{inspection_id}/rooms/{room_id}/analyse-photo", response_model=AnalysisSuggestion)
async def analyse_photo(
    inspection_id: str,
    room_id: str,
    photo: UploadFile = File(...),
    item_id: str | None = Form(None),
    ai_provider: AIProvider = Depends(get_ai_provider),
    store: InspectionStore = Depends(get_store),
):
    try:
        photo_name, photo_url = _save_uploaded_photo(photo)
    except OSError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to save the uploaded photo.",
        ) from exc
    return store.analyse_photo(
        inspection_id,
        room_id,
        photo_name,
        ai_provider=ai_provider,
        item_id=item_id,
        photo_url=photo_url,
    )


@router.post("/{inspection_id}/rooms/{room_id}/video-scan", response_model=InspectionRecord)
def video_scan(
    inspection_id: str,
    room_id: str,
    store: InspectionStore = Depends(get_store),
):
    return store.scan_room_video(inspection_id, room_id)


@router.post("/{inspection_id}/generate", response_model=InspectionRecord)
def generate_report(
    inspection_id: str,
    ai_provider: AIProvider = Depends(get_ai_provider),
    store: InspectionStore = Depends(get_store),
):
    return store.generate_report(inspection_id, ai_provider=ai_provider)
