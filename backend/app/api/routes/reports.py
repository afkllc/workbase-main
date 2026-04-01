from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.config import REPORTS_DIR


router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/{inspection_id}")
def get_report(inspection_id: str):
    report_path = REPORTS_DIR / f"{inspection_id}.html"
    if not report_path.exists():
        raise HTTPException(status_code=404, detail="Report not found")
    return FileResponse(report_path)
