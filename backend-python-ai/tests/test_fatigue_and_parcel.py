import pytest
from fastapi.testclient import TestClient
import main

client = TestClient(main.app)

# ---------------------------------------------------------------------------
# Feature 3: Driver Fatigue & Drowsiness AI Tests
# ---------------------------------------------------------------------------
def test_driver_fatigue_telemetry_normal():
    payload = {
        "driverId": "DRV-101",
        "driverName": "Rahul Sharma",
        "continuousDrivingMinutes": 120,
        "perclosPercentage": 22.5,
        "yawnCountLast10Min": 1,
        "headNodCount": 0,
    }
    res = client.post("/api/driver/fatigue/telemetry", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["fatigueLevel"] == "NORMAL"
    assert data["breakMandatory"] is False

def test_driver_fatigue_telemetry_critical_and_break():
    # 1. Post critical drowsiness telemetry (>4 hours continuous or high PERCLOS)
    payload = {
        "driverId": "DRV-101",
        "driverName": "Rahul Sharma",
        "continuousDrivingMinutes": 260,
        "perclosPercentage": 85.0,
        "yawnCountLast10Min": 4,
        "headNodCount": 2,
    }
    res = client.post("/api/driver/fatigue/telemetry", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["fatigueLevel"] == "CRITICAL_FATIGUE"
    assert data["breakMandatory"] is True
    assert "Tea Break" in data["recommendedAction"]

    # 2. Driver logs rest break
    res_break = client.post("/api/driver/fatigue/take-break", json={"driverId": "DRV-101", "breakMinutes": 15})
    assert res_break.status_code == 200
    break_data = res_break.json()
    assert break_data["success"] is True
    assert break_data["status"] == "REST_ACTIVE"

    # 3. Check status is reset/refreshed
    res_status = client.get("/api/driver/fatigue/status/DRV-101")
    assert res_status.status_code == 200
    assert res_status.json()["driverId"] == "DRV-101"


# ---------------------------------------------------------------------------
# Feature 4: SmartBike Express Parcel Delivery Tests
# ---------------------------------------------------------------------------
def test_parcel_delivery_lifecycle():
    # 1. Create parcel delivery order
    create_payload = {
        "senderName": "Pooja Patel",
        "senderPhone": "+91 98250 11111",
        "pickupAddress": "Prahlad Nagar, SG Highway, Ahmedabad",
        "receiverName": "Karan Shah",
        "receiverPhone": "+91 98250 22222",
        "deliveryAddress": "Navrangpura, CG Road, Ahmedabad",
        "packageType": "DOCUMENTS",
        "weightKg": 1.2,
        "distanceKm": 8.5,
        "deliveryNotes": "Confidential legal deed, handle with care",
    }
    res = client.post("/api/parcel/create", json=create_payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    parcel_id = data["parcelId"]
    delivery_otp = data["deliveryOtp"]
    assert parcel_id.startswith("PKG-")
    assert len(delivery_otp) == 4
    assert data["status"] == "REQUESTED"
    assert data["deliveryFare"] > 0

    # 2. Upload pickup photo proof
    res_proof = client.post(f"/api/parcel/{parcel_id}/proof-upload", json={
        "stage": "PICKUP",
        "photoUrl": "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&q=80&w=300",
        "notes": "Sealed document envelope collected"
    })
    assert res_proof.status_code == 200
    assert res_proof.json()["status"] == "PICKED_UP"

    # 3. Test wrong OTP rejection
    res_wrong_otp = client.post(f"/api/parcel/{parcel_id}/verify-otp", json={"enteredOtp": "0000"})
    assert res_wrong_otp.status_code == 400

    # 4. Test correct OTP verification and handover
    res_verify = client.post(f"/api/parcel/{parcel_id}/verify-otp", json={"enteredOtp": delivery_otp})
    assert res_verify.status_code == 200
    verify_data = res_verify.json()
    assert verify_data["success"] is True
    assert verify_data["status"] == "DELIVERED"

    # 5. Fetch parcel tracking details
    res_get = client.get(f"/api/parcel/{parcel_id}")
    assert res_get.status_code == 200
    assert res_get.json()["status"] == "DELIVERED"
