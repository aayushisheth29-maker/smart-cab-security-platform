from fastapi.testclient import TestClient
from main import app, HOSPITALS_DIRECTORY

client = TestClient(app)

def test_schedule_advance_trip():
    res = client.post("/api/trips/schedule", json={
        "riderName": "Aayushi Sheth",
        "phone": "+91 98765 43210",
        "pickupLocation": "SG Highway, Ahmedabad",
        "dropoffLocation": "Kalupur Railway Station, Ahmedabad",
        "pickupDateTime": "2026-10-02 06:00",
        "selectedCar": "SmartPro",
        "fare": 320.0,
        "flightTrainNumber": "12901 Gujarat Mail",
        "appliedPromo": "FIRSTFREE",
        "discount": 100.0
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    booking = data["booking"]
    assert booking["category"] == "SCHEDULED_ADVANCE"
    assert "SCHED-" in booking["rideCode"]
    assert "calendar.google.com" in booking["googleCalendarUrl"]
    assert "BEGIN:VCALENDAR" in booking["icsContent"]

def test_list_scheduled_trips():
    res = client.get("/api/trips/scheduled")
    assert res.status_code == 200
    trips = res.json()["scheduledTrips"]
    assert isinstance(trips, list)
    assert len(trips) >= 1

def test_nearest_hospitals_lookup():
    res = client.get("/api/medical/nearest-hospitals?lat=23.05&lng=72.52&city=Ahmedabad")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert len(data["hospitals"]) >= 5
    # Hospitals should be sorted by distance
    distances = [h["distanceKm"] for h in data["hospitals"]]
    assert distances == sorted(distances)
    assert data["hospitals"][0]["open24x7"] is True
    assert "emergencyPhone" in data["hospitals"][0]

def test_medical_profile_get_and_save():
    save_res = client.post("/api/medical/profile", json={
        "userId": "rider_test_123",
        "riderName": "Aayushi Sheth",
        "bloodGroup": "B+",
        "allergies": "Penicillin",
        "medicalConditions": "Asthma (Carries Inhaler)",
        "emergencyDoctorPhone": "+91 98765 10800",
        "organDonor": True
    })
    assert save_res.status_code == 200
    assert save_res.json()["profile"]["bloodGroup"] == "B+"

    get_res = client.get("/api/medical/profile?user_id=rider_test_123")
    assert get_res.status_code == 200
    profile = get_res.json()["profile"]
    assert profile["bloodGroup"] == "B+"
    assert profile["allergies"] == "Penicillin"

def test_medical_dispatch_alert():
    res = client.post("/api/medical/dispatch-alert", json={
        "lat": 23.0645,
        "lng": 72.5186,
        "hospitalId": "HOSP-05",
        "riderName": "Aayushi",
        "bloodGroup": "B+",
        "emergencyType": "CARDIAC_CHEST_PAIN",
        "medicalNotes": "Passenger experiencing acute shortness of breath."
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    alert = data["alert"]
    assert "MED-ALERT-" in alert["alertId"]
    assert "Zydus Hospital" in alert["targetHospital"]
    assert alert["ambulanceDispatched"] is True
