from __future__ import annotations

import json
from pathlib import Path

from app.schemas.domain import TemplateSchema, TemplateSummary


class TemplateService:
    def __init__(self, templates_dir: Path) -> None:
        self._templates_dir = templates_dir
        self._templates: dict[str, TemplateSchema] = {}
        self._load()

    def _load(self) -> None:
        for path in sorted(self._templates_dir.glob("*.json")):
            data = json.loads(path.read_text(encoding="utf-8"))
            template = TemplateSchema.model_validate(data)
            self._templates[template.key] = template

    def list_templates(self) -> list[TemplateSummary]:
        return [
            TemplateSummary(
                key=template.key,
                name=template.name,
                property_type=template.property_type,
                version=template.version,
                source=template.source,
                is_editable=template.is_editable,
            )
            for template in self._templates.values()
        ]

    def has_template(self, template_key: str) -> bool:
        return template_key in self._templates

    def get_template(self, template_key: str) -> TemplateSchema:
        try:
            return self._templates[template_key]
        except KeyError as exc:
            raise KeyError(f"Unknown template '{template_key}'") from exc

    def get_template_for_property_type(self, property_type: str) -> TemplateSchema:
        normalized = property_type.strip().lower()
        for template in self._templates.values():
            if template.property_type.strip().lower() == normalized:
                return template
        raise KeyError(f"No template configured for property type '{property_type}'")
