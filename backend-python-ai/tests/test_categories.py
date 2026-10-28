"""
Test suite for Vehicle Category Expansion:
SmartAuto CNG, SmartBike Express, SmartMini AC, SmartSedan Prime, SmartSUV Guard.
"""
import pytest
from fastapi.testclient import TestClient
from main import app, PRICING_TABLE, VEHICLE_CATEGORIES_CATALOG

client = TestClient(app)


def test_vehicle_categories_catalog():
    """Verify all 5 vehicle tiers exist with required attributes."""
    response = client.get("/api/categories")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["count"] == 5
    ids = [c["id"] for c in data["categories"]]
    assert "SmartAuto" in ids
    assert "SmartBike" in ids
    assert "SmartMini" in ids
    assert "SmartSedan" in ids
    assert "SmartSUV" in ids

    # Check specs on SmartAuto
    auto = next(c for c in data["categories"] if c["id"] == "SmartAuto")
    assert auto["baseFare"] == 30
    assert auto["perKmRate"] == 11
    assert auto["capacity"] == 3
    assert "CNG" in auto["fuelType"]

    # Check specs on SmartSedan
    sedan = next(c for c in data["categories"] if c["id"] == "SmartSedan")
    assert sedan["baseFare"] == 55
    assert sedan["perKmRate"] == 14
    assert sedan["categoryGroup"] == "premium"


def test_vehicle_categories_filter_group():
    """Verify filtering by group=daily and group=premium."""
    daily_res = client.get("/api/categories?group=daily")
    assert daily_res.status_code == 200
    daily_data = daily_res.json()
    assert daily_data["count"] == 3
    daily_ids = [c["id"] for c in daily_data["categories"]]
    assert set(daily_ids) == {"SmartAuto", "SmartBike", "SmartMini"}

    prem_res = client.get("/api/categories?group=premium")
    assert prem_res.status_code == 200
    prem_data = prem_res.json()
    assert prem_data["count"] == 2
    prem_ids = [c["id"] for c in prem_data["categories"]]
    assert set(prem_ids) == {"SmartSedan", "SmartSUV"}


def test_pricing_estimate_all_categories():
    """Verify /api/pricing/estimate returns comparative allOptions for all 5 categories."""
    payload = {
        "distanceKm": 10.0,
        "selectedCar": "SmartSedan",
        "bookingTime": "2026-10-28T12:00:00+05:30"  # Off-peak 1.0x surge
    }
    response = client.post("/api/pricing/estimate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["selectedCar"] == "SmartSedan"
    assert data["distanceKm"] == 10.0
    # SmartSedan: base 55 + (10 * 14) = 195
    assert data["baseFare"] == 55.0
    assert data["distanceFare"] == 140.0
    assert data["totalFare"] == 195.0

    all_opts = data["allOptions"]
    assert len(all_opts) == 5
    # Cheapest should be SmartBike: base 18 + 70 = 88
    assert all_opts[0]["carType"] == "SmartBike"
    assert all_opts[0]["totalFare"] == 88.0

    # Most expensive should be SmartSUV: base 85 + 200 = 285
    assert all_opts[-1]["carType"] == "SmartSUV"
    assert all_opts[-1]["totalFare"] == 285.0


def test_trip_booking_with_ride_preferences_and_category():
    """Verify trip creation persists category and custom ride preferences."""
    payload = {
        "riderName": "Pooja Sharma",
        "riderPhone": "+919876543210",
        "pickupLocation": "Vastrapur Lake, Ahmedabad",
        "dropoffLocation": "GIFT City, Gandhinagar",
        "distanceKm": 25.0,
        "selectedCar": "SmartSedan",
        "ridePreferences": {
            "acPreference": "Chilled (20°C)",
            "quietRide": True,
            "luggageAssistance": True,
            "womenDriverPreference": True,
        }
    }
    response = client.post("/api/trips", json=payload)
    assert response.status_code == 200
    trip = response.json()
    assert trip["selectedCar"] == "SmartSedan"
    assert trip["ridePreferences"]["quietRide"] is True
    assert trip["ridePreferences"]["acPreference"] == "Chilled (20°C)"
    assert "driver" in trip
    assert trip["driver"]["vehicleTier"] == "SmartSedan"
