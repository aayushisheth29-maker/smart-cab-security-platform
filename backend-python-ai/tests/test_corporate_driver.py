import pytest
from fastapi.testclient import TestClient
import sys
import os

# Ensure backend-python-ai directory is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from main import app

client = TestClient(app)

def test_corporate_gstin_verification_valid():
    """Test valid Gujarat GSTIN format and state code decoding."""
    response = client.get("/api/corporate/verify-gstin/24AABCS1429B1Z8")
    assert response.status_code == 200
    data = response.json()
    assert data["isValid"] is True
    assert "Gujarat" in data["stateName"]
    assert data["sacCode"] == "9964"
    assert data["taxRateGst"] == "5%"

def test_corporate_gstin_verification_invalid():
    """Test invalid GSTIN format rejection."""
    response = client.get("/api/corporate/verify-gstin/INVALID_GST_123")
    assert response.status_code == 200
    data = response.json()
    assert data["isValid"] is False

def test_corporate_profile_crud():
    """Test updating and fetching corporate enterprise billing profile."""
    profile_data = {
        "companyName": "Alpha AI Tech Gujarat Pvt Ltd",
        "gstin": "24AABCS1429B1Z8",
        "businessEmail": "accounts@alphaaitech.in",
        "billingAddress": "GIFT City Tower One, Gandhinagar - 382355",
        "department": "Engineering & Ops",
        "costCenter": "CC-ALPHA-2026"
    }
    # Update profile
    post_res = client.post("/api/corporate/profile", json=profile_data)
    assert post_res.status_code == 200
    post_json = post_res.json()
    assert post_json["status"] == "SUCCESS"
    assert post_json["profile"]["companyName"] == "Alpha AI Tech Gujarat Pvt Ltd"

    # Fetch profile
    get_res = client.get("/api/corporate/profile")
    assert get_res.status_code == 200
    get_json = get_res.json()
    assert get_json["profile"]["gstin"] == "24AABCS1429B1Z8"

def test_corporate_invoices_list():
    """Test fetching B2B SAC 9964 GST invoices."""
    response = client.get("/api/corporate/invoices")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert isinstance(data["invoices"], list)
    assert len(data["invoices"]) >= 1
    sample = data["invoices"][0]
    assert "SAC 9964" in sample.get("sacCode", "SAC 9964")
    assert sample["totalFare"] > 0
    assert sample["cgst"] > 0
    assert sample["sgst"] > 0

def test_driver_daily_targets():
    """Test driver daily target incentives progress and tiers."""
    response = client.get("/api/driver/targets?driver_name=Rahul%20Sharma")
    assert response.status_code == 200
    data = response.json()
    assert "completedRidesToday" in data
    assert "targets" in data
    assert len(data["targets"]) == 3
    # Check Bronze, Silver, Gold tiers
    tier_names = [t["tier"] for t in data["targets"]]
    assert "Bronze" in tier_names
    assert "Silver" in tier_names
    assert "Gold" in tier_names

def test_driver_fuel_log_and_summary():
    """Test fuel expense logging and shift net earnings calculations."""
    driver_name = "Rahul Sharma"
    fuel_data = {
        "driverName": driver_name,
        "fuelType": "CNG",
        "amount": 420.0,
        "litresOrKg": 5.2,
        "odometerKm": 48300.0,
        "notes": "Adani CNG SG Highway Station"
    }
    # 1. Post fuel receipt
    post_res = client.post("/api/driver/fuel-log", json=fuel_data)
    assert post_res.status_code == 200
    post_json = post_res.json()
    assert post_json["status"] == "SUCCESS"
    assert post_json["entry"]["amount"] == 420.0

    # 2. Get fuel logs
    get_res = client.get(f"/api/driver/fuel-log?driver_name={driver_name}")
    assert get_res.status_code == 200
    get_json = get_res.json()
    assert get_json["totalFuelSpentToday"] >= 420.0

    # 3. Get shift summary with net profit calculation
    sum_res = client.get(f"/api/driver/shift-summary?driver_name={driver_name}")
    assert sum_res.status_code == 200
    sum_json = sum_res.json()
    assert "netTakeHomeProfit" in sum_json
    assert "grossFares" in sum_json
    assert "platformCommission10Pct" in sum_json
    assert sum_json["fuelExpensesDeducted"] >= 420.0

def test_driver_instant_imps_payout():
    """Test 1-tap instant IMPS / UPI bank payout."""
    payout_data = {
        "driverName": "Rahul Sharma",
        "amount": 250.0,
        "payoutMethod": "UPI",
        "accountNumber": "rahul.driver@okhdfcbank"
    }
    response = client.post("/api/driver/instant-payout", json=payout_data)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert data["amount"] == 250.0
    assert "UTR-IMPS" in data["utr"]
