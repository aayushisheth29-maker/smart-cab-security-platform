"""
Test suite for Night Shield & Women Sentinel Mode:
- GET /api/sentinel/women-drivers
- POST /api/sentinel/night-shield/status
- POST /api/sentinel/check-in
"""
import pytest
from fastapi.testclient import TestClient
from main import app, WOMEN_FLEET_PARTNERS, SENTINEL_CHECKINS_LOG

client = TestClient(app)


def test_get_women_drivers():
    """Verify verified women drivers catalog is returned."""
    res = client.get("/api/sentinel/women-drivers")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["count"] >= 3
    names = [d["name"] for d in data["drivers"]]
    assert "Anita M." in names
    assert "Priya T." in names
    assert "Sunita K." in names
    for d in data["drivers"]:
        assert d["policeVerified"] is True
        assert d["dashcamLive"] is True


def test_night_shield_status_recommendation():
    """Verify Night Shield status calculation and emergency helplines."""
    res = client.post("/api/sentinel/night-shield/status", json={})
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "isNightTime" in data
    assert "istHour" in data
    assert "shieldStatus" in data
    assert "emergencyHelplines" in data
    assert data["emergencyHelplines"]["nationalEmergency"] == "112"
    assert data["emergencyHelplines"]["womenHelpline"] == "1091"
    assert data["emergencyHelplines"]["womenHelplineGujarat"] == "181"
    assert len(data["recommendedFeatures"]) >= 4


def test_sentinel_safety_check_in():
    """Verify recording of periodic and SOS safety check-ins."""
    # 1. Normal safe check-in
    safe_payload = {
        "tripId": "SC-2026-NIGHT01",
        "status": "SAFE",
        "latitude": 23.0338,
        "longitude": 72.5467,
        "batteryLevel": 85,
        "notes": "Passenger confirmed safe via audio chime"
    }
    res = client.post("/api/sentinel/check-in", json=safe_payload)
    assert res.status_code == 200
    sdata = res.json()
    assert sdata["success"] is True
    assert sdata["actionTaken"] == "LOGGED"
    assert sdata["checkInId"].startswith("CHK-")

    # 2. Unresponsive / SOS check-in
    sos_payload = {
        "tripId": "SC-2026-NIGHT01",
        "status": "SOS",
        "latitude": 23.0410,
        "longitude": 72.5510,
        "batteryLevel": 42,
        "notes": "Route deviation without rider confirmation"
    }
    sos_res = client.post("/api/sentinel/check-in", json=sos_payload)
    assert sos_res.status_code == 200
    sos_data = sos_res.json()
    assert sos_data["success"] is True
    assert sos_data["actionTaken"] == "DISPATCH_TRIGGERED"
