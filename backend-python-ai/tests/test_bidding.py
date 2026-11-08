import pytest
from fastapi.testclient import TestClient
import main

client = TestClient(main.app)

def test_bidding_session_lifecycle():
    # 1. Create a bidding session with rider's custom offer fare
    create_payload = {
        "pickupLocation": "AIT College, Ognaj, Ahmedabad",
        "dropoffLocation": "Iskcon Crossroads, SG Highway, Ahmedabad",
        "distanceKm": 12.5,
        "recommendedFare": 210.0,
        "riderOfferFare": 180.0,
        "selectedCar": "SmartMini",
        "passengerNotes": "AC on chilled, traveling with 1 small bag",
        "riderName": "Aayushi S.",
        "riderPhone": "+91 98250 12345"
    }

    res = client.post("/api/bidding/create", json=create_payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    session_id = data["sessionId"]
    assert session_id.startswith("BID-")
    assert len(data["driverOffers"]) >= 2
    assert data["riderOfferFare"] == 180.0

    # 2. Get active offers
    res_offers = client.get(f"/api/bidding/{session_id}/offers")
    assert res_offers.status_code == 200
    offers_data = res_offers.json()
    assert offers_data["status"] == "BIDDING_ACTIVE"
    assert len(offers_data["offers"]) >= 2

    # 3. Boost rider offer (+₹20)
    res_boost = client.post(f"/api/bidding/{session_id}/boost", json={"boostAmount": 20.0})
    assert res_boost.status_code == 200
    boost_data = res_boost.json()
    assert boost_data["newRiderOffer"] == 200.0
    assert boost_data["offersCount"] >= len(data["driverOffers"])

    # 4. Accept a driver offer
    first_offer = boost_data["offers"][0]
    accept_payload = {
        "driverId": first_offer["driverId"],
        "offerId": first_offer["offerId"]
    }
    res_accept = client.post(f"/api/bidding/{session_id}/accept", json=accept_payload)
    assert res_accept.status_code == 200
    accept_data = res_accept.json()
    assert accept_data["success"] is True
    assert accept_data["status"] == "MATCHED"
    assert "tripId" in accept_data
    assert accept_data["agreedFare"] == first_offer["proposedFare"]

def test_bidding_cancel():
    create_payload = {
        "pickupLocation": "Prahlad Nagar, Ahmedabad",
        "dropoffLocation": "SVPI Airport, Ahmedabad",
        "distanceKm": 18.0,
        "recommendedFare": 320.0,
        "riderOfferFare": 280.0,
        "selectedCar": "SmartSedan",
    }
    res = client.post("/api/bidding/create", json=create_payload)
    session_id = res.json()["sessionId"]

    res_cancel = client.post(f"/api/bidding/{session_id}/cancel")
    assert res_cancel.status_code == 200
    assert res_cancel.json()["status"] == "CANCELLED"

    res_offers = client.get(f"/api/bidding/{session_id}/offers")
    assert res_offers.json()["status"] == "CANCELLED"
