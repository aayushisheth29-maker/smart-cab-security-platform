import pytest
from fastapi.testclient import TestClient
from main import app, TRIP_REVIEWS, DRIVER_PAYOUTS_STORE

client = TestClient(app)

def test_rate_trip_with_safety_compliments_and_tip():
    res = client.post("/api/trips/rate", json={
        "tripId": "TRIP-TEST-999",
        "driverId": 1,
        "driverName": "Anita M.",
        "rating": 5,
        "safetyCompliments": ["Safe Driver", "Spotless Cab", "Polite Behavior"],
        "feedback": "Felt completely safe during late night ride!",
        "tipAmount": 50.0,
        "tipPaymentMethod": "UPI",
        "riderName": "Aayushi"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["review"]["rating"] == 5
    assert data["review"]["tipAmount"] == 50.0
    assert len(data["review"]["safetyCompliments"]) == 3
    
    # Check driver reviews endpoint
    rev_res = client.get("/api/drivers/1/reviews")
    assert rev_res.status_code == 200
    d_data = rev_res.json()
    assert d_data["totalReviews"] >= 1
    assert "Safe Driver" in d_data["topCompliments"]
    assert d_data["totalTipsReceived"] >= 50.0

def test_get_trip_rating_status():
    res = client.get("/api/trips/TRIP-TEST-999/rating")
    assert res.status_code == 200
    assert res.json()["hasRated"] is True
