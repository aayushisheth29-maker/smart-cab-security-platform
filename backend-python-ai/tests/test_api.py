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
    from main import seed_samples, _RATE_BUCKETS
    _RATE_BUCKETS.clear()
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
    assert "Smart Security AI Cab ride has started" in body["notification"]["message"]


# ---------------------------------------------------------------------------
# Driver application flow
# ---------------------------------------------------------------------------
def test_driver_application_creates_reference_and_persists():
    from main import DRIVER_APPLICATIONS
    res = client.post("/api/drivers/apply", json={
        "fullName": "Rohan Driver",
        "phone": "+91 98765 33333",
        "email": "rohan@example.com",
        "city": "Ahmedabad",
        "vehicleType": "SmartSedan",
        "licenseNumber": "GJ01-2023-1122334",
        "experienceYears": 3,
        "ownVehicle": True,
        "agreeTerms": True,
        "criminalRecordDeclaration": True,
    })
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["application"]["reference"].startswith("DRV-")
    assert body["application"]["status"] == "PENDING"
    assert body["nextSteps"]
    assert any(a["reference"] == body["application"]["reference"] for a in DRIVER_APPLICATIONS)


def test_driver_application_rejects_bad_payload():
    # Pydantic required fields -> 422 when missing entirely
    res = client.post("/api/drivers/apply", json={"fullName": "", "phone": "123"})
    assert res.status_code in (400, 422)
    # Blank-ish values that pass Pydantic but fail business validation -> 400
    res2 = client.post("/api/drivers/apply", json={
        "fullName": "   ", "phone": "123", "city": "X",
        "vehicleType": "SmartMini", "licenseNumber": "ABC12", "agreeTerms": True,
    })
    assert res2.status_code == 400


def test_driver_application_requires_terms():
    res = client.post("/api/drivers/apply", json={
        "fullName": "X", "phone": "+91 98765 44444", "city": "Mumbai",
        "vehicleType": "SmartMini", "licenseNumber": "MH01-1234567", "agreeTerms": False,
    })
    assert res.status_code == 400


def test_admin_approves_application_into_fleet():
    from main import DRIVER_APPLICATIONS, DRIVERS
    res = client.post("/api/drivers/apply", json={
        "fullName": "Approved Driver", "phone": "+91 98765 55555", "city": "Pune",
        "vehicleType": "SmartSUV", "licenseNumber": "MH12-9876543",
        "agreeTerms": True, "criminalRecordDeclaration": True,
    })
    assert res.status_code == 200, res.text
    app_id = res.json()["application"]["id"]
    before = len(DRIVERS)
    # Admin-only: no key -> 401
    assert client.post(f"/api/admin/driver-applications/{app_id}/approve").status_code == 401
    # Gated flow: docs + cleared background check, then approval.
    client.post(f"/api/drivers/apply/{app_id}/documents",
                files={"licencePhoto": ("l.png", _fake_png_bytes(), "image/png"),
                       "vehiclePhoto": ("v.png", _fake_png_bytes(), "image/png")})
    client.post(f"/api/admin/driver-applications/{app_id}/background-check",
                headers={"X-Admin-Key": ADMIN_KEY}, json={"status": "CLEARED"})
    ok = client.post(f"/api/admin/driver-applications/{app_id}/approve",
                     headers={"X-Admin-Key": ADMIN_KEY})
    assert ok.status_code == 200, ok.text
    assert ok.json()["application"]["status"] == "APPROVED"
    assert len(DRIVERS) == before + 1
    # Fleet now contains the approved driver
    assert any(d.get("applicationId") == app_id for d in DRIVERS)


# ---------------------------------------------------------------------------
# Driver vetting: documents + background check + approval gate
# ---------------------------------------------------------------------------
def _apply_driver(full_name="Vetted Driver", **overrides):
    payload = {
        "fullName": full_name, "phone": "+91 98765 66666", "email": "v@example.com",
        "city": "Surat", "vehicleType": "SmartSedan",
        "licenseNumber": "GJ05-2020-9988776", "agreeTerms": True,
        "criminalRecordDeclaration": True,
    }
    payload.update(overrides)
    return client.post("/api/drivers/apply", json=payload).json()


def _fake_png_bytes():
    # Minimal 1x1 PNG so the multipart upload passes size/content checks.
    import base64
    return base64.b64decode(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
    )


def test_apply_requires_criminal_declaration():
    res = client.post("/api/drivers/apply", json={
        "fullName": "X", "phone": "+91 1", "city": "A", "vehicleType": "SmartMini",
        "licenseNumber": "ABC123", "agreeTerms": True, "criminalRecordDeclaration": False,
    })
    assert res.status_code == 400


def test_documents_upload_and_admin_download():
    app = _apply_driver(full_name="Doc Uploader")
    app_id = app["application"]["id"]
    res = client.post(
        f"/api/drivers/apply/{app_id}/documents",
        files={
            "licencePhoto": ("licence.png", _fake_png_bytes(), "image/png"),
            "vehiclePhoto": ("vehicle.png", _fake_png_bytes(), "image/png"),
        },
    )
    assert res.status_code == 200, res.text
    docs = res.json()["documents"]
    assert {d["type"] for d in docs} == {"licence", "vehicle"}
    # Admin can download; no key -> 401
    doc_id = docs[0]["id"]
    assert client.get(f"/api/admin/driver-applications/{app_id}/documents/{doc_id}").status_code == 401
    ok = client.get(f"/api/admin/driver-applications/{app_id}/documents/{doc_id}",
                    headers={"X-Admin-Key": ADMIN_KEY})
    assert ok.status_code == 200
    assert ok.headers["content-type"].startswith("image/")
    # Reject bad file type
    bad = client.post(f"/api/drivers/apply/{app_id}/documents",
                      files={"licencePhoto": ("x.exe", b"123456789012345678901234567890", "application/x-msdownload")})
    assert bad.status_code == 400


def test_approval_requires_cleared_background_and_docs():
    app = _apply_driver(full_name="Gate Tester")
    app_id = app["application"]["id"]
    # 1) Approve before docs/background -> 400
    res = client.post(f"/api/admin/driver-applications/{app_id}/approve",
                      headers={"X-Admin-Key": ADMIN_KEY})
    assert res.status_code == 400
    # 2) Upload docs
    client.post(f"/api/drivers/apply/{app_id}/documents",
                files={"licencePhoto": ("l.png", _fake_png_bytes(), "image/png"),
                       "vehiclePhoto": ("v.png", _fake_png_bytes(), "image/png")})
    # 3) Clear background check
    bg = client.post(f"/api/admin/driver-applications/{app_id}/background-check",
                     headers={"X-Admin-Key": ADMIN_KEY},
                     json={"status": "CLEARED", "note": "Police certificate verified"})
    assert bg.status_code == 200
    assert bg.json()["application"]["backgroundCheck"]["status"] == "CLEARED"
    # 4) Now approve works
    ok = client.post(f"/api/admin/driver-applications/{app_id}/approve",
                     headers={"X-Admin-Key": ADMIN_KEY})
    assert ok.status_code == 200
    assert ok.json()["application"]["status"] == "APPROVED"


def test_background_flag_rejects_application():
    app = _apply_driver(full_name="Flagged Person")
    app_id = app["application"]["id"]
    res = client.post(f"/api/admin/driver-applications/{app_id}/background-check",
                      headers={"X-Admin-Key": ADMIN_KEY},
                      json={"status": "FLAGGED", "note": "Record mismatch"})
    assert res.status_code == 200
    assert res.json()["application"]["status"] == "REJECTED"


# ---------------------------------------------------------------------------
# Driver protection (two-way safety)
# ---------------------------------------------------------------------------
def _new_trip():
    token = _token()
    trip = client.post("/api/trips", headers={"Authorization": f"Bearer {token}"}, json={
        "pickupLocation": "A", "dropoffLocation": "B", "distanceKm": 5,
        "riderName": "Aayushi S.",
    }).json()
    return trip


def test_rider_verify_records_proof():
    trip = _new_trip()
    res = client.post(f"/api/trips/{trip['id']}/rider-verify",
                      json={"verified": True, "method": "ID shown at pickup"})
    assert res.status_code == 200
    assert res.json()["trip"]["riderVerified"] is True


def test_driver_alert_flow_and_admin_exoneration():
    trip = _new_trip()
    res = client.post(f"/api/trips/{trip['id']}/driver-alert", json={
        "reason": "Suspected illegal items in bag",
        "notes": "Rider refused inspection",
    })
    assert res.status_code == 200, res.text
    alert = res.json()["alert"]
    assert alert["status"] == "OPEN"
    assert alert["rideCode"] == trip["rideCode"]
    assert "exonerate" in res.json()["guide"].lower()
    # Attach evidence
    ev = client.post(f"/api/trips/{trip['id']}/driver-alerts/{alert['id']}/evidence",
                     files={"file": ("proof.png", _fake_png_bytes(), "image/png")})
    assert ev.status_code == 200
    # Admin exonerates the driver
    ok = client.post(f"/api/admin/driver-alerts/{alert['id']}/resolve",
                     headers={"X-Admin-Key": ADMIN_KEY},
                     json={"outcome": "EXONERATED", "note": "Rider confirmed at fault"})
    assert ok.status_code == 200
    assert ok.json()["alert"]["driverExonerated"] is True
    assert ok.json()["alert"]["status"] == "RESOLVED"


def test_driver_alert_requires_reason():
    trip = _new_trip()
    res = client.post(f"/api/trips/{trip['id']}/driver-alert", json={"reason": ""})
    assert res.status_code == 400
