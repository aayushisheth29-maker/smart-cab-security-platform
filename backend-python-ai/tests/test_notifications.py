import pytest
from fastapi.testclient import TestClient
from main import app
from notification_service import (
    dispatch_emergency_broadcast,
    send_trip_share_notification,
    _format_e164_indian_phone,
    DISPATCH_LOGS
)

client = TestClient(app)

def test_indian_phone_number_formatting():
    assert _format_e164_indian_phone("9876543210") == "+919876543210"
    assert _format_e164_indian_phone("+919876543210") == "+919876543210"
    assert _format_e164_indian_phone("919876543210") == "+919876543210"
    assert _format_e164_indian_phone("098765 43210") == "+919876543210"

def test_emergency_broadcast_dispatch():
    contacts = [
        {"name": "Priya Sharma (Mom)", "phone": "+91 98765 11111"},
        {"name": "Rajesh Sharma (Dad)", "phone": "9876522222"}
    ]
    report = dispatch_emergency_broadcast(
        rider_name="Aayushi Sheth",
        ride_code="SC-2026-TEST01",
        contacts=contacts,
        driver_name="Ramesh Bhai",
        car_plate="GJ 01 SC 8899",
        pickup="Gota, Ahmedabad",
        dropoff="Airport, Ahmedabad",
        reason="Test Safety SOS"
    )
    assert report["status"] == "COMPLETED"
    assert report["recipientsCount"] == 2
    assert len(report["recipients"]) == 2
    assert report["recipients"][0]["smsStatus"] == "DELIVERED"
    assert report["recipients"][0]["whatsappStatus"] == "SENT"
    assert "/track/SC-2026-TEST01" in report["trackingLink"]
    assert "9876511111" in report["recipients"][0]["phone"]

def test_api_test_broadcast_endpoint():
    res = client.post("/api/emergency/test-broadcast", json={
        "phone": "9876543210",
        "name": "Sister"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["report"]["recipientsCount"] == 1
    assert data["report"]["recipients"][0]["phone"] == "+919876543210"

def test_api_emergency_dispatch_logs_endpoint():
    res = client.get("/api/emergency/dispatch-logs")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert isinstance(data["logs"], list)
    assert data["count"] >= 1
