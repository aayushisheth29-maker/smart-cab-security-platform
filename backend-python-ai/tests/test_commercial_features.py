import pytest
from fastapi.testclient import TestClient
import main
from main import app

client = TestClient(app)


def test_get_tax_invoice():
    res = client.get("/api/trips/1/invoice")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SUCCESS"
    assert "invoiceNumber" in data
    assert data["platformDetails"]["gstin"] == "24AAECS1234F1Z8"
    assert data["platformDetails"]["sacCode"] == "996412"
    assert "fareBreakdown" in data
    assert data["fareBreakdown"]["cgstRate"] == "2.5%"
    assert data["fareBreakdown"]["sgstRate"] == "2.5%"
    assert data["fareBreakdown"]["totalFarePaid"] > 0
    assert data["digitalStamp"]["verified"] is True


def test_get_tax_invoice_with_corporate_gstin():
    res = client.get("/api/trips/1/invoice?customer_gstin=24ABCDE1234F1Z5&company_name=Acme+Corp+India")
    assert res.status_code == 200
    data = res.json()
    assert data["customerDetails"]["customerGstin"] == "24ABCDE1234F1Z5"
    assert data["customerDetails"]["companyName"] == "Acme Corp India"


def test_get_driver_weekly_analytics():
    res = client.get("/api/driver/weekly-analytics?driver_name=Rahul+Sharma")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SUCCESS"
    assert len(data["days"]) == 7
    assert "kpis" in data
    assert data["kpis"]["totalWeeklyGross"] > 0
    assert data["kpis"]["driverNet80Cut"] > 0
    assert "mileageIntelligence" in data
    assert data["mileageIntelligence"]["fuelEfficiencyKmPerKg"] > 0
    assert len(data["partnerPerks"]) >= 3


def test_create_trip_beacon_share():
    res = client.post("/api/trips/1/beacon-share", json={
        "riderName": "Aayushi Sheth",
        "shareExpiryHours": 12
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SUCCESS"
    assert data["linkId"].startswith("BEACON_")
    assert "fullShareUrl" in data
    assert "whatsappUrl" in data
    assert "SmartCab Live Ride Beacon" in data["whatsappShareText"]
