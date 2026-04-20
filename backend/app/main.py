from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.routes.health import router as health_router
from app.api.routes.inspections import router as inspections_router
from app.api.routes.reports import router as reports_router
from app.api.routes.templates import router as templates_router
from app.config import (
    DATABASE_PATH,
    REPORTS_DIR,
    TEMPLATES_DIR,
    UPLOADS_DIR,
    get_cors_allow_origin_regex,
    get_cors_allow_origins,
)
from app.db import init_db
from app.services.reports import ReportService
from app.services.store import InspectionStore
from app.services.templates import TemplateService


def create_app() -> FastAPI:
    app = FastAPI(title="Workbase AI API", version="0.1.0")
    init_db(DATABASE_PATH)
    netlify_origins = [
        "https://*.netlify.app",
        "https://workbase11.netlify.app",
    ]
    allow_origins = list(dict.fromkeys([*get_cors_allow_origins(), *netlify_origins]))
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allow_origins,
        allow_origin_regex=get_cors_allow_origin_regex(),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.state.store = InspectionStore(
        templates=TemplateService(TEMPLATES_DIR),
        report_service=ReportService(REPORTS_DIR),
        db_path=DATABASE_PATH,
    )
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    app.mount("/api/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

    app.include_router(health_router)
    app.include_router(templates_router)
    app.include_router(inspections_router)
    app.include_router(reports_router)
    return app


app = create_app()
