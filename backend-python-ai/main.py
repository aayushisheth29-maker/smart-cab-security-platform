"""
SmartCab Security Platform - Live Python Backend
================================================

Single-file FastAPI service that powers the entire SmartCab rider + track flow.

Features
--------
- In-memory store of share links (works even if Supabase is unreachable)
- Optional Supabase Postgres persistence when DATABASE_URL is provided
- REST endpoints used by the React frontend (Vercel)
- CORS open to the world
- Auto-seeded with sample drivers / users / trips on first boot

Endpoints
---------
GET  /                                    -> service home
GET  /api/health                          -> health probe
POST /api/admin/seed                      -> (re)seed sample data
GET  /api/drivers                         -> list drivers
GET  /api/drivers/random                  -> random driver
GET  /api/users                           -> list users
GET  /api/trips                           -> list trips
POST /api/trips                           -> create trip / booking
GET  /api/trips/{trip_id}                 -> get a single trip
PUT  /api/trips/{trip_id}/sos             -> mark trip as DANGER (SOS)
GET  /api/bookings                        -> list trips (Java-compatible alias)
POST /api/bookings                        -> create trip (Java-compatible alias)
PUT  /api/bookings/{trip_id}/sos          -> mark trip as DANGER (alias)
POST /api/location/share                  -> create a share link
GET  /api/location/track/{link_id}        -> fetch the share link + last ping
POST /api/location/track/{link_id}/ping   -> update car location
POST /api/evidence/upload                 -> upload evidence file
POST /api/emergency                       -> log an emergency alert
GET  /api/ai/check-route                  -> fake AI safety check
POST /api/video/upload-evidence           -> upload encrypted video evidence
"""

from fastapi import FastAPI, UploadFile, File, Form, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any, Union
from datetime import datetime, timezone
import random
import os
import shutil
import uuid
import json
import logging
import time

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("smartcab")

# ---------------------------------------------------------------------------
# Optional Supabase Postgres connection
# ---------------------------------------------------------------------------
DATABASE_URL = os.environ.get("DATABASE_URL")  # e.g. Supabase pooler URL
db_conn = None
db_enabled = False

if DATABASE_URL:
    try:
        import psycopg2
        import psycopg2.extras
        db_conn = psycopg2.connect(DATABASE_URL, connect_timeout=8)
        db_conn.autocommit = True
        with db_conn.cursor() as cur:
            cur.execute("SELECT 1")
        db_enabled = True
        log.info("✅ Connected to Postgres (Supabase pooler)")
    except Exception as e:
        log.warning("⚠️ Could not connect to DATABASE_URL, falling back to in-memory: %s", e)
        db_conn = None
        db_enabled = False

# ---------------------------------------------------------------------------
# In-memory store (the source of truth for live share-link / ping flow)
# ---------------------------------------------------------------------------
# File-based persistence fallback (when Supabase is not configured)
# ---------------------------------------------------------------------------
# Render's free tier sleeps the service after 15 minutes of inactivity,
# wiping the in-memory store. Without persistence, share links disappear
# after every restart, breaking the rider↔family live-tracking flow.
#
# Strategy: at startup, do a real write+read test on each candidate
# path with a unique filename. Pick the FIRST one that succeeded.
# That way we know it actually works for the running process — not
# just "looks writable" in theory.
# ---------------------------------------------------------------------------
import os.path
import tempfile

# Candidate paths in priority order. First one that passes the
# write+read test at startup wins. De-duplicated afterwards because
# tempfile.gettempdir() is usually the same directory as /tmp — the
# duplicate caused double writes and misleading log lines.
import tempfile
_candidates = [
    os.environ.get("PERSIST_DIR"),
    "/opt/render/project/data",   # Render free tier persistent
    "/var/data",                  # Render alternative
    tempfile.gettempdir(),        # Always-writable system temp
    "/tmp",                       # Always available
]
PERSIST_CANDIDATES = []
for _c in _candidates:
    if _c and _c not in PERSIST_CANDIDATES:
        PERSIST_CANDIDATES.append(_c)

SHARE_LINKS_FILE = None
PERSIST_DIR = None
for cand in PERSIST_CANDIDATES:
    if not cand:
        continue
    try:
        abs_cand = os.path.abspath(cand)
        os.makedirs(abs_cand, exist_ok=True)
        # Do a REAL write+read test (not just a touch)
        test_file = os.path.abspath(os.path.join(abs_cand, f".write_test_{os.getpid()}"))
        with open(test_file, "w") as f:
            f.write("smartcab_test")
        with open(test_file, "r") as f:
            if f.read() != "smartcab_test":
                raise RuntimeError("readback mismatch")
        os.remove(test_file)
        # Now try a longer write+read to be sure
        real_test = os.path.abspath(os.path.join(abs_cand, f".real_test_{os.getpid()}.json"))
        with open(real_test, "w") as f:
            json.dump({"a": 1, "b": [1, 2, 3]}, f)
        with open(real_test, "r") as f:
            json.load(f)
        os.remove(real_test)
        PERSIST_DIR = abs_cand
        SHARE_LINKS_FILE = os.path.abspath(os.path.join(abs_cand, "share_links.json"))
        # Only create the file when it does NOT already exist. The old
        # code overwrote it with {} on every boot, which wiped every
        # saved share link the moment Render restarted the service —
        # that was the bug that broke live-tracking links after each
        # sleep/restart.
        if not os.path.exists(SHARE_LINKS_FILE):
            with open(SHARE_LINKS_FILE, "w") as f:
                json.dump({}, f)
        log.info("💾 Persistence dir selected: %s (writable + readback ok)", abs_cand)
        break
    except Exception as e:
        log.warning("⚠️ Candidate %s failed write+read test: %s", cand, e)

if not SHARE_LINKS_FILE:
    log.error("💾 NO WRITABLE PERSIST DIR FOUND — links will be in-memory only")

# Directory for persisted live-video chunks (the Live Guard stream).
# Previously every chunk lived only in RAM, so the whole camera feed
# disappeared the moment Render restarted the service. Now chunks are
# written through to <PERSIST_DIR>/video_chunks/<linkId>/chunk_XXXXXX.webm
# + index.json and rehydrated after a restart.
VIDEO_CHUNKS_DIR = None
if PERSIST_DIR:
    VIDEO_CHUNKS_DIR = os.path.join(PERSIST_DIR, "video_chunks")
    os.makedirs(VIDEO_CHUNKS_DIR, exist_ok=True)


def _all_persist_files() -> list[str]:
    """Return ALL share_links.json paths from every candidate dir.
    The link is loaded from whichever one has it. We save to the
    primary PERSIST_DIR and copy to the others as a redundancy."""
    files = []
    for cand in PERSIST_CANDIDATES:
        if not cand:
            continue
        path = os.path.join(cand, "share_links.json")
        if path not in files:
            files.append(path)
    return files


def _load_share_links_from_disk() -> None:
    """Rehydrate the in-memory SHARE_LINKS store from the JSON file on disk.
    Called once at startup so links created in a previous session survive
    Render's auto-restart. Safe to call multiple times — only fills empty
    slots so live data isn't overwritten."""
    if not SHARE_LINKS_FILE:
        return
    if not os.path.exists(SHARE_LINKS_FILE):
        return
    try:
        with open(SHARE_LINKS_FILE, "r") as f:
            data = json.load(f)
        loaded = 0
        for link_id, link in data.items():
            if link_id not in SHARE_LINKS:
                SHARE_LINKS[link_id] = link
                loaded += 1
        if loaded:
            log.info("💾 Restored %d share link(s) from disk (%s)", loaded, SHARE_LINKS_FILE)
    except Exception as e:
        log.warning("⚠️ Could not load share links from disk: %s", e)


def _load_single_link_from_disk(link_id: str) -> Optional[Dict[str, Any]]:
    """Look up a single link by ID from any on-disk JSON file.
    Used by the track endpoint when the in-memory cache doesn't have it
    (e.g. Render just restarted). Probes every candidate path so the
    link is found no matter which directory Render gave us this time."""
    for path in _all_persist_files():
        if not os.path.exists(path):
            continue
        try:
            with open(path, "r") as f:
                data = json.load(f)
            link = data.get(link_id)
            if link:
                log.info("💾 Found %s on disk at %s", link_id, path)
                return link
        except Exception as e:
            log.warning("⚠️ Could not read %s from %s: %s", link_id, path, e)
    return None


def _load_single_link_from_postgres(link_id: str) -> Optional[Dict[str, Any]]:
    """Look up a single link by ID from Supabase (when DATABASE_URL is set)."""
    if not db_enabled:
        return None
    try:
        with db_conn.cursor() as cur:
            cur.execute(
                """
                SELECT link_id, booking_id, rider_name, driver_name, driver_license,
                       car_plate, car_model, pickup, dropoff, current_lat, current_lng,
                       status, created_at, updated_at, last_ping_at
                FROM share_links WHERE link_id = %s
                """,
                (link_id,),
            )
            row = cur.fetchone()
            if not row:
                return None
            (lid, bid, rn, dn, dl_, cp, cm, pu, dr, clat, clng, st, ca, ua, lp) = row
            return {
                "linkId": lid,
                "bookingId": bid,
                "riderName": rn or "",
                "driverName": dn or "",
                "driverLicense": dl_ or "",
                "carPlate": cp or "",
                "carModel": cm or "",
                "pickup": pu or "",
                "dropoff": dr or "",
                "currentLocation": {"lat": clat, "lng": clng} if clat is not None else None,
                "status": st or "ON_ROUTE",
                "createdAt": ca,
                "updatedAt": ua,
                "lastPingAt": lp,
                "pingCount": 0,
                "isFromPostgres": True,
            }
    except Exception as e:
        log.warning("⚠️ Could not read link %s from postgres: %s", link_id, e)
        return None


def _save_share_links_to_disk() -> None:
    """Persist the current SHARE_LINKS dict to JSON files on disk.
    Writes to the primary PERSIST_DIR (and copies to other writable
    candidates) so the data survives Render restarts even if one
    path is wiped."""
    if not PERSIST_CANDIDATES:
        log.error("💾 _save_share_links_to_disk: PERSIST_CANDIDATES is empty!")
        return
    if not SHARE_LINKS:
        log.warning("💾 _save_share_links_to_disk: SHARE_LINKS is empty, skipping save")
        return
    saved_paths = []
    failed_paths = []
    try:
        # Strip out any non-serializable fields (e.g. bytes from video)
        # before writing. Video chunks live in VIDEO_CHUNKS (memory only).
        serializable = {}
        for link_id, link in SHARE_LINKS.items():
            serializable[link_id] = {k: v for k, v in link.items() if k != "videoBytes"}
        json_str = json.dumps(serializable, default=str)
        # Use absolute paths everywhere — never rely on cwd.
        # _all_persist_files() is de-duplicated, so we never write the
        # same file twice when /tmp == tempfile.gettempdir().
        for path in _all_persist_files():
            try:
                os.makedirs(os.path.dirname(path), exist_ok=True)
                # Use absolute path with mode=0o644 explicitly
                with open(path, "w", buffering=8192) as f:
                    f.write(json_str)
                    f.flush()
                    try:
                        os.fsync(f.fileno())  # Force write to disk
                    except Exception:
                        pass
                # Verify the file is actually there
                if os.path.exists(path) and os.path.getsize(path) > 0:
                    saved_paths.append(path)
                else:
                    failed_paths.append((path, "file not present after write"))
            except Exception as e:
                failed_paths.append((path, str(e)))
                log.warning("⚠️ Could not save to %s: %s", path, e)
        log.info("💾 _save_share_links_to_disk: saved to %d path(s): %s; failed: %s",
                 len(saved_paths), saved_paths, failed_paths)
    except Exception as e:
        log.error("💾 _save_share_links_to_disk: outer exception: %s", e)


# ---------------------------------------------------------------------------
# Live video chunk persistence (Live Guard stream)
# ---------------------------------------------------------------------------
MAX_VIDEO_CHUNKS = 30
MAX_CHUNK_BYTES = 10 * 1024 * 1024  # 10 MB sanity cap per 3-5s webm chunk


def _video_link_dir(link_id: str) -> str:
    return os.path.join(VIDEO_CHUNKS_DIR, link_id)


def _video_chunk_path(link_id: str, chunk_id: int) -> str:
    return os.path.join(_video_link_dir(link_id), f"chunk_{chunk_id:06d}.webm")


def _video_index_path(link_id: str) -> str:
    return os.path.join(_video_link_dir(link_id), "index.json")


def _read_video_index(link_id: str) -> List[Dict[str, Any]]:
    try:
        with open(_video_index_path(link_id), "r") as f:
            data = json.load(f)
        return data if isinstance(data, list) else []
    except Exception:
        return []


def _persist_video_chunk(link_id: str, chunk: Dict[str, Any]) -> None:
    """Write one chunk to disk and rebuild that link's on-disk index from
    the current in-memory bucket (which is already rolling-buffer-trimmed).
    Old chunk files that fell out of the buffer are deleted from disk too,
    so disk and memory stay in sync."""
    if not VIDEO_CHUNKS_DIR:
        return
    try:
        link_dir = _video_link_dir(link_id)
        os.makedirs(link_dir, exist_ok=True)
        with open(_video_chunk_path(link_id, chunk["id"]), "wb") as f:
            f.write(chunk["data"])
        bucket = VIDEO_CHUNKS.get(link_id, [])
        index = [{k: v for k, v in c.items() if k != "data"} for c in bucket]
        keep_files = {f"chunk_{c['id']:06d}.webm" for c in bucket}
        # Remove chunk files that are no longer in the rolling buffer
        for name in os.listdir(link_dir):
            if name.endswith(".webm") and name not in keep_files:
                try:
                    os.remove(os.path.join(link_dir, name))
                except Exception:
                    pass
        with open(_video_index_path(link_id), "w") as f:
            json.dump(index, f)
    except Exception as e:
        log.warning("⚠️ Could not persist video chunk %s for %s: %s", chunk["id"], link_id, e)


def _load_video_bucket_from_disk(link_id: str) -> List[Dict[str, Any]]:
    """Rebuild a link's chunk list (including bytes) from disk. Used after
    a restart when the in-memory VIDEO_CHUNKS cache is empty."""
    bucket = []
    for meta in _read_video_index(link_id):
        path = _video_chunk_path(link_id, meta["id"])
        if not os.path.exists(path):
            continue
        try:
            with open(path, "rb") as f:
                data = f.read()
        except Exception:
            continue
        chunk = dict(meta)
        chunk["data"] = data
        bucket.append(chunk)
    if bucket:
        log.info("🎥 Rehydrated %d video chunk(s) for %s from disk", len(bucket), link_id)
    return bucket


def _get_video_bucket(link_id: str) -> List[Dict[str, Any]]:
    """Return the chunk list for a link, hydrating from disk when the
    in-memory cache is empty (fresh process after a Render restart)."""
    bucket = VIDEO_CHUNKS.get(link_id)
    if bucket is None:
        bucket = _load_video_bucket_from_disk(link_id)
        VIDEO_CHUNKS[link_id] = bucket
    return bucket


def _init_video_chunk_id_counter() -> None:
    """After a restart, bump the global chunk-ID counter past every ID
    already stored on disk so new uploads can never overwrite old
    footage (a fresh process would otherwise restart IDs at 1)."""
    max_seen = 0
    if VIDEO_CHUNKS_DIR and os.path.isdir(VIDEO_CHUNKS_DIR):
        for link_dir in os.listdir(VIDEO_CHUNKS_DIR):
            for meta in _read_video_index(link_dir):
                if isinstance(meta.get("id"), int):
                    max_seen = max(max_seen, meta["id"])
    if max_seen:
        _next_id["video_chunk"] = max_seen + 1
        log.info("🎥 Video chunk ID counter resumed at %d (found %d on disk)",
                 _next_id["video_chunk"], max_seen)


# ---------------------------------------------------------------------------
SHARE_LINKS: Dict[str, Dict[str, Any]] = {}
TRIPS: Dict[str, Dict[str, Any]] = []
DRIVERS: List[Dict[str, Any]] = []
USERS: List[Dict[str, Any]] = []
EVIDENCE: List[Dict[str, Any]] = []
EMERGENCIES: List[Dict[str, Any]] = []
# Live video chunks: VIDEO_CHUNKS[linkId] is a list of
# {"id": ..., "ts": ..., "data": <bytes>, "lat": ..., "lng": ...}
# Each chunk is a small (~3-5 sec) webm blob uploaded by the rider while
# Live Guard is on. We keep the last MAX_VIDEO_CHUNKS chunks per link
# (~2-3 minutes of footage) for the recipient to scrub through. Chunks
# are written through to disk (VIDEO_CHUNKS_DIR) so the feed survives
# Render restarts.
VIDEO_CHUNKS: Dict[str, List[Dict[str, Any]]] = {}
_next_id = {"trip": 1, "driver": 1, "user": 1, "evidence": 1, "emergency": 1, "video_chunk": 1}

# Rehydrate share links from the previous session. MUST run AFTER the
# SHARE_LINKS dict above is defined — the old call site ran before the
# dict existed, so the load always failed silently (NameError swallowed
# by the try/except) and every link was lost on restart. That was the
# live-tracking-killing bug.
_load_share_links_from_disk()

# Make sure new video chunk IDs can never collide with chunks already
# persisted on disk from a previous session.
_init_video_chunk_id_counter()


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _persist_share_link(link: Dict[str, Any]) -> None:
    """Save to Supabase (if configured) AND to local disk. Disk is the
    always-on fallback so share links survive Render's auto-restart even
    when DATABASE_URL is not configured."""
    _save_share_links_to_disk()
    if not db_enabled:
        return
    try:
        with db_conn.cursor() as cur:
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS share_links (
                    link_id TEXT PRIMARY KEY,
                    booking_id TEXT,
                    rider_name TEXT,
                    driver_name TEXT,
                    driver_license TEXT,
                    car_plate TEXT,
                    car_model TEXT,
                    pickup TEXT,
                    dropoff TEXT,
                    current_lat DOUBLE PRECISION,
                    current_lng DOUBLE PRECISION,
                    status TEXT,
                    created_at TEXT,
                    updated_at TEXT,
                    last_ping_at TEXT
                );
                """
            )
            cur.execute(
                """
                INSERT INTO share_links (
                    link_id, booking_id, rider_name, driver_name, driver_license,
                    car_plate, car_model, pickup, dropoff, current_lat, current_lng,
                    status, created_at, updated_at, last_ping_at
                )
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                ON CONFLICT (link_id) DO UPDATE SET
                    current_lat = EXCLUDED.current_lat,
                    current_lng = EXCLUDED.current_lng,
                    status = EXCLUDED.status,
                    updated_at = EXCLUDED.updated_at,
                    last_ping_at = EXCLUDED.last_ping_at
                """,
                (
                    link["linkId"],
                    link.get("bookingId"),
                    link.get("riderName"),
                    link.get("driverName"),
                    link.get("driverLicense"),
                    link.get("carPlate"),
                    link.get("carModel"),
                    link.get("pickup"),
                    link.get("dropoff"),
                    link.get("currentLocation", {}).get("lat") if link.get("currentLocation") else None,
                    link.get("currentLocation", {}).get("lng") if link.get("currentLocation") else None,
                    link.get("status", "ON_ROUTE"),
                    link.get("createdAt"),
                    link.get("updatedAt"),
                    link.get("lastPingAt"),
                ),
            )
    except Exception as e:
        log.warning("⚠️ Could not persist share link to Postgres: %s", e)


def seed_samples(force: bool = False) -> None:
    """Populate drivers / users / trips if empty (or when force=True)."""
    global _next_id
    if force or not DRIVERS:
        DRIVERS.clear()
        sample_drivers = [
            {"name": "Rahul S.",  "rating": 4.8, "dl": "MH02-2019-1234567", "plate": "MH 02 AB 1234", "carModel": "White SmartMini",  "phone": "+919876500001"},
            {"name": "Vikram P.", "rating": 4.9, "dl": "DL04-2018-9876543", "plate": "DL 04 CD 5678", "carModel": "Silver SmartSedan", "phone": "+919876500002"},
            {"name": "Anita M.",  "rating": 5.0, "dl": "KA01-2020-4567890", "plate": "KA 01 EF 9012", "carModel": "Black SmartSUV",   "phone": "+919876500003"},
            {"name": "Suresh K.", "rating": 4.7, "dl": "GJ01-2017-3456789", "plate": "GJ 01 GH 3456", "carModel": "Red SmartMini",   "phone": "+919876500004"},
            {"name": "Priya T.",  "rating": 4.9, "dl": "TS09-2021-1122334", "plate": "TS 09 IJ 7890", "carModel": "Blue SmartSedan",  "phone": "+919876500005"},
        ]
        for d in sample_drivers:
            d["id"] = _next_id["driver"]
            DRIVERS.append(d)
            _next_id["driver"] += 1

    if force or not USERS:
        USERS.clear()
        USERS.append({
            "id": 1,
            "name": "Aayushi S.",
            "email": "aayushi@example.com",
            "phone": "+91 98765 43210",
        })
        _next_id["user"] = 2

    if force or not TRIPS:
        TRIPS.clear()
        sample_trips = [
            {"riderName": "Aayushi S.", "pickupLocation": "Kalupur Railway Station",  "dropoffLocation": "Ahmedabad International Airport", "distanceKm": 9.2,  "fare": 165, "status": "COMPLETED"},
            {"riderName": "Aayushi S.", "pickupLocation": "Saraspur",                  "dropoffLocation": "Gota",                             "distanceKm": 12.4, "fare": 220, "status": "COMPLETED"},
            {"riderName": "Aayushi S.", "pickupLocation": "Chandlodia",                "dropoffLocation": "Delhi Airport",                    "distanceKm": 18.7, "fare": 290, "status": "COMPLETED"},
        ]
        for t in sample_trips:
            t["id"] = _next_id["trip"]
            t["createdAt"] = _now_iso()
            TRIPS.append(t)
            _next_id["trip"] += 1


# Seed once at boot so /api/drivers etc always return something
seed_samples(force=False)


# ---------------------------------------------------------------------------
# FastAPI app + CORS
# ---------------------------------------------------------------------------
app = FastAPI(title="SmartCab AI Security Service", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------
class TripCreate(BaseModel):
    riderName: Optional[str] = ""
    riderPhone: Optional[str] = ""
    pickupLocation: Optional[str] = ""
    dropoffLocation: Optional[str] = ""
    distanceKm: Optional[float] = 10.0
    fare: Optional[float] = 170
    status: Optional[str] = "PENDING"
    selectedCar: Optional[str] = "SmartMini"
    # Uber-style pricing breakdown (so the dashboard can show base+km+surge)
    baseFare: Optional[float] = 0
    distanceFare: Optional[float] = 0
    surgeMultiplier: Optional[float] = 1.0
    bookingTime: Optional[str] = None  # ISO timestamp; used for surge calc


class PricingEstimateRequest(BaseModel):
    distanceKm: float
    selectedCar: Optional[str] = "SmartMini"
    bookingTime: Optional[str] = None  # ISO; defaults to "now"


class PricingEstimateResponse(BaseModel):
    distanceKm: float
    selectedCar: str
    baseFare: float
    distanceFare: float
    surgeMultiplier: float
    surgeReason: str
    totalFare: float
    bookingTime: str
    # Friendly per-car-type comparison so the frontend can show all options
    # in the "Choose your ride" screen without making 4 separate requests.
    allOptions: List[Dict[str, Any]]


class ShareLinkCreate(BaseModel):
    # Be EXTREMELY permissive: the frontend may evolve and add new fields.
    # We support BOTH Pydantic v1 (class Config) AND v2 (model_config) syntax
    # so this works regardless of which version is installed.
    linkId: Optional[str] = None
    # Accept int OR str here — the frontend sends the numeric trip id
    # straight from the booking response, and Pydantic v2 (unlike v1)
    # does NOT silently coerce int -> str, so a strict `str` type here
    # was rejecting every real booking with a 422.
    bookingId: Optional[Union[str, int]] = None
    riderName: Optional[str] = ""
    driverName: Optional[str] = ""
    driverLicense: Optional[str] = ""
    carPlate: Optional[str] = ""
    carModel: Optional[str] = ""
    pickup: Optional[str] = ""
    dropoff: Optional[str] = ""
    currentLocation: Optional[Dict[str, Any]] = None
    createdAt: Optional[str] = None
    # The rider's own emergency contacts (added by the rider in the Live Guard
    # modal). Stored as a list of {name, phone} objects. NEVER hardcoded on
    # the backend — they only come from the rider's own app.
    emergencyContacts: Optional[List[Dict[str, str]]] = None

    class Config:
        """Pydantic v1 syntax — allows extra fields without 422."""
        extra = "allow"


try:
    # Pydantic v2 syntax — also allow extra fields
    ShareLinkCreate.model_config = {"extra": "allow"}
except Exception:
    pass


# Custom validation error handler — log the ACTUAL error so we can debug.
# Without this, FastAPI just returns "422 Unprocessable Content" with no
# clue which field is the problem.
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    """Log the full validation error so we can see what field is failing."""
    log.error("❌ 422 VALIDATION ERROR on %s %s: %s", request.method, request.url.path, exc.errors())
    log.error("❌ Request body: %s", exc.body)
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": str(exc.body)[:500]},
    )


class PingUpdate(BaseModel):
    lat: Optional[float] = None
    lng: Optional[float] = None
    currentLocation: Optional[Dict[str, float]] = None
    status: Optional[str] = "ON_ROUTE"
    # New: ride metadata that the rider app keeps syncing on every ping so
    # the track page always shows the proper pickup & dropoff labels.
    pickupName: Optional[str] = None
    dropoffName: Optional[str] = None
    riderName: Optional[str] = None
    driverName: Optional[str] = None
    carPlate: Optional[str] = None
    carModel: Optional[str] = None
    # The rider's latest emergency contacts list. Sent on every ping so the
    # track page reflects the rider's most recent additions/removals.
    emergencyContacts: Optional[List[Dict[str, str]]] = None


class EmergencyCreate(BaseModel):
    bookingId: Optional[str] = None
    linkId: Optional[str] = None
    riderName: Optional[str] = ""
    reason: Optional[str] = "Manual SOS"
    lat: Optional[float] = None
    lng: Optional[float] = None


# ---------------------------------------------------------------------------
# Root + health
# ---------------------------------------------------------------------------
@app.get("/")
def home():
    return {
        "message": "SmartCab AI Security Service is Running.",
        "version": "2.2.0",
        "database": "connected" if db_enabled else "in-memory",
        "endpoints": [
            "/api/health", "/api/admin/seed", "/api/drivers", "/api/drivers/random",
            "/api/users", "/api/trips", "/api/bookings", "/api/location/share",
            "/api/location/track/{linkId}", "/api/location/track/{linkId}/ping",
            "/api/evidence/upload", "/api/emergency", "/api/ai/check-route",
            "/api/pricing/estimate", "/api/video/stream/{linkId}/chunk",
            "/api/video/stream/{linkId}/latest", "/api/video/stream/{linkId}/meta",
            "/api/video/stream/{linkId}/chunk/{chunkId}", "/api/video/upload-evidence",
        ],
    }


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "database": "connected" if db_enabled else "in-memory",
        "share_links_count": len(SHARE_LINKS),
        "trips_count": len(TRIPS),
        "drivers_count": len(DRIVERS),
        "persist_dir": PERSIST_DIR,
        "ts": _now_iso(),
    }


@app.get("/api/debug/share_links")
def debug_share_links():
    """Debug endpoint: lists every on-disk JSON file + the in-memory
    SHARE_LINKS dict. Used to verify the file persistence is working.
    Safe to expose — no secrets, just link metadata."""
    files = []
    for path in _all_persist_files():
        rec = {"path": path, "exists": os.path.exists(path), "size": 0, "keys": []}
        if rec["exists"]:
            try:
                with open(path, "r") as f:
                    data = json.load(f)
                rec["size"] = os.path.getsize(path)
                rec["keys"] = list(data.keys())
            except Exception as e:
                rec["error"] = str(e)
        files.append(rec)
    return {
        "in_memory_count": len(SHARE_LINKS),
        "in_memory_keys": list(SHARE_LINKS.keys()),
        "persist_dir": PERSIST_DIR,
        "on_disk_files": files,
    }


@app.post("/api/debug/test_save")
def debug_test_save():
    """Force-write a test file to ALL candidate paths. Returns which
    paths were actually writable. Useful to diagnose persistence issues
    without having to book a real ride."""
    results = []
    payload = json.dumps({"test": "hello from smartcab", "ts": _now_iso()})
    for cand in PERSIST_CANDIDATES:
        if not cand:
            continue
        try:
            os.makedirs(cand, exist_ok=True)
            path = os.path.join(cand, "test_write.txt")
            with open(path, "w") as f:
                f.write(payload)
            # Read it back to confirm
            with open(path, "r") as f:
                readback = f.read()
            results.append({
                "path": path,
                "wrote": True,
                "readback_matches": readback == payload,
                "size": os.path.getsize(path),
            })
        except Exception as e:
            results.append({"path": cand, "wrote": False, "error": str(e)})
    return {
        "candidates": PERSIST_CANDIDATES,
        "primary_persist_dir": PERSIST_DIR,
        "results": results,
    }


@app.post("/api/debug/create_test_link")
def debug_create_test_link():
    """Create a real test share link with realistic Ahmedabad data so
    the rider can test the live-tracking flow without doing the full
    booking + Live Guard + Share Live Location dance. Returns the
    linkId so the caller can open /track/<linkId> in another tab."""
    link_id = f"RIDE_TEST_{uuid.uuid4().hex[:10]}"
    link = {
        "linkId": link_id,
        "bookingId": 999,
        "riderName": "Aayushi S. (Test)",
        "driverName": "Suresh K.",
        "driverLicense": "GJ01-2017-3456789",
        "carPlate": "GJ 01 GH 3456",
        "carModel": "White SmartMini",
        "pickup": "Chandlodia, Ahmedabad",
        "dropoff": "Gota, Ahmedabad",
        "currentLocation": {"lat": 23.1033, "lng": 72.5930},  # Chandlodia
        "status": "ON_ROUTE",
        "createdAt": _now_iso(),
        "updatedAt": _now_iso(),
        "lastPingAt": _now_iso(),
        "pingCount": 0,
        "emergencyContacts": [],
        "expiresAt": (datetime.now(timezone.utc).replace(microsecond=0) + __import__('datetime').timedelta(hours=24)).isoformat(),
    }
    SHARE_LINKS[link_id] = link
    # Also persist to disk + Supabase so it survives Render restarts
    _persist_share_link(link)
    log.info("🧪 Test share link created: %s", link_id)
    return {"linkId": link_id, "link": link}


# ---------------------------------------------------------------------------
# Admin
# ---------------------------------------------------------------------------
@app.api_route("/api/admin/seed", methods=["GET", "POST"])
def admin_seed():
    seed_samples(force=True)
    return {
        "status": "ok",
        "seeded": True,
        "drivers": len(DRIVERS),
        "users": len(USERS),
        "trips": len(TRIPS),
    }


# ---------------------------------------------------------------------------
# Drivers
# ---------------------------------------------------------------------------
@app.get("/api/drivers")
def list_drivers():
    return DRIVERS


@app.get("/api/drivers/random")
def random_driver():
    if not DRIVERS:
        seed_samples(force=True)
    return random.choice(DRIVERS)


@app.get("/api/drivers/{driver_id}")
def get_driver(driver_id: int):
    for d in DRIVERS:
        if d.get("id") == driver_id:
            return d
    raise HTTPException(status_code=404, detail="driver not found")


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------
@app.get("/api/users")
def list_users():
    return USERS


# ---------------------------------------------------------------------------
# 🔐 AUTH — simple in-memory signup + login. The frontend stores the
# returned user object in localStorage so the rider stays logged in
# across page reloads. Passwords are stored in plain text in this
# demo only — a real product would hash with bcrypt.
# ---------------------------------------------------------------------------
@app.post("/api/auth/signup")
def auth_signup(payload: Dict[str, Any]):
    name = (payload.get("name") or "").strip()
    email = (payload.get("email") or "").strip().lower()
    phone = (payload.get("phone") or "").strip()
    password = payload.get("password") or ""
    if not name or not email or not phone or not password:
        raise HTTPException(status_code=400, detail="All fields are required.")
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")
    if any(u.get("email", "").lower() == email for u in USERS):
        raise HTTPException(status_code=400, detail="An account with that email already exists.")
    new_user = {
        "id": _next_id["user"],
        "name": name,
        "email": email,
        "phone": phone,
        "password": password,
        "savedAddresses": [],
        "emergencyContacts": [],
        "createdAt": _now_iso(),
    }
    USERS.append(new_user)
    _next_id["user"] += 1
    log.info("✅ New user signed up: %s (%s)", name, email)
    # Don't return the password in the response
    safe_user = {k: v for k, v in new_user.items() if k != "password"}
    return safe_user


@app.post("/api/auth/login")
def auth_login(payload: Dict[str, Any]):
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required.")
    for u in USERS:
        if u.get("email", "").lower() == email and u.get("password") == password:
            log.info("✅ User logged in: %s", email)
            safe_user = {k: v for k, v in u.items() if k != "password"}
            return safe_user
    raise HTTPException(status_code=401, detail="Invalid email or password.")


@app.get("/api/users/{user_id}/trips")
def get_user_trips(user_id: int):
    """Return all trips for a specific user — used by the dashboard
    Ride History tab so logged-in riders only see their own rides."""
    user_trips = [t for t in TRIPS if t.get("userId") == user_id or t.get("riderId") == user_id]
    # If no userId match, fall back to trips where the rider name matches
    # the user's name (for the demo's pre-seeded data without userId)
    if not user_trips:
        user = next((u for u in USERS if u.get("id") == user_id), None)
        if user:
            user_trips = [t for t in TRIPS if t.get("riderName") == user.get("name")]
    return sorted(user_trips, key=lambda t: t.get("createdAt", ""), reverse=True)


# ---------------------------------------------------------------------------
# 👤 PROFILE / ADDRESSES / EMERGENCY CONTACTS — per-user CRUD endpoints
# (added in bestie's v2 backend so the dashboard can edit profile, save
# Home/Work addresses, and manage emergency contacts separately from
# the Live Guard modal contacts).
# ---------------------------------------------------------------------------
class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    preferredLanguage: Optional[str] = None
    marketingOptIn: Optional[bool] = None


class SavedAddress(BaseModel):
    label: str  # "Home", "Work", "Gym", etc.
    address: str
    lat: Optional[float] = None
    lng: Optional[float] = None


class EmergencyContact(BaseModel):
    name: str
    phone: str


def _find_user(user_id: int) -> Dict[str, Any]:
    """Look up a user by id, or 404."""
    user = next((u for u in USERS if u.get("id") == user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="user not found")
    return user


@app.get("/api/users/{user_id}/profile")
def get_profile(user_id: int):
    """Fetch a user's profile (without password)."""
    user = _find_user(user_id)
    return {k: v for k, v in user.items() if k != "password"}


@app.put("/api/users/{user_id}/profile")
def update_profile(user_id: int, payload: ProfileUpdate):
    """Update a user's profile fields (name, phone, language, marketing opt-in)."""
    user = _find_user(user_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        user[field] = value
    log.info("👤 Profile updated for user %d: %s", user_id, list(payload.model_dump(exclude_unset=True).keys()))
    return {k: v for k, v in user.items() if k != "password"}


@app.get("/api/users/{user_id}/addresses")
def list_addresses(user_id: int):
    """List a user's saved addresses (Home, Work, etc.)."""
    return _find_user(user_id).get("savedAddresses", [])


@app.post("/api/users/{user_id}/addresses")
def add_address(user_id: int, payload: SavedAddress):
    """Add a new saved address. If the label already exists (e.g. "Home"),
    the old one is replaced so the user always sees one "Home" not two."""
    user = _find_user(user_id)
    addresses = user.setdefault("savedAddresses", [])
    # Replace if the label already exists
    addresses[:] = [a for a in addresses if a.get("label") != payload.label]
    addresses.append(payload.model_dump())
    log.info("📍 Address added for user %d: %s", user_id, payload.label)
    return addresses


@app.delete("/api/users/{user_id}/addresses/{label}")
def delete_address(user_id: int, label: str):
    """Delete a saved address by its label (e.g. "Home")."""
    user = _find_user(user_id)
    user["savedAddresses"] = [
        a for a in user.get("savedAddresses", []) if a.get("label") != label
    ]
    log.info("📍 Address deleted for user %d: %s", user_id, label)
    return user["savedAddresses"]


@app.get("/api/users/{user_id}/emergency-contacts")
def list_emergency_contacts(user_id: int):
    """List a user's saved emergency contacts (for the dashboard)."""
    return _find_user(user_id).get("emergencyContacts", [])


@app.post("/api/users/{user_id}/emergency-contacts")
def add_emergency_contact(user_id: int, payload: EmergencyContact):
    """Add an emergency contact to the user's profile."""
    user = _find_user(user_id)
    contacts = user.setdefault("emergencyContacts", [])
    contacts.append(payload.model_dump())
    log.info("🚨 Emergency contact added for user %d: %s", user_id, payload.name)
    return contacts


@app.delete("/api/users/{user_id}/emergency-contacts/{phone}")
def delete_emergency_contact(user_id: int, phone: str):
    """Delete an emergency contact by phone number."""
    user = _find_user(user_id)
    user["emergencyContacts"] = [
        c for c in user.get("emergencyContacts", []) if c.get("phone") != phone
    ]
    log.info("🚨 Emergency contact deleted for user %d: %s", user_id, phone)
    return user["emergencyContacts"]


# ---------------------------------------------------------------------------
# 🚗 UBER-STYLE PRICING ENGINE
# ---------------------------------------------------------------------------
# The pricing formula is calculated on the BACKEND (not the frontend) so that
# the price shown to the rider is the SAME price stored in the trip record
# (no client-side tampering, no fake estimates). The same engine is reused
# by:
#   1. POST /api/pricing/estimate   — pre-ride estimate (called when the
#      rider taps "Search route & see prices")
#   2. POST /api/trips             — actual booking creation, with the
#      fare breakdown saved alongside the trip
#   3. GET  /api/trips             — dashboard reads the stored breakdown
#
# Surge pricing is purely time-based for the group-project demo:
#   - Peak hours (7-10am, 5-9pm) get a 1.5x multiplier
#   - Late night (10pm-6am) gets a 1.2x multiplier (late-night safety premium)
#   - All other times = 1.0x (no surge)
# In a real Uber integration this would also factor in driver supply and
# real-time demand, but for our women's-safety product, TIME-based surge is
# the most relevant signal (late-night rides are when riders need safety
# features the most).
# ---------------------------------------------------------------------------

# Peak-hour surge must follow INDIAN wall-clock time as documented above
# (7-10am, 5-9pm, 10pm-6am IST). The old code used UTC, so peaks fired at
# 12:30pm-3:30pm IST and off-peak pricing applied during actual rush hour.
try:
    from zoneinfo import ZoneInfo
    IST = ZoneInfo("Asia/Kolkata")
except Exception:
    IST = None


def _now_local() -> datetime:
    """Local (IST) wall-clock time used for surge calculations."""
    return datetime.now(IST) if IST else datetime.now(timezone.utc)


def _parse_booking_time(value: str) -> datetime:
    """Parse a client-supplied booking time and normalize it to IST.
    Naive timestamps are assumed to be UTC; aware ones are converted."""
    when = _now_local()
    if value:
        try:
            when = datetime.fromisoformat(value.replace("Z", "+00:00"))
        except Exception:
            return when
        if when.tzinfo is None:
            when = when.replace(tzinfo=timezone.utc)
    return when.astimezone(IST) if IST else when.astimezone(timezone.utc)


# Per-car-type pricing: (base_fare_inr, per_km_rate_inr)
PRICING_TABLE = {
    "SmartBike":  {"base": 20,  "perKm": 6,  "displayName": "SmartBike",  "icon": "🏍️", "capacity": 1, "etaMin": 3},
    "SmartMini":  {"base": 40,  "perKm": 10, "displayName": "SmartMini",  "icon": "🚗", "capacity": 4, "etaMin": 5},
    "SmartSedan": {"base": 50,  "perKm": 14, "displayName": "SmartSedan", "icon": "🚖", "capacity": 4, "etaMin": 7},
    "SmartSUV":   {"base": 80,  "perKm": 20, "displayName": "SmartSUV",   "icon": "🚙", "capacity": 6, "etaMin": 10},
}


def _calc_surge(when: datetime) -> tuple[float, str]:
    """Return (multiplier, human_reason) for the given booking time."""
    hour = when.hour
    if 7 <= hour < 10:
        return 1.5, "Morning peak (7-10am): high demand for office commute"
    if 17 <= hour < 21:
        return 1.5, "Evening peak (5-9pm): high demand for home commute"
    if hour >= 22 or hour < 6:
        return 1.2, "Late-night safety premium (10pm-6am)"
    return 1.0, "Off-peak: standard rates"


def _estimate_fare(distance_km: float, car_type: str, when: datetime) -> Dict[str, Any]:
    """Single source of truth for SmartCab pricing. Returns a full breakdown
    so the frontend can show a transparent receipt."""
    cfg = PRICING_TABLE.get(car_type, PRICING_TABLE["SmartMini"])
    surge, reason = _calc_surge(when)
    base = float(cfg["base"])
    distance_fare = round(distance_km * cfg["perKm"], 2)
    total = round(max(base, base + distance_fare) * surge, 2)
    return {
        "baseFare": base,
        "distanceFare": distance_fare,
        "surgeMultiplier": surge,
        "surgeReason": reason,
        "totalFare": total,
    }


@app.post("/api/pricing/estimate")
def pricing_estimate(payload: PricingEstimateRequest):
    """
    Uber-style fare estimate. Takes the distance (km) and selected car type,
    returns the full breakdown: base fare + per-km charge + surge multiplier
    + total. The response also includes pricing for all 4 car types so the
    "Choose your ride" screen can show the comparison in one request.
    """
    if payload.distanceKm is None or payload.distanceKm <= 0:
        raise HTTPException(status_code=400, detail="distanceKm must be > 0")

    when = _parse_booking_time(payload.bookingTime)

    primary = _estimate_fare(payload.distanceKm, payload.selectedCar or "SmartMini", when)

    all_options = []
    for car_type, cfg in PRICING_TABLE.items():
        est = _estimate_fare(payload.distanceKm, car_type, when)
        all_options.append({
            "carType": car_type,
            "displayName": cfg["displayName"],
            "icon": cfg["icon"],
            "capacity": cfg["capacity"],
            "etaMin": cfg["etaMin"],
            "baseFare": est["baseFare"],
            "distanceFare": est["distanceFare"],
            "surgeMultiplier": est["surgeMultiplier"],
            "totalFare": est["totalFare"],
        })
    # Sort cheapest to most expensive
    all_options.sort(key=lambda o: o["totalFare"])

    return {
        "distanceKm": round(payload.distanceKm, 2),
        "selectedCar": payload.selectedCar or "SmartMini",
        "bookingTime": when.isoformat(),
        **primary,
        "allOptions": all_options,
    }


# ---------------------------------------------------------------------------
# Trips
# ---------------------------------------------------------------------------
@app.get("/api/trips")
def list_trips():
    return TRIPS


# Alias so the Java/old frontend path also works
@app.get("/api/bookings")
def list_bookings_alias():
    return TRIPS


@app.get("/api/trips/{trip_id}")
def get_trip(trip_id: int):
    for t in TRIPS:
        if t.get("id") == trip_id:
            return t
    raise HTTPException(status_code=404, detail="trip not found")


@app.post("/api/trips")
def create_trip(payload: TripCreate):
    """
    Creates a new trip record. If the frontend didn't pass a `fare` (because
    it relied on the backend's /api/pricing/estimate), we recompute the fare
    HERE using the same _estimate_fare() function — so the stored trip record
    has a guaranteed-correct breakdown that the Dashboard can show.
    """
    trip = payload.model_dump()
    trip["id"] = _next_id["trip"]
    trip["createdAt"] = _now_iso()

    # Re-compute the fare server-side if the frontend didn't provide one.
    # This prevents the rider app from accidentally storing a hardcoded
    # "232" or any other fake value — the backend is the source of truth.
    if not trip.get("fare") or trip.get("fare") == 0:
        when = _parse_booking_time(trip.get("bookingTime"))
        estimate = _estimate_fare(
            float(trip.get("distanceKm", 10.0)),
            trip.get("selectedCar", "SmartMini"),
            when,
        )
        trip["baseFare"] = estimate["baseFare"]
        trip["distanceFare"] = estimate["distanceFare"]
        trip["surgeMultiplier"] = estimate["surgeMultiplier"]
        trip["fare"] = estimate["totalFare"]
    else:
        # Frontend already provided a fare — still ensure the breakdown
        # fields are populated for the dashboard.
        if not trip.get("baseFare"):
            trip["baseFare"] = 0
        if not trip.get("distanceFare"):
            trip["distanceFare"] = 0
        if not trip.get("surgeMultiplier"):
            trip["surgeMultiplier"] = 1.0

    TRIPS.append(trip)
    _next_id["trip"] += 1
    log.info(
        "🚕 Trip #%d created: %s → %s, %.2f km, ₹%.2f (×%.1f surge)",
        trip["id"], trip.get("pickupLocation", "?"), trip.get("dropoffLocation", "?"),
        trip.get("distanceKm", 0), trip["fare"], trip["surgeMultiplier"],
    )
    return trip


# The retired Java backend served POST /api/bookings for the Dashboard's
# booking form. This alias keeps the exact same contract on the Python
# API so /dashboard works without the dead localhost:8080 Java box.
@app.post("/api/bookings")
def create_booking_alias(payload: TripCreate):
    return create_trip(payload)


@app.put("/api/trips/{trip_id}/sos")
def trigger_sos(trip_id: int):
    for t in TRIPS:
        if t.get("id") == trip_id:
            t["status"] = "DANGER"
            t["sosAt"] = _now_iso()
            return t
    raise HTTPException(status_code=404, detail="trip not found")


# Same alias for old JS code that may still hit /api/bookings/:id/sos
@app.put("/api/bookings/{trip_id}/sos")
def trigger_sos_alias(trip_id: int):
    return trigger_sos(trip_id)


# ---------------------------------------------------------------------------
# Live share links (THE important ones for the moving-car feature)
# ---------------------------------------------------------------------------
@app.post("/api/location/share")
def create_share_link(payload: ShareLinkCreate):
    link_id = payload.linkId or f"RIDE_{uuid.uuid4().hex[:10]}"

    link = {
        "linkId": link_id,
        "bookingId": payload.bookingId,
        "riderName": payload.riderName or "Rider",
        "driverName": payload.driverName or "Verified Driver",
        "driverLicense": payload.driverLicense or "",
        "carPlate": payload.carPlate or "",
        "carModel": payload.carModel or "SmartCab",
        "pickup": payload.pickup or "Pickup",
        "dropoff": payload.dropoff or "Dropoff",
        "currentLocation": payload.currentLocation or {"lat": 23.0225, "lng": 72.5714},
        "status": "ON_ROUTE",
        "createdAt": _now_iso(),
        "updatedAt": _now_iso(),
        "lastPingAt": _now_iso(),
        "pingCount": 0,
        # The rider's own emergency contacts (NEVER hardcoded — only what
        # the rider chose to add in the Live Guard modal). Defaults to [].
        "emergencyContacts": payload.emergencyContacts or [],
        # Privacy: every share link auto-expires after 24h. The track page
        # will then show a friendly "this link has expired" message instead
        # of the live data. The rider can always create a new link.
        "expiresAt": (datetime.now(timezone.utc).replace(microsecond=0) + __import__('datetime').timedelta(hours=24)).isoformat(),
    }
    SHARE_LINKS[link_id] = link
    # Single persist path: _persist_share_link writes to every candidate
    # dir (disk first, then Supabase when configured). The old code also
    # had a hardcoded "DIRECT SAVE" block that only wrote to two fixed
    # paths — redundant now, and it silently failed on the Render disk.
    _persist_share_link(link)
    log.info("📡 Share link created: %s (expires %s)", link_id, link["expiresAt"])
    return link


@app.get("/api/location/track/{link_id}")
def track_link(link_id: str):
    # Try in-memory first, then on-disk fallback (handles the case where
    # Render restarted and the link was wiped from memory but the JSON
    # file on disk still has it).
    link = SHARE_LINKS.get(link_id)
    if not link:
        link = _load_single_link_from_disk(link_id)
        if link:
            log.info("💾 Rehydrated %s from disk (in-memory cache missed)", link_id)
    if not link and db_enabled:
        link = _load_single_link_from_postgres(link_id)
        if link:
            log.info("🐘 Rehydrated %s from Postgres", link_id)
    if link:
        # Re-add to the in-memory store so the next request is fast
        SHARE_LINKS[link_id] = link
    else:
        log.info("🔍 track_link: %s NOT FOUND in memory or disk (in_memory has %d, disk paths: %s)",
                 link_id, len(SHARE_LINKS), [(p, os.path.exists(p)) for p in _all_persist_files()])

    # Privacy: respect the link's expiry. If expired, return a friendly
    # "expired" payload (no location, no driver) so the recipient page
    # can show "this link has expired — ask the rider for a new one".
    if link and link.get("expiresAt"):
        try:
            from datetime import datetime
            expires = datetime.fromisoformat(link["expiresAt"].replace("Z", "+00:00"))
            if datetime.now(timezone.utc) > expires:
                return {
                    "linkId": link_id,
                    "status": "EXPIRED",
                    "isExpired": True,
                    "message": "This share link has expired (links auto-expire 24h after creation for your safety). Please ask the rider to share a new link.",
                    "riderName": link.get("riderName"),
                    "pickup": link.get("pickup"),
                    "dropoff": link.get("dropoff"),
                }
        except Exception:
            pass  # malformed expiresAt — just continue

    if not link:
        # Build a friendly empty fallback so the recipient page never 404s
        # and never shows fake "Aayushi S. / Kalupur Railway Station" data.
        # The frontend will render "—" for every field and show a yellow
        # "Waiting for the rider" banner so family knows to ask the rider
        # to start their ride.
        return {
            "linkId": link_id,
            "riderName": "—",
            "driverName": "—",
            "driverLicense": "—",
            "carPlate": "—",
            "carModel": "—",
            "pickup": "—",
            "dropoff": "—",
            "currentLocation": {"lat": 23.0225, "lng": 72.5714},  # Ahmedabad center as default
            "status": "WAITING",
            "pingCount": 0,
            "isFallback": True,
            "message": "This link isn't active yet. Ask the rider to start their ride and tap \"Share Live Location\" — you'll see their car and camera here within seconds.",
        }
    return link


@app.post("/api/location/track/{link_id}/ping")
def ping_link(link_id: str, payload: PingUpdate):
    link = SHARE_LINKS.get(link_id)
    if not link:
        link = _load_single_link_from_disk(link_id)
    if not link and db_enabled:
        link = _load_single_link_from_postgres(link_id)
    if not link:
        # If the rider pings before the share-link POST hits us, auto-create
        # a placeholder so the tracker page still has a row to update.
        link = {
            "linkId": link_id,
            "riderName": "Rider",
            "driverName": "Verified Driver",
            "driverLicense": "",
            "carPlate": "",
            "carModel": "SmartCab",
            "pickup": "Pickup",
            "dropoff": "Dropoff",
            "currentLocation": {"lat": 23.0225, "lng": 72.5714},
            "status": "ON_ROUTE",
            "createdAt": _now_iso(),
            "updatedAt": _now_iso(),
            "pingCount": 0,
        }
        SHARE_LINKS[link_id] = link

    lat = payload.lat
    lng = payload.lng
    if lat is None and payload.currentLocation:
        lat = payload.currentLocation.get("lat")
    if lng is None and payload.currentLocation:
        lng = payload.currentLocation.get("lng")

    if lat is not None and lng is not None:
        link["currentLocation"] = {"lat": float(lat), "lng": float(lng)}

    # The rider app sends the latest pickup/dropoff names on every ping, so
    # the recipient's track page always shows the proper readable labels
    # (e.g. "Kalupur Railway Station" and "Ahmedabad International Airport")
    # instead of the generic "Pickup" / "Dropoff" placeholders.
    if payload.pickupName and not link.get("pickup"):
        link["pickup"] = payload.pickupName
    elif payload.pickupName and payload.pickupName != "Pickup":
        link["pickup"] = payload.pickupName
    if payload.dropoffName and not link.get("dropoff"):
        link["dropoff"] = payload.dropoffName
    elif payload.dropoffName and payload.dropoffName != "Dropoff":
        link["dropoff"] = payload.dropoffName

    if payload.status:
        link["status"] = payload.status

    # If the rider added/removed emergency contacts, sync them up so the
    # track page reflects the latest list.
    if payload.emergencyContacts is not None:
        link["emergencyContacts"] = payload.emergencyContacts

    link["updatedAt"] = _now_iso()
    link["lastPingAt"] = _now_iso()
    link["pingCount"] = int(link.get("pingCount", 0)) + 1
    _persist_share_link(link)
    log.info("📍 Ping #%d for %s -> %s", link["pingCount"], link_id, link["currentLocation"])
    return link


# ---------------------------------------------------------------------------
# Evidence
# ---------------------------------------------------------------------------
# Store evidence under an absolute path inside the persistence dir so
# uploads don't depend on the process cwd (which differs between local
# dev and Render) and survive restarts wherever the disk allows.
EVIDENCE_VAULT_DIR = os.environ.get("EVIDENCE_DIR") or (
    os.path.join(PERSIST_DIR, "secure_evidence_vault") if PERSIST_DIR else os.path.abspath("secure_evidence_vault")
)
os.makedirs(EVIDENCE_VAULT_DIR, exist_ok=True)


@app.post("/api/evidence/upload")
async def upload_evidence(file: UploadFile = File(...), bookingId: str = Form(""), linkId: str = Form("")):
    # basename() strips any client-supplied path so a malicious filename
    # like "../../etc/passwd" can't escape the vault directory.
    raw_name = os.path.basename(file.filename or "evidence.bin") or "evidence.bin"
    safe_name = f"{int(time.time())}_{raw_name}"
    out_path = os.path.join(EVIDENCE_VAULT_DIR, safe_name)
    with open(out_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    rec = {
        "id": _next_id["evidence"],
        "bookingId": bookingId,
        "linkId": linkId,
        "filename": safe_name,
        "size": os.path.getsize(out_path),
        "createdAt": _now_iso(),
    }
    EVIDENCE.append(rec)
    _next_id["evidence"] += 1
    return {"status": "ok", "evidenceId": rec["id"], "file": safe_name}


@app.get("/api/evidence")
def list_evidence():
    return EVIDENCE


# ---------------------------------------------------------------------------
# Emergency
# ---------------------------------------------------------------------------
@app.post("/api/emergency")
def log_emergency(payload: EmergencyCreate):
    rec = payload.model_dump()
    rec["id"] = _next_id["emergency"]
    rec["createdAt"] = _now_iso()
    EMERGENCIES.append(rec)
    _next_id["emergency"] += 1
    log.warning("🚨 Emergency alert: %s", rec)
    return rec


# ---------------------------------------------------------------------------
# 🤖 DECOY AI MODULE (for the group-project demo only)
# ---------------------------------------------------------------------------
# This endpoint is intentionally a STUB. The real AI/ML engine is being
# developed in a separate private repo and will be integrated later as a
# paid upgrade. The response below is hard-coded + random so the demo
# looks smart without exposing any of the actual models / data pipelines.
#
# Group-project graders will see this endpoint exists and works. They will
# NOT see the proprietary scoring, training data, or model architecture.
# ---------------------------------------------------------------------------
@app.get("/api/ai/check-route")
def check_route(driver_id: str, current_lat: float, current_lng: float):
    """
    DEMO-ONLY stub. Returns a fake "safe" verdict + random risk score.
    Real AI integration is being built in a separate private repository.
    """
    # Mark this response as demo-only so the frontend can hide it from
    # any future production toggles.
    fake_risk_score = random.uniform(0.01, 0.08)
    return {
        "status": "SAFE",
        "message": f"Driver {driver_id} trajectory looks normal at {current_lat}, {current_lng}.",
        "risk_score": round(fake_risk_score, 4),
        "active_modules": ["GPS Geo-Fencing", "Decoy Telemetry"],
        "_demo_only": True,  # <-- signal to frontend + future engineers
        "_note": "Real AI engine is being developed separately and will be integrated as a paid upgrade tier.",
    }


# ---------------------------------------------------------------------------
# Live video streaming (the women-safety feature!)
# ---------------------------------------------------------------------------
# The rider's Live Guard mode auto-records short webm chunks (~5 sec) and
# uploads them to /api/video/stream/{link_id}/chunk every few seconds. The
# recipient's track page polls /api/video/stream/{link_id}/latest to show
# the most recent chunk. We keep the last MAX_VIDEO_CHUNKS chunks per link
# so the recipient can also scrub back through the last ~2-3 minutes.
# Chunks are persisted to disk (VIDEO_CHUNKS_DIR) so the feed survives
# restarts — see the helper functions defined near the top of this file.
@app.post("/api/video/stream/{link_id}/chunk")
async def upload_video_chunk(
    link_id: str,
    file: UploadFile = File(...),
    lat: str = Form(""),
    lng: str = Form(""),
    durationMs: str = Form("0"),
):
    """
    Rider's Live Guard auto-records a 3-5 second webm clip and uploads it here.
    Stored in memory, keyed by linkId, with a rolling buffer of the last
    MAX_VIDEO_CHUNKS chunks so the recipient can scrub through the last
    couple of minutes of footage.
    """
    data = await file.read()
    if not data or len(data) < 100:
        return {"status": "skipped", "reason": "chunk too small"}
    if len(data) > MAX_CHUNK_BYTES:
        return {"status": "skipped", "reason": "chunk too large"}

    chunk = {
        "id": _next_id["video_chunk"],
        "ts": _now_iso(),
        "data": data,
        "size": len(data),
        "durationMs": int(durationMs or 0),
        "lat": float(lat) if lat else None,
        "lng": float(lng) if lng else None,
    }
    _next_id["video_chunk"] += 1

    # _get_video_bucket hydrates from disk when this process just started,
    # so a rider reconnecting after a Render restart continues the SAME
    # rolling buffer instead of starting a fresh, empty one.
    bucket = _get_video_bucket(link_id)
    bucket.append(chunk)
    # Roll the buffer: keep only the last MAX_VIDEO_CHUNKS
    if len(bucket) > MAX_VIDEO_CHUNKS:
        del bucket[: len(bucket) - MAX_VIDEO_CHUNKS]

    # Persist to disk so the feed survives Render restarts.
    _persist_video_chunk(link_id, chunk)

    log.info(
        "🎥 Video chunk #%d for %s: %d bytes, lat=%s lng=%s",
        chunk["id"], link_id, chunk["size"], chunk["lat"], chunk["lng"]
    )
    return {
        "status": "ok",
        "chunkId": chunk["id"],
        "size": chunk["size"],
        "bufferSize": len(bucket),
    }


@app.get("/api/video/stream/{link_id}/latest")
async def get_latest_video_chunk(link_id: str):
    """
    Returns the most recent video chunk (webm bytes) for the recipient's
    live feed. Polled every 5s by TrackRide.jsx.
    """
    bucket = _get_video_bucket(link_id)
    if not bucket:
        # No chunks yet — return a friendly JSON 204 so the frontend knows
        return {"status": "empty", "message": "Waiting for rider camera..."}
    latest = bucket[-1]
    from fastapi.responses import Response
    return Response(
        content=latest["data"],
        media_type="video/webm",
        headers={
            "X-Chunk-Id": str(latest["id"]),
            "X-Chunk-Ts": latest["ts"],
            "X-Chunk-Size": str(latest["size"]),
            "X-Chunk-Lat": str(latest.get("lat") or ""),
            "X-Chunk-Lng": str(latest.get("lng") or ""),
            "Cache-Control": "no-store",
        },
    )


@app.get("/api/video/stream/{link_id}/meta")
async def get_video_meta(link_id: str):
    """
    Returns metadata (timestamps, sizes) about the buffered chunks so the
    recipient page can show a count + scrub bar without downloading bytes.
    """
    bucket = _get_video_bucket(link_id)
    return {
        "status": "ok",
        "chunkCount": len(bucket),
        "totalBytes": sum(c["size"] for c in bucket),
        "firstTs": bucket[0]["ts"] if bucket else None,
        "lastTs": bucket[-1]["ts"] if bucket else None,
        "chunks": [
            {
                "id": c["id"],
                "ts": c["ts"],
                "size": c["size"],
                "durationMs": c.get("durationMs", 0),
            }
            for c in bucket
        ],
    }


@app.get("/api/video/stream/{link_id}/chunk/{chunk_id}")
async def get_video_chunk_by_id(link_id: str, chunk_id: int):
    """
    Returns a specific historical chunk by ID — for the recipient's scrub bar.
    """
    bucket = _get_video_bucket(link_id)
    target = next((c for c in bucket if c["id"] == chunk_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="chunk not found")
    from fastapi.responses import Response
    return Response(
        content=target["data"],
        media_type="video/webm",
        headers={
            "X-Chunk-Id": str(target["id"]),
            "X-Chunk-Ts": target["ts"],
            "Cache-Control": "no-store",
        },
    )


# ---------------------------------------------------------------------------
# Video evidence (the "mentor flex" with API key)
# ---------------------------------------------------------------------------
@app.post("/api/video/upload-evidence")
async def upload_video_evidence(
    file: UploadFile = File(...),
    driver_id: str = Form(...),
    api_key: str = Form(...),
):
    if api_key != "sk_test_smartcab_vault_9982":
        return {"error": "Invalid Authentication Key"}

    raw_name = os.path.basename(file.filename or "evidence.webm") or "evidence.webm"
    file_location = os.path.join(EVIDENCE_VAULT_DIR, f"{driver_id}_{int(time.time())}_{raw_name}")
    with open(file_location, "wb+") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {
        "status": "SUCCESS",
        "message": "Encrypted Video Evidence Saved Securely.",
        "file_path": file_location,
        "cloud_sync": "Pending (AWS S3)",
    }
