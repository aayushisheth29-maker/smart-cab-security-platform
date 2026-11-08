import pytest
from fastapi.testclient import TestClient
import main

client = TestClient(main.app)

def test_wallet_topup_and_pay():
    # 1. Check initial balance
    res_bal = client.get("/api/wallet/balance?userId=USER-101")
    assert res_bal.status_code == 200
    bal_data = res_bal.json()
    assert "balance" in bal_data
    initial_balance = bal_data["balance"]

    # 2. Top-up wallet (+₹500)
    res_topup = client.post("/api/wallet/topup", json={
        "userId": "USER-101",
        "amount": 500.0,
        "paymentMethod": "UPI_GPAY"
    })
    assert res_topup.status_code == 200
    topup_data = res_topup.json()
    assert topup_data["success"] is True
    assert topup_data["newBalance"] == initial_balance + 500.0

    # 3. Pay for ride using wallet
    res_pay = client.post("/api/wallet/pay", json={
        "userId": "USER-101",
        "tripId": "TRIP-WAL-1",
        "amount": 180.0
    })
    assert res_pay.status_code == 200
    pay_data = res_pay.json()
    assert pay_data["success"] is True
    assert pay_data["status"] == "PAID"
    assert pay_data["remainingBalance"] == initial_balance + 320.0

def test_cash_collected_with_change():
    res = client.post("/api/payments/cash-collected", json={
        "tripId": "TRIP-CASH-1",
        "fareAmount": 184.0,
        "cashTendered": 200.0,
        "driverId": "DRV-101"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["changeDue"] == 16.0
    assert data["paymentStatus"] == "CASH_COLLECTED"

def test_upi_qr_intent_generation():
    res = client.post("/api/payments/upi-intent", json={
        "amount": 240.0,
        "tripId": "TRIP-UPI-1",
        "riderName": "Aayushi Sheth"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "upi://pay" in data["upiString"]
    assert "smartcab.india@okhdfcbank" in data["upiString"]
    assert "qrSvgBase64" in data or "qrDataUrl" in data

def test_card_tokenization_and_charge():
    # 1. Tokenize card
    tokenize_payload = {
        "cardNumber": "4111222233334242",
        "cardHolder": "Aayushi Sheth",
        "expiry": "08/29",
        "cvv": "123",
        "userId": "USER-101"
    }
    res_tok = client.post("/api/payments/card/tokenize", json=tokenize_payload)
    assert res_tok.status_code == 200
    tok_data = res_tok.json()
    assert tok_data["success"] is True
    assert tok_data["cardToken"].startswith("CARD-TOK-")
    assert tok_data["last4"] == "4242"
    assert tok_data["brand"] == "Visa"

    # 2. Charge tokenized card
    charge_payload = {
        "cardToken": tok_data["cardToken"],
        "amount": 250.0,
        "tripId": "TRIP-CARD-1",
        "cvv": "123"
    }
    res_charge = client.post("/api/payments/card/charge", json=charge_payload)
    assert res_charge.status_code == 200
    charge_data = res_charge.json()
    assert charge_data["success"] is True
    assert charge_data["status"] == "PAID"
    assert "paymentId" in charge_data
