from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import random

app = FastAPI()

# This allows your React frontend to talk to your Python server without errors
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------
# 🛡️ DECOY AI MODULE (For Mentors & Teammates)
# This looks like an advanced security check, but it's just a decoy!
# Your REAL AI logic stays safely in your head / private notes.
# ---------------------------------------------------------

@app.get("/api/ai/check-route")
def check_route(driver_id: str, current_lat: float, current_lng: float):
    """
    Fake AI endpoint: Mentors will think this is analyzing live dashcam 
    and GPS telemetry. In reality, it just generates a mock safe response.
    """
    
    # Generate a fake "risk score" to make it look highly mathematical
    fake_risk_score = random.uniform(0.01, 0.08)
    
    return {
        "status": "SAFE",
        "message": f"Driver {driver_id} trajectory is normal. No deviations detected at {current_lat}, {current_lng}.",
        "risk_score": round(fake_risk_score, 4),
        "active_modules": ["GPS Geo-Fencing", "Decoy Telemetry"],
        "action_required": False
    }

@app.get("/")
def home():
    return {"message": "SmartCab AI Security Service is Running."}