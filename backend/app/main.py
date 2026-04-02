from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.inspections import router as inspections_router
from app.api.routes.reports import router as reports_router
from app.api.routes.templates import router as templates_router
from app.config import (
    CORS_ALLOW_ORIGIN_REGEX,
    CORS_ALLOW_ORIGINS,
    DATABASE_PATH,
    REPORTS_DIR,
    TEMPLATES_DIR,
)
from app.db import init_db
from app.services.reports import ReportService
from app.services.store import InspectionStore
from app.services.templates import TemplateService


def create_app() -> FastAPI:
    app = FastAPI(title="Workbase AI API", version="0.1.0")
    init_db(DATABASE_PATH)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=CORS_ALLOW_ORIGINS,
        allow_origin_regex=CORS_ALLOW_ORIGIN_REGEX,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.state.store = InspectionStore(
        templates=TemplateService(TEMPLATES_DIR),
        report_service=ReportService(REPORTS_DIR),
        db_path=DATABASE_PATH,
    )

    app.include_router(templates_router)
    app.include_router(inspections_router)
    app.include_router(reports_router)
    return app


app = create_app()
