"""
Automated smoke tests for the SmartCab product upgrade.
Run:  pip install -r requirements-dev.txt && pytest tests/ -q
"""
import re
import uuid

import pytest
from fastapi.testclient import TestClient

from main import app, USERS, TRIPS, DRIVERS, EMERGENCIES, ROUTE_CHECKS

client = TestClient(app)

ADMIN_KEY = "smartcab-admin-dev-key"


@pytest.fixture(autouse=True)
def fresh_state():
    """Isolate tests from each other by resetting mutable stores."""
    global USERS, TRIPS, EMERGENCIES, ROUTE_CHECKS
    # NOTE: module-level lists are re-imported; mutate in place.
    USERS.clear()
    TRIPS.clear()
    EMERGENCIES.clear()
    ROUTE_CHECKS.clear()
    from main import seed_samples
    seed_samples(force=True)
    yield


def _signup(email=None, password="supersecure123"):
    email = email or f"user_{uuid.uuid4().hex[:8]}@example.com"
    res = client.post("/api/auth/signup", json={
        "name": "Test Rider", "email": email, "phone": "+91 99999 99999", "password": password,
    })
    assert res.status_code == 200, res.text
    return res.json()


def _token(email="aayushi@example.com", password="smartcab123"):
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, res.text
    return res.json()["token"]


# ---------------------------------------------------------------------------
# Security
# ---------------------------------------------------------------------------
def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_signup_never_returns_password_and_issues_token():
    data = _signup()
    assert "password" not in data and "passwordHash" not in data
    assert data["token"] and data["tokenType"] == "Bearer"


def test_stored_password_is_hashed():
    from main import hash_password, verify_password
    data = _signup(password="mysecretpass123")
    user = next(u for u in USERS if u["email"] == data["email"])
    stored = user["passwordHash"]
    assert stored.startswith("pbkdf2_sha256$")
    assert stored != "mysecretpass123"
    assert verify_password("mysecretpass123", stored)
    assert not verify_password("wrong", stored)


def test_signup_requires_8_char_password():
    res = client.post("/api/auth/signup", json={
        "name": "X", "email": f"x{uuid.uuid4().hex[:6]}@e.com", "phone": "1", "password": "short",
    })
    assert res.status_code == 400


def test_login_wrong_password_401():
    res = client.post("/api/auth/login", json={"email": "aayushi@example.com", "password": "nope"})
    assert res.status_code == 401


def test_me_with_token():
    token = _token()
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["name"] == "Aayushi S."


def test_protected_endpoint_rejects_missing_token():
    assert client.get("/api/users/1/trips").status_code == 401


def test_cross_user_access_forbidden():
    token = _token()
    res = client.get("/api/users/2/trips", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403


def test_admin_requires_key():
    assert client.get("/api/admin/stats").status_code == 401
    res = client.get("/api/admin/stats", headers={"X-Admin-Key": ADMIN_KEY})
    assert res.status_code == 200
    assert "activeRides" in res.json()


def test_debug_endpoints_disabled_by_default(monkeypatch):
    import main
    monkeypatch.setattr(main, "SMARTCAB_DEBUG", False)
    res = client.post("/api/debug/create_test_link")
    assert res.status_code == 404


# ---------------------------------------------------------------------------
# Ride lifecycle + Ride IDs
# ---------------------------------------------------------------------------
def test_create_trip_gets_ride_code_driver_and_lifecycle_status():
    token = _token()
    res = client.post("/api/trips", headers={"Authorization": f"Bearer {token}"}, json={
        "pickupLocation": "Saraspur", "dropoffLocation": "Gota",
        "distanceKm": 12.4, "selectedCar": "SmartMini", "status": "PENDING",
    })
    assert res.status_code == 200, res.text
    trip = res.json()
    assert re.match(r"^SC-\d{4}-\d{6}$", trip["rideCode"])
    assert trip["status"] == "DRIVER_ASSIGNED"
    assert trip["driver"]["name"]
    assert trip["userId"] == 1


def test_full_lifecycle_transitions():
    token = _token()
    trip = client.post("/api/trips", headers={"Authorization": f"Bearer {token}"}, json={
        "pickupLocation": "A", "dropoffLocation": "B", "distanceKm": 5,
    }).json()
    tid = trip["id"]
    for status in ["DRIVER_ACCEPTED", "DRIVER_ARRIVING", "RIDE_STARTED", "IN_PROGRESS", "COMPLETED"]:
        res = client.post(f"/api/trips/{tid}/status", headers={"Authorization": f"Bearer {token}"},
                          json={"status": status})
        assert res.status_code == 200, res.text
        assert res.json()["status"] == status
    # Invalid transition
    res = client.post(f"/api/trips/{tid}/status", headers={"Authorization": f"Bearer {token}"},
                      json={"status": "DRIVER_ACCEPTED"})
    assert res.status_code == 400


def test_sos_creates_emergency_record():
    token = _token()
    trip = client.post("/api/trips", headers={"Authorization": f"Bearer {token}"}, json={
        "pickupLocation": "A", "dropoffLocation": "B", "distanceKm": 5,
    }).json()
    res = client.put(f"/api/trips/{trip['id']}/sos", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    body = res.json()
    assert body["trip"]["status"] == "DANGER"
    assert body["emergency"]["rideCode"] == trip["rideCode"]
    assert body["emergency"]["status"] == "ACTIVE"


# ---------------------------------------------------------------------------
# Real route check (honest, geometric)
# ---------------------------------------------------------------------------
def test_route_check_on_route_is_safe():
    res = client.post("/api/ai/route-safety/check", json={
        "pickupLat": 23.0283, "pickupLng": 72.5924,
        "dropoffLat": 23.1033, "dropoffLng": 72.5930,
        "currentLat": 23.06, "currentLng": 72.5927,
    })
    assert res.status_code == 200
    body = res.json()
    assert body["status"] in ("SAFE", "WARNING")
    assert "rule-based" in body["method"]
    assert "honestNote" in body


def test_route_check_off_route_flags_deviation():
    res = client.post("/api/ai/route-safety/check", json={
        "pickupLat": 23.0283, "pickupLng": 72.5924,
        "dropoffLat": 23.1033, "dropoffLng": 72.5930,
        "currentLat": 23.1500, "currentLng": 72.6500,
    })
    body = res.json()
    assert body["status"] == "DEVIATION"
    assert body["distanceFromRouteMeters"] > 1000


# ---------------------------------------------------------------------------
# Emergency + safety share
# ---------------------------------------------------------------------------
def test_emergency_returns_checklist_and_quick_dial():
    res = client.post("/api/emergency", json={
        "bookingId": None, "riderName": "Test", "rideCode": "SC-2026-999999",
        "lat": 23.05, "lng": 72.58,
        "contacts": [{"name": "Mom", "phone": "+91 98765 11111"}],
    })
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["status"] == "ACTIVE"
    assert body["checklist"]["alertCreated"] is True
    assert body["checklist"]["locationRecorded"] is True
    assert len(body["quickDial"]) >= 2
    assert "does NOT automatically call" in body["notice"]


def test_share_ride_returns_track_url_and_notification_preview():
    res = client.post("/api/safety/share-ride", json={
        "rideCode": "SC-2026-999999",
        "riderName": "Aayushi", "driverName": "Rahul S.", "carPlate": "MH 02 AB 1234",
        "pickup": "A", "dropoff": "B", "lat": 23.05, "lng": 72.58,
        "contacts": [{"name": "Mom", "phone": "+91 98765 11111"}],
    })
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["trackUrl"].startswith("/track/")
    assert body["notification"]["transport"] == "preview"
    assert "SmartCab ride has started" in body["notification"]["message"]
