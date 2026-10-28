import pytest
from fastapi.testclient import TestClient
from main import app, RENTAL_PACKAGES, OUTSTATION_POPULAR_ROUTES

client = TestClient(app)

def test_get_rental_packages():
    res = client.get("/api/pricing/rental-packages")
    assert res.status_code == 200
    pkgs = res.json()["packages"]
    assert len(pkgs) >= 4
    assert pkgs[0]["id"] == "PKG_2HR_20KM"

def test_get_outstation_routes():
    res = client.get("/api/pricing/outstation-routes")
    assert res.status_code == 200
    routes = res.json()["routes"]
    assert len(routes) >= 6
    vadodara = next(r for r in routes if "Vadodara" in r["destination"])
    assert vadodara["oneWayFare"] == 1499.0
    assert vadodara["roundTripFare"] == 2499.0

def test_book_hourly_rental():
    res = client.post("/api/trips/book-rental", json={
        "packageId": "PKG_4HR_40KM",
        "selectedCar": "SmartPro",
        "pickupLocation": "Prahlad Nagar, Ahmedabad",
        "stops": ["Vastrapur Lake", "Sindhu Bhavan"],
        "riderName": "Aayushi",
        "phone": "+91 9876543210"
    })
    assert res.status_code == 200
    booking = res.json()["booking"]
    assert booking["category"] == "RENTAL_HOURLY"
    assert "4 Hours" in booking["packageName"]
    assert booking["fare"] == 529.0

def test_book_outstation_round_trip():
    res = client.post("/api/trips/book-outstation", json={
        "tripType": "ROUND_TRIP",
        "origin": "Ahmedabad",
        "destination": "Vadodara",
        "selectedCar": "SmartPro",
        "departureDate": "2026-10-05T08:00:00",
        "returnDate": "2026-10-05T20:00:00",
        "riderName": "Aayushi",
        "phone": "+91 9876543210"
    })
    assert res.status_code == 200
    booking = res.json()["booking"]
    assert booking["category"] == "OUTSTATION"
    assert booking["tripType"] == "ROUND_TRIP"
    assert booking["fare"] == 2499.0
