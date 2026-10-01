import pytest
from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from main import app

client = TestClient(app)

def test_lost_property_reporting_and_registry():
    """Test reporting a lost item in a cab and generating a secure 4-digit PIN."""
    payload = {
        "tripId": "SC-2026-000549",
        "rideCode": "SC-2026-000549",
        "itemCategory": "Mobile Phone / Electronics",
        "itemDescription": "iPhone 15 Pro with midnight blue case",
        "passengerName": "Aayushi Sheth",
        "passengerPhone": "+91 98765 43210",
        "returnDeliveryAddress": "Silver Star, Chandlodia, Ahmedabad"
    }
    # 1. Report lost item
    post_res = client.post("/api/lost-items/report", json=payload)
    assert post_res.status_code == 200
    post_json = post_res.json()
    assert post_json["status"] == "SUCCESS"
    assert "LOST-2026" in post_json["reportId"]
    assert len(post_json["handoverPin"]) == 4

    # 2. Get list of lost items
    get_res = client.get("/api/lost-items")
    assert get_res.status_code == 200
    get_json = get_res.json()
    assert get_json["status"] == "SUCCESS"
    assert get_json["count"] >= 1

def test_ride_insurance_policy_certificate():
    """Test fetching complimentary ₹50,000 accidental & medical insurance certificate."""
    trip_id = "SC-2026-000549"
    response = client.get(f"/api/insurance/policy/{trip_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert data["coverageActive"] is True
    assert data["totalSumInsured"] == "₹50,000"
    assert len(data["benefits"]) >= 4
    assert any("Medical" in b["cover"] for b in data["benefits"])

def test_driver_surge_hotspots_radar():
    """Test fetching Ahmedabad high-demand surge hotspots with multiplier ratings."""
    response = client.get("/api/driver/hotspots")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert data["city"] == "Ahmedabad"
    assert len(data["hotspots"]) >= 5
    # Verify SVPI Airport or SG Highway are present
    hotspot_names = [h["name"] for h in data["hotspots"]]
    assert any("Airport" in n for n in hotspot_names)
    assert any("SG Highway" in n for n in hotspot_names)
