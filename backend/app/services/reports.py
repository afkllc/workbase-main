from __future__ import annotations

from html import escape
from pathlib import Path

from app.schemas.domain import InspectionRecord
from app.services.ai import AIProvider


class ReportService:
    def __init__(self, reports_dir: Path) -> None:
        self._reports_dir = reports_dir
        self._reports_dir.mkdir(parents=True, exist_ok=True)

    def generate(self, inspection: InspectionRecord, ai_provider: AIProvider) -> str:
        report_path = self._reports_dir / f"{inspection.id}.html"
        summary = ai_provider.generate_report(inspection=inspection)
        report_path.write_text(self._render_html(inspection, summary), encoding="utf-8")
        return f"/api/reports/{inspection.id}"

    def _render_html(self, inspection: InspectionRecord, summary: str) -> str:
        room_sections = []
        for room in inspection.rooms:
            items = "".join(
                f"<tr><td>{escape(item.name)}</td><td>{escape(item.condition or 'pending')}</td><td>{escape(item.description or 'Pending confirmation')}</td></tr>"
                for item in room.items
            )
            room_sections.append(
                f"""
                <section>
                  <h2>{escape(room.name)}</h2>
                  <table>
                    <thead>
                      <tr><th>Item</th><th>Condition</th><th>Description</th></tr>
                    </thead>
                    <tbody>{items}</tbody>
                  </table>
                </section>
                """
            )

        key_rows = "".join(
            f"<tr><td>{escape(name)}</td><td>{quantity}</td></tr>"
            for name, quantity in inspection.sections.keys_and_fobs.items()
        )
        return f"""
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <title>Workbase AI Report</title>
            <style>
              body {{ font-family: Arial, sans-serif; margin: 40px; color: #1f2937; }}
              h1, h2 {{ margin-bottom: 12px; }}
              section {{ margin-top: 28px; }}
              table {{ width: 100%; border-collapse: collapse; margin-top: 12px; }}
              th, td {{ border: 1px solid #d1d5db; padding: 8px; text-align: left; vertical-align: top; }}
              th {{ background: #eff6ff; }}
            </style>
          </head>
          <body>
            <h1>Workbase AI Inventory Report</h1>
            <p><strong>Property:</strong> {escape(inspection.property_address)}, {escape(inspection.postcode)}</p>
            <p><strong>Inspection date:</strong> {escape(inspection.inspection_date)}</p>
            <p><strong>Landlord:</strong> {escape(inspection.landlord_name or 'Not supplied')}</p>
            <p><strong>Tenant(s):</strong> {escape(inspection.tenant_names or 'Not supplied')}</p>
            <section>
              <h2>AI Summary</h2>
              <p>{escape(summary)}</p>
              <p><strong>Audio capture:</strong> [transcription not yet active]</p>
            </section>
            {''.join(room_sections)}
            <section>
              <h2>Meter Readings</h2>
              <table>
                <tbody>
                  <tr><td>Gas</td><td>{escape(inspection.sections.meter_readings.gas or 'Not recorded')}</td></tr>
                  <tr><td>Electric</td><td>{escape(inspection.sections.meter_readings.electric or 'Not recorded')}</td></tr>
                  <tr><td>Water</td><td>{escape(inspection.sections.meter_readings.water or 'Not recorded')}</td></tr>
                </tbody>
              </table>
            </section>
            <section>
              <h2>Keys and Fobs</h2>
              <table>
                <thead><tr><th>Item</th><th>Quantity</th></tr></thead>
                <tbody>{key_rows}</tbody>
              </table>
            </section>
            <section>
              <h2>General Observations</h2>
              <p><strong>Smoke alarms:</strong> {"Yes" if inspection.sections.general_observations.smoke_alarms else "No"}</p>
              <p><strong>CO detector:</strong> {"Yes" if inspection.sections.general_observations.co_detector else "No"}</p>
              <p><strong>Overall cleanliness:</strong> {escape(inspection.sections.general_observations.overall_cleanliness)}</p>
              <p><strong>Additional notes:</strong> {escape(inspection.sections.general_observations.additional_notes or 'None')}</p>
            </section>
          </body>
        </html>
        """
