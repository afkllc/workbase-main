import os
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[2]
TEMPLATES_DIR = ROOT_DIR / "templates"
REPORTS_DIR = ROOT_DIR / "backend" / "generated_reports"
DATABASE_PATH = ROOT_DIR / "backend" / "data" / "workbase.db"
BACKEND_ENV_PATH = ROOT_DIR / "backend" / ".env"


def _read_backend_env_value(name: str, default: str) -> str:
    explicit = os.getenv(name)
    if explicit is not None:
        return explicit

    if BACKEND_ENV_PATH.exists():
        for raw_line in BACKEND_ENV_PATH.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            if key.strip() == name:
                return value.strip()
    return default


def _read_backend_env_list(name: str, default: list[str]) -> list[str]:
    raw = _read_backend_env_value(name, "")
    if not raw.strip():
        return default
    return [item.strip() for item in raw.split(",") if item.strip()]


AI_PROVIDER = _read_backend_env_value("AI_PROVIDER", "mock").strip().lower() or "mock"
CORS_ALLOW_ORIGINS = _read_backend_env_list(
    "CORS_ALLOW_ORIGINS",
    ["http://localhost:3000", "http://127.0.0.1:3000"],
)
CORS_ALLOW_ORIGIN_REGEX = _read_backend_env_value(
    "CORS_ALLOW_ORIGIN_REGEX",
    r"^https?://("
    r"localhost|"
    r"127\.0\.0\.1|"
    r"192\.168\.\d{1,3}\.\d{1,3}|"
    r"10\.\d{1,3}\.\d{1,3}\.\d{1,3}|"
    r"172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}"
    r")(:\d+)?$",
).strip()
