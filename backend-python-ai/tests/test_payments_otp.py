"""Tests for Payment Gateway and Phone OTP Authentication Endpoints."""
import time
import pytest
from fastapi.testclient import TestClient
import main

client = TestClient(main.app)


def test_phone_otp_flow():
    # 1. Request OTP
    phone = "9876543210"
    res = client.post("/api/auth/send-otp", json={"phone": phone})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "sent"
    assert "phone" in data
    
    # Retrieve OTP from in-memory test store or response debug
    otp_record = main.OTP_STORE.get(phone)
    assert otp_record is not None
    otp = otp_record["otp"]
    assert len(otp) == 6

    # 2. Test Invalid OTP
    bad_res = client.post("/api/auth/verify-otp", json={"phone": phone, "otp": "000000"})
    assert bad_res.status_code == 400

    # 3. Test Valid OTP verification
    valid_res = client.post("/api/auth/verify-otp", json={"phone": phone, "otp": otp, "name": "Aayushi Sheth"})
    assert valid_res.status_code == 200
    auth_data = valid_res.json()
    assert "token" in auth_data
    assert auth_data["phone"] == phone
    assert auth_data["name"] == "Aayushi Sheth"


def test_payment_order_and_verification_flow():
    # 1. Create Payment Order
    order_payload = {
        "amount": 450.0,
        "currency": "INR",
        "tripId": 101,
        "riderName": "Aayushi Sheth",
        "riderPhone": "9876543210",
        "paymentMethod": "UPI"
    }
    res = client.post("/api/payments/create-order", json=order_payload)
    assert res.status_code == 200
    data = res.json()
    assert "orderId" in data
    assert data["amount"] == 450.0
    assert data["currency"] == "INR"
    order_id = data["orderId"]

    # 2. Verify Payment
    verify_payload = {
        "orderId": order_id,
        "paymentId": f"pay_{int(time.time())}",
        "paymentMethod": "UPI",
        "status": "SUCCESS"
    }
    v_res = client.post("/api/payments/verify", json=verify_payload)
    assert v_res.status_code == 200
    v_data = v_res.json()
    assert v_data["status"] == "PAID"
    assert v_data["orderId"] == order_id

    # 3. Cash Payment Confirmation
    cash_res = client.post("/api/payments/cash-confirm", json={"tripId": 102, "amount": 320.0})
    assert cash_res.status_code == 200
    assert cash_res.json()["paymentStatus"] == "CASH_ON_ARRIVAL"
