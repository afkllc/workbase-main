from fastapi import APIRouter, Depends, status

from app.dependencies import get_store
from app.schemas.domain import CreateTemplateRequest, TemplateSchema, TemplateSummary, UpdateTemplateRequest
from app.services.store import InspectionStore


router = APIRouter(prefix="/api/templates", tags=["templates"])


@router.get("", response_model=list[TemplateSummary])
def list_templates(store: InspectionStore = Depends(get_store)):
    return store.list_templates()


@router.get("/{template_key}", response_model=TemplateSchema)
def get_template(template_key: str, store: InspectionStore = Depends(get_store)):
    return store.get_template(template_key)


@router.post("", response_model=TemplateSchema, status_code=status.HTTP_201_CREATED)
def create_template(payload: CreateTemplateRequest, store: InspectionStore = Depends(get_store)):
    return store.create_template(payload)


@router.patch("/{template_key}", response_model=TemplateSchema)
def update_template(
    template_key: str,
    payload: UpdateTemplateRequest,
    store: InspectionStore = Depends(get_store),
):
    return store.update_template(template_key, payload)
