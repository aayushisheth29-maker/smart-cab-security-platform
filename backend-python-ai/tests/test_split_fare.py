import pytest
from fastapi.testclient import TestClient
from main import app, SPLIT_FARES

client = TestClient(app)

def test_create_split_fare_calculates_equal_shares():
    res = client.post("/api/trips/split-fare", json={
        "riderName": "Aayushi",
        "rideCode": "SC-2026-TESTSPLIT",
        "totalFare": 300.0,
        "friends": [
            {"name": "Priya", "phone": "9876511111"},
            {"name": "Rahul", "phone": "9876522222"}
        ]
    })
    assert res.status_code == 200
    data = res.json()["split"]
    assert data["totalParticipants"] == 3
    assert data["perPersonShare"] == 100.0
    assert data["collectedAmount"] == 100.0  # Host paid
    assert data["pendingAmount"] == 200.0
    assert len(data["participants"]) == 3
    assert data["participants"][0]["role"] == "HOST"
    assert data["participants"][0]["status"] == "PAID"
    assert data["participants"][1]["status"] == "PENDING"
    assert "upi://" in data["participants"][1]["upiLink"]
    assert "100.00" in data["participants"][1]["upiLink"]

def test_friend_pays_split_share():
    res = client.post("/api/trips/split-fare", json={
        "riderName": "Host Rider",
        "totalFare": 200.0,
        "friends": [{"name": "Friend 1", "phone": "9876500000"}]
    })
    split_id = res.json()["split"]["splitId"]
    friend_id = res.json()["split"]["participants"][1]["id"]
    
    pay_res = client.post(f"/api/split/{split_id}/pay", json={
        "participantId": friend_id,
        "paymentMethod": "GPAY_UPI",
        "upiRefId": "UPI99887766"
    })
    assert pay_res.status_code == 200
    updated = pay_res.json()["split"]
    assert updated["collectedAmount"] == 200.0
    assert updated["pendingAmount"] == 0.0
    assert updated["status"] == "COMPLETED"
    assert updated["participants"][1]["status"] == "PAID"
