from fastapi import FastAPI

# This creates our AI Backend app!
app = FastAPI(
    title="SmartCab AI Security Service",
    description="Microservice handling route deviation and SOS alerts",
    version="1.0.0"
)

# This is our first API Route
@app.get("/")
def home():
    return {"message": "Welcome to the SmartCab Python AI Backend! 🚀"}

# This is a mock API for our Route Deviation feature
@app.get("/api/ai/check-route")
def check_route(driver_id: str, current_lat: float, current_lng: float):
    # Later, we will add real AI math here. For now, it just replies!
    return {
        "status": "Safe",
        "deviation_meters": 0,
        "message": f"Driver {driver_id} is perfectly on route."
    }