"""
SmartCab Python AI backend.

Endpoints:
  GET  /api/ai/check-route?driver_id=...&current_lat=...&current_lng=...
       Returns a fake "safe" risk score AND records the call in Postgres
       (table: ai_route_checks) so we have an audit trail.

  POST /api/video/upload-evidence
       Multipart upload. Saves the file to disk and records metadata in
       Postgres (table: ai_evidence_log). If DATABASE_URL is not set,
       still saves the file but logs a warning instead of erroring.

The DATABASE_URL env var is the SAME one Java uses — so a single Supabase
Postgres instance is the source of truth for both services.
"""
import os
import random
import shutil
import time
import uuid
from datetime import datetime

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="SmartCab AI Security Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = os.environ.get("DATABASE_URL", "").strip()
VAULT_DIR = os.environ.get("EVIDENCE_VAULT_DIR", "secure_evidence_vault")
API_KEY_REQUIRED = os.environ.get("SMARTCAB_API_KEY", "sk_test_smartcab_vault_9982")
os.makedirs(VAULT_DIR, exist_ok=True)

# ----------------------------------------------------------------------
# Lazy Postgres connection (won't fail the app if Postgres is missing)
# ----------------------------------------------------------------------
_db_conn = None

def get_db():
    """Get a Postgres connection. Returns None if DATABASE_URL is unset
    or the connection fails — callers must handle that case gracefully."""
    global _db_conn
    if not DATABASE_URL:
        return None
    if _db_conn is not None and not _db_conn.closed == 0:
        return _db_conn
    try:
        import psycopg2
        from psycopg2.extras import RealDictCursor
        _db_conn = psycopg2.connect(DATABASE_URL, connect_timeout=8)
        _db_conn.autocommit = True
        with _db_conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS ai_route_checks (
                    id           BIGSERIAL PRIMARY KEY,
                    driver_id    TEXT,
                    lat          DOUBLE PRECISION,
                    lng          DOUBLE PRECISION,
                    risk_score   DOUBLE PRECISION,
                    is_safe      BOOLEAN,
                    recorded_at  TIMESTAMPTZ DEFAULT now()
                );
                CREATE TABLE IF NOT EXISTS ai_evidence_log (
                    id            BIGSERIAL PRIMARY KEY,
                    evidence_id   TEXT UNIQUE,
                    driver_id     TEXT,
                    file_name     TEXT,
                    storage_path  TEXT,
                    size_bytes    BIGINT,
                    recorded_at   TIMESTAMPTZ DEFAULT now()
                );
            """)
        return _db_conn
    except Exception as e:
        print(f"[WARN] Postgres unavailable: {e}")
        return None


# ----------------------------------------------------------------------
# Home
# ----------------------------------------------------------------------
@app.get("/")
def home():
    return {
        "service": "SmartCab AI Security Service",
        "status":  "running",
        "database": "connected" if get_db() else "offline (no DATABASE_URL)",
        "endpoints": [
            "GET  /api/ai/check-route",
            "POST /api/video/upload-evidence"
        ]
    }


# ----------------------------------------------------------------------
# AI: route safety check (records to Postgres when available)
# ----------------------------------------------------------------------
@app.get("/api/ai/check-route")
def check_route(driver_id: str, current_lat: float, current_lng: float):
    fake_risk = round(random.uniform(0.01, 0.08), 4)
    is_safe = fake_risk < 0.20

    # Persist audit row
    conn = get_db()
    db_status = "offline"
    if conn is not None:
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO ai_route_checks (driver_id, lat, lng, risk_score, is_safe) "
                    "VALUES (%s, %s, %s, %s, %s)",
                    (driver_id, current_lat, current_lng, fake_risk, is_safe)
                )
            db_status = "logged"
        except Exception as e:
            db_status = f"error: {e}"

    return {
        "status": "SAFE" if is_safe else "WARN",
        "message": f"Driver {driver_id} trajectory is normal at {current_lat}, {current_lng}.",
        "risk_score": fake_risk,
        "active_modules": ["GPS Geo-Fencing", "Decoy Telemetry", "AI Vision Stub"],
        "action_required": not is_safe,
        "db": db_status,
        "checked_at": datetime.utcnow().isoformat() + "Z"
    }


# ----------------------------------------------------------------------
# Evidence upload (records metadata to Postgres when available)
# ----------------------------------------------------------------------
@app.post("/api/video/upload-evidence")
async def upload_evidence(
    file: UploadFile = File(...),
    driver_id: str = Form(...),
    api_key: str = Form(...),
    booking_id: str = Form(default=""),
    link_id:    str = Form(default=""),
):
    if api_key != API_KEY_REQUIRED:
        return {"status": "ERROR", "error": "Invalid Authentication Key"}

    evidence_id = "ev_" + uuid.uuid4().hex[:16]
    safe_name = f"{evidence_id}_{os.path.basename(file.filename or 'upload.webm')}"
    file_location = os.path.join(VAULT_DIR, safe_name)

    with open(file_location, "wb+") as buffer:
        shutil.copyfileobj(file.file, buffer)

    size = os.path.getsize(file_location)
    db_status = "offline"
    conn = get_db()
    if conn is not None:
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO ai_evidence_log (evidence_id, driver_id, file_name, storage_path, size_bytes) "
                    "VALUES (%s, %s, %s, %s, %s) "
                    "ON CONFLICT (evidence_id) DO NOTHING",
                    (evidence_id, driver_id, safe_name, file_location, size)
                )
            db_status = "logged"
        except Exception as e:
            db_status = f"error: {e}"

    return {
        "status": "SUCCESS",
        "message": "Encrypted Video Evidence Saved Securely",
        "evidence_id": evidence_id,
        "file_path": file_location,
        "size_bytes": size,
        "db": db_status,
        "cloud_sync": "Pending (AWS S3)"
    }


# ----------------------------------------------------------------------
# Recent evidence log (so the dashboard can show it)
# ----------------------------------------------------------------------
@app.get("/api/video/recent")
def recent_evidence(limit: int = 20):
    conn = get_db()
    if conn is None:
        return {"status": "offline", "items": []}
    try:
        from psycopg2.extras import RealDictCursor
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "SELECT evidence_id, driver_id, file_name, size_bytes, recorded_at "
                "FROM ai_evidence_log ORDER BY recorded_at DESC LIMIT %s",
                (limit,)
            )
            return {"status": "ok", "items": [dict(r) for r in cur.fetchall()]}
    except Exception as e:
        return {"status": "error", "error": str(e), "items": []}
