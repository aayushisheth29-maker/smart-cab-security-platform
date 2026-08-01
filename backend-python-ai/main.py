from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# This creates our AI Backend app!
app = FastAPI(
    title="SmartCab AI Security Service",
    description="Microservice handling route deviation and SOS alerts",
    version="1.0.0"
)

# NEW: Security Pass so React can talk to Python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows your React app to connect
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "Welcome to the SmartCab Python AI Backend! 🚀"}

# This is a mock API for our Route Deviation feature
@app.get("/api/ai/check-route")
def check_route(driver_id: str, current_lat: float, current_lng: float):
    return {
        "status": "Safe",
        "deviation_meters": 0,
        "message": f"Driver {driver_id} is perfectly on route!"
    }