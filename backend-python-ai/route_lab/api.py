"""Standalone, synthetic-only preview API. Does NOT import the production app.

uvicorn route_lab.api:app --host 0.0.0.0 --port 8001
No live GPS input, Gemini key, database connection, notifications or SOS endpoint.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field
from .features import assess_route, DEVIATION_M, DEVIATION_SECONDS, STOP_SECONDS, MAX_ACCURACY_M
from .model import DemoModel
from .scenarios import PLAN, SCENARIOS, SAMPLE_COUNT, samples_for, scenario_payload

app = FastAPI(title="SmartCab Route Lab — synthetic preview", version="0.1.0")
# Packaged Capacitor webviews. Browser previews use the Vite same-origin proxy.
app.add_middleware(CORSMiddleware, allow_origins=["capacitor://localhost", "http://localhost", "https://localhost"],
                   allow_methods=["GET", "POST"], allow_headers=["Content-Type"], allow_credentials=False)
model = DemoModel()


class AnalyzeRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    scenario: str = Field(min_length=1, max_length=24)
    sampleIndex: int = Field(ge=0, lt=SAMPLE_COUNT, strict=True)


@app.get("/api/preview/health")
def health():
    return {"status": "ok", "environment": "synthetic-preview", "acceptsLiveGps": False,
            "automaticActions": False, "modelAvailable": model.bundle is not None}


@app.get("/api/preview/scenarios")
def scenarios():
    return {"scenarios": [scenario_payload(key) for key in SCENARIOS],
            "thresholds": {"deviationMeters": DEVIATION_M, "deviationSeconds": DEVIATION_SECONDS,
                           "stopSeconds": STOP_SECONDS, "maxAccuracyMeters": MAX_ACCURACY_M},
            "notice": "Synthetic preview only. Not navigation, emergency dispatch, or a safety guarantee."}


@app.get("/api/preview/model")
def model_info():
    status = model.status()
    # Group IDs belong in the downloadable local training report, not the UI.
    if status["report"]:
        status["report"] = {k: v for k, v in status["report"].items() if k != "splitTripIds"}
    return status


@app.post("/api/preview/analyze")
def analyze(payload: AnalyzeRequest):
    if payload.scenario not in SCENARIOS:
        raise HTTPException(status_code=404, detail="Unknown synthetic scenario.")
    samples = samples_for(payload.scenario)[:payload.sampleIndex + 1]
    assessment = assess_route(PLAN, samples, as_of=samples[-1].timestamp)
    return {"scenario": payload.scenario, "sampleIndex": payload.sampleIndex, "isDemo": True,
            "assessment": assessment, "ml": model.score(assessment["features"])}
