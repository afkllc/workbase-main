import os
from ipaddress import ip_address, ip_network
from pathlib import Path
from urllib.parse import urlparse


ROOT_DIR = Path(__file__).resolve().parents[2]
TEMPLATES_DIR = ROOT_DIR / "templates"
REPORTS_DIR = ROOT_DIR / "backend" / "generated_reports"
UPLOADS_DIR = ROOT_DIR / "backend" / "generated_uploads"
DATABASE_PATH = ROOT_DIR / "backend" / "data" / "workbase.db"
BACKEND_ENV_PATH = ROOT_DIR / "backend" / ".env"


def _normalise_env_value(value: str) -> str:
    cleaned = value.strip()
    if len(cleaned) >= 2 and cleaned[0] == cleaned[-1] and cleaned[0] in {'"', "'"}:
        return cleaned[1:-1]
    return cleaned


def read_backend_env_value(name: str, default: str = "") -> str:
    explicit = os.getenv(name)
    if explicit is not None:
        return _normalise_env_value(explicit)

    if BACKEND_ENV_PATH.exists():
        for raw_line in BACKEND_ENV_PATH.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            if key.strip() == name:
                return _normalise_env_value(value)
    return default


def read_backend_env_list(name: str, default: list[str]) -> list[str]:
    raw = read_backend_env_value(name, "")
    if not raw.strip():
        return default
    return [item.strip() for item in raw.split(",") if item.strip()]


def get_ai_provider_name() -> str:
    return read_backend_env_value("AI_PROVIDER", "mock").strip().lower() or "mock"


def get_verba_api_base_url() -> str:
    return read_backend_env_value("VERBA_API_BASE_URL", "https://api.verba.ink").strip().rstrip("/")


def get_verba_api_key() -> str:
    return read_backend_env_value("VERBA_API_KEY", "").strip()


def get_verba_capture_character() -> str:
    return read_backend_env_value("VERBA_CAPTURE_CHARACTER", "").strip()


def get_verba_report_character() -> str:
    return read_backend_env_value("VERBA_REPORT_CHARACTER", "").strip()


def get_public_api_base_url() -> str:
    return read_backend_env_value("PUBLIC_API_BASE_URL", "").strip().rstrip("/")


def get_cors_allow_origins() -> list[str]:
    return read_backend_env_list(
        "CORS_ALLOW_ORIGINS",
        ["http://localhost:3000", "http://127.0.0.1:3000"],
    )


def get_cors_allow_origin_regex() -> str:
    return read_backend_env_value(
        "CORS_ALLOW_ORIGIN_REGEX",
    r"^https?://("
    r"localhost|"
    r"127\.0\.0\.1|"
    r"[a-z0-9-]+\.netlify\.app|"
    r"[a-z0-9-]+\.ngrok-free\.(app|dev)|"
    r"[a-z0-9-]+\.ngrok\.(io|app)|"
    r"192\.168\.\d{1,3}\.\d{1,3}|"
    r"10\.\d{1,3}\.\d{1,3}\.\d{1,3}|"
    r"172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}"
    r")(:\d+)?$",
    ).strip()


_PRIVATE_NETWORKS = (
    ip_network("127.0.0.0/8"),
    ip_network("10.0.0.0/8"),
    ip_network("172.16.0.0/12"),
    ip_network("192.168.0.0/16"),
)


def public_api_base_url_is_reachable(candidate: str | None = None) -> bool:
    base_url = (candidate or get_public_api_base_url()).strip().rstrip("/")
    if not base_url:
        return False

    try:
        parsed = urlparse(base_url)
    except ValueError:
        return False

    if parsed.scheme != "https":
        return False

    hostname = parsed.hostname
    if not hostname:
        return False

    if hostname in {"localhost", "0.0.0.0"}:
        return False

    try:
        address = ip_address(hostname)
    except ValueError:
        return True

    return not any(address in network for network in _PRIVATE_NETWORKS)
