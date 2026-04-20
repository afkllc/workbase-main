from __future__ import annotations

import os
import shutil
import unittest
from datetime import UTC, datetime
from pathlib import Path
from unittest.mock import patch
from uuid import uuid4

from fastapi.testclient import TestClient

import app.api.routes.inspections as inspections_route
import app.api.routes.reports as reports_route
import app.main as main_module
from app.main import create_app
from app.schemas.domain import InspectionRecord, InspectionSections, ItemRecord, RoomRecord
from app.services.ai.verba_provider import VerbaProvider


class BackendSmokeTests(unittest.TestCase):
    def _base_env(self, **overrides: str) -> dict[str, str]:
        env = {
            "AI_PROVIDER": "mock",
            "VERBA_API_BASE_URL": "https://api.verba.ink",
            "VERBA_API_KEY": "",
            "VERBA_CAPTURE_CHARACTER": "",
            "VERBA_REPORT_CHARACTER": "",
            "PUBLIC_API_BASE_URL": "",
        }
        env.update(overrides)
        return env

    def _build_client(self, **env_overrides: str) -> tuple[TestClient, Path, Path]:
        root = Path(__file__).resolve().parents[1] / ".tmp-smoke" / uuid4().hex
        root.mkdir(parents=True, exist_ok=True)
        self.addCleanup(lambda: shutil.rmtree(root, ignore_errors=True))
        reports_dir = root / "generated_reports"
        uploads_dir = root / "generated_uploads"

        env_patch = patch.dict(os.environ, self._base_env(**env_overrides), clear=False)
        env_patch.start()
        self.addCleanup(env_patch.stop)

        main_reports_patch = patch.object(main_module, "REPORTS_DIR", reports_dir)
        main_uploads_patch = patch.object(main_module, "UPLOADS_DIR", uploads_dir)
        route_reports_patch = patch.object(reports_route, "REPORTS_DIR", reports_dir)
        route_uploads_patch = patch.object(inspections_route, "UPLOADS_DIR", uploads_dir)

        for active_patch in (
            main_reports_patch,
            main_uploads_patch,
            route_reports_patch,
            route_uploads_patch,
        ):
            active_patch.start()
            self.addCleanup(active_patch.stop)

        client = TestClient(create_app())
        self.addCleanup(client.close)
        return client, reports_dir, uploads_dir

    def _create_inspection(self, client: TestClient) -> dict:
        templates_response = client.get("/api/templates")
        self.assertEqual(templates_response.status_code, 200)
        template_key = templates_response.json()[0]["key"]

        response = client.post(
            "/api/inspections",
            json={
                "template_key": template_key,
                "property_address": "221B Baker Street",
                "postcode": "NW1 6XE",
                "landlord_name": "Sherlock Homes",
                "tenant_names": "John Watson",
                "inspection_date": "2026-04-20",
            },
        )
        self.assertEqual(response.status_code, 200)
        inspection = response.json()
        self.addCleanup(self._delete_inspection, inspection["id"])
        return inspection

    def _delete_inspection(self, inspection_id: str) -> None:
        try:
            import sqlite3

            connection = sqlite3.connect(main_module.DATABASE_PATH)
            try:
                connection.execute("DELETE FROM inspections WHERE inspection_id = ?", (inspection_id,))
                connection.commit()
            finally:
                connection.close()
        except Exception:
            # Best-effort cleanup for the shared local smoke database.
            pass

    def _complete_inspection(self, client: TestClient, inspection: dict) -> dict:
        sections_response = client.patch(
            f"/api/inspections/{inspection['id']}/sections",
            json={
                "meter_readings": {"gas": "100", "electric": "200", "water": "300"},
                "keys_and_fobs": {"Front door key": 2, "Back door key": 1, "Mailbox key": 1, "Window key": 0},
                "general_observations": {
                    "smoke_alarms": True,
                    "co_detector": True,
                    "overall_cleanliness": "good",
                    "additional_notes": "Inspection completed for smoke test coverage.",
                },
            },
        )
        self.assertEqual(sections_response.status_code, 200)

        detail_response = client.get(f"/api/inspections/{inspection['id']}")
        self.assertEqual(detail_response.status_code, 200)
        detail = detail_response.json()

        for room in detail["rooms"]:
            for item in room["items"]:
                update_response = client.patch(
                    f"/api/inspections/{detail['id']}/rooms/{room['id']}/items",
                    json={
                        "item_id": item["id"],
                        "condition": "good",
                        "description": f"{item['name']} confirmed as serviceable.",
                        "is_confirmed": True,
                        "source": "manual",
                    },
                )
                self.assertEqual(update_response.status_code, 200)

        completed_response = client.get(f"/api/inspections/{inspection['id']}")
        self.assertEqual(completed_response.status_code, 200)
        return completed_response.json()

    def test_health_route_returns_ok(self) -> None:
        client, _, _ = self._build_client()
        response = client.get("/health")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})

    def test_mock_generate_report_writes_file_and_fetches_report(self) -> None:
        client, reports_dir, _ = self._build_client(AI_PROVIDER="mock")
        inspection = self._create_inspection(client)
        completed = self._complete_inspection(client, inspection)

        generate_response = client.post(f"/api/inspections/{completed['id']}/generate")
        self.assertEqual(generate_response.status_code, 200)
        generated = generate_response.json()

        self.assertEqual(generated["report_url"], f"/api/reports/{completed['id']}")
        self.assertTrue((reports_dir / f"{completed['id']}.html").exists())

        report_response = client.get(generated["report_url"])
        self.assertEqual(report_response.status_code, 200)
        self.assertIn("Workbase AI Inventory Report", report_response.text)

    def test_verba_placeholder_configuration_returns_503(self) -> None:
        client, _, _ = self._build_client(
            AI_PROVIDER="verba",
            VERBA_API_KEY="vka_your_api_key",
            VERBA_CAPTURE_CHARACTER="your_capture_verb_slug",
            VERBA_REPORT_CHARACTER="your_report_verb_slug",
        )
        inspection = self._create_inspection(client)
        completed = self._complete_inspection(client, inspection)

        response = client.post(f"/api/inspections/{completed['id']}/generate")

        self.assertEqual(response.status_code, 503)
        self.assertIn("placeholder", response.json()["detail"].lower())

    def test_verba_photo_analysis_without_public_https_url_returns_409(self) -> None:
        client, _, _ = self._build_client(
            AI_PROVIDER="verba",
            VERBA_API_KEY="vka_real_test_key",
            VERBA_CAPTURE_CHARACTER="notara_capture_ai",
            VERBA_REPORT_CHARACTER="notara_report_ai",
            PUBLIC_API_BASE_URL="http://localhost:8000",
        )
        inspection = self._create_inspection(client)
        room_id = inspection["rooms"][0]["id"]

        response = client.post(
            f"/api/inspections/{inspection['id']}/rooms/{room_id}/analyse-photo",
            files={"photo": ("wall.jpg", b"fake-image-bytes", "image/jpeg")},
        )

        self.assertEqual(response.status_code, 409)
        self.assertIn("https", response.json()["detail"].lower())
        self.assertIn("tunnel", response.json()["detail"].lower())

    def test_verba_provider_successfully_parses_capture_and_report_payloads(self) -> None:
        provider = VerbaProvider(
            api_base_url="https://api.verba.ink",
            api_key="vka_real_test_key",
            capture_character="notara_capture_ai",
            report_character="notara_report_ai",
        )
        inspection = InspectionRecord(
            id="insp_test",
            template_key="demo-template",
            property_type="flat",
            property_address="221B Baker Street",
            postcode="NW1 6XE",
            landlord_name="Sherlock Homes",
            tenant_names="John Watson",
            created_at=datetime.now(UTC),
            inspection_date="2026-04-20",
            rooms=[
                RoomRecord(
                    id="room_1",
                    key="living_room",
                    name="Living room",
                    display_order=1,
                    items_total=1,
                    items_confirmed=1,
                    items=[
                        ItemRecord(
                            id="item_1",
                            key="walls",
                            name="Walls",
                            condition="fair",
                            description="Visible scuffs to the painted surface.",
                            is_confirmed=True,
                        )
                    ],
                )
            ],
            sections=InspectionSections(),
            sections_completed=True,
        )

        with patch.object(
            provider,
            "_post_response",
            side_effect=[
                {
                    "choices": [
                        {
                            "message": {
                                "content": '{"condition":"fair","confidence":"high","description":"Visible scuffs to the painted surface."}'
                            }
                        }
                    ]
                },
                {
                    "choices": [
                        {
                            "message": {
                                "content": "The inspection record is complete, with most visible surfaces recorded in serviceable condition."
                            }
                        }
                    ]
                },
            ],
        ):
            assessment = provider.describe_images(
                file_name="wall.jpg",
                room_name="Living room",
                item_name="Walls",
                ai_hints=["painted wall"],
                property_address="221B Baker Street",
                image_url="https://example.com/wall.jpg",
            )
            summary = provider.generate_report(inspection=inspection)

        self.assertEqual(assessment.condition, "fair")
        self.assertEqual(assessment.confidence, "high")
        self.assertEqual(assessment.description, "Visible scuffs to the painted surface.")
        self.assertEqual(
            summary,
            "The inspection record is complete, with most visible surfaces recorded in serviceable condition.",
        )


if __name__ == "__main__":
    unittest.main()
