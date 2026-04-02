from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.responses import FileResponse

from app.config import REPORTS_DIR
from app.dependencies import get_store
from app.services.store import InspectionStore


router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/{inspection_id}")
def get_report(inspection_id: str):
    report_path = REPORTS_DIR / f"{inspection_id}.html"
    if not report_path.exists():
        raise HTTPException(status_code=404, detail="Report not found")
    return FileResponse(report_path)


@router.patch("/{inspection_id}/archive", status_code=status.HTTP_204_NO_CONTENT)
def archive_report(inspection_id: str, store: InspectionStore = Depends(get_store)):
    store.archive_report(inspection_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
