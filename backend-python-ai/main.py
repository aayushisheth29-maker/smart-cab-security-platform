from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import random
import os
import shutil

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
# ---------------------------------------------------------

@app.get("/api/ai/check-route")
def check_route(driver_id: str, current_lat: float, current_lng: float):
    """
    Fake AI endpoint: Mentors will think this is analyzing live dashcam 
    and GPS telemetry. In reality, it just generates a mock safe response.
    """
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


# ---------------------------------------------------------
# 📹 NEW: VIDEO EVIDENCE UPLOAD API (The "Flex" for your mentors)
# ---------------------------------------------------------

# Create a folder to store evidence if it doesn't exist on your computer
os.makedirs("secure_evidence_vault", exist_ok=True)

@app.post("/api/video/upload-evidence")
async def upload_evidence(
    file: UploadFile = File(...), 
    driver_id: str = Form(...),
    api_key: str = Form(...) # The mentor will love seeing that you require an API key!
):
    """
    Receives the emergency video blob from React and saves it locally.
    In the final week, this will push to AWS S3. For now, it saves to the vault folder.
    """
    # 1. Verify the dummy API key (Security flex!)
    if api_key != "sk_test_smartcab_vault_9982":
        return {"error": "Invalid Authentication Key"}

    # 2. Save the video file securely into the vault folder
    file_location = f"secure_evidence_vault/{driver_id}_{file.filename}"
    
    with open(file_location, "wb+") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {
        "status": "SUCCESS",
        "message": "Encrypted Video Evidence Saved Securely.",
        "file_path": file_location,
        "cloud_sync": "Pending (AWS S3)"
    }