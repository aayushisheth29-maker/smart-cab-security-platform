import pytest
from fastapi.testclient import TestClient
from main import app, AIRPORT_FLIGHTS_DATABASE

client = TestClient(app)

def test_flight_status_lookup():
    res = client.get("/api/airport/flight-status/6E2145")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["flight"]["airline"] == "IndiGo"
    assert "Terminal 1" in data["flight"]["terminal"]
    assert data["freeWaitBufferMinutes"] == 45

def test_airport_terminals_list():
    res = client.get("/api/airport/terminals")
    assert res.status_code == 200
    terminals = res.json()["terminals"]
    assert len(terminals) == 2
    assert "Terminal 1" in terminals[0]["name"]
    assert "Terminal 2" in terminals[1]["name"]

def test_book_airport_fasttrack():
    res = client.post("/api/trips/book-airport-fasttrack", json={
        "tripDirection": "PICKUP_FROM_AIRPORT",
        "terminal": "Terminal 1 (Domestic)",
        "flightNumber": "6E 2145",
        "cityAddress": "Prahlad Nagar, SG Highway, Ahmedabad",
        "pickupPillar": "Pillar 2B (T1 Arrival)",
        "meetAndGreet": True,
        "passengerName": "Aayushi",
        "phone": "+91 9876543210",
        "selectedCar": "SmartPro"
    })
    assert res.status_code == 200
    booking = res.json()["booking"]
    assert booking["category"] == "AIRPORT_FASTTRACK"
    assert booking["flightNumber"] == "6E 2145"
    assert "SVPI Airport" in booking["pickupLocation"]
    assert booking["freeWaitBufferMinutes"] == 45
