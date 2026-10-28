"""SmartCab RouteGuard™ Model Loader.

Loads the trained production Isolation Forest pipeline or demo artifact.
"""
import json
import os
from pathlib import Path
from typing import Dict, Any, Optional
from .features import FEATURE_NAMES

DEFAULT_MODEL_DIR = Path(__file__).resolve().parents[1] / ".cache" / "route-model"


class DemoModel:
    def __init__(self, directory=None):
        self.bundle = None
        self.pipeline = None
        self.report = None
        self.is_production = False
        self.threshold = 0.0
        self.error = None
        self.directory = Path(directory or os.environ.get("SMARTCAB_ROUTE_MODEL_DIR", DEFAULT_MODEL_DIR))
        self.load()

    def load(self):
        try:
            import joblib
            import sklearn
            
            prod_report_path = self.directory / "production_report.json"
            prod_model_path = self.directory / "production_model.joblib"
            demo_report_path = self.directory / "report.json"
            demo_model_path = self.directory / "model.joblib"

            if prod_report_path.exists() and prod_model_path.exists():
                report = json.loads(prod_report_path.read_text())
                pipeline = joblib.load(prod_model_path)
                self.report = report
                self.pipeline = pipeline
                self.threshold = float(report.get("threshold", 0.0))
                self.is_production = True
                self.bundle = {"pipeline": self.pipeline, "threshold": self.threshold}
                self.error = None
                return

            if demo_report_path.exists() and demo_model_path.exists():
                report = json.loads(demo_report_path.read_text())
                if report.get("dataScope") != "synthetic-demo-only" or report.get("productionReady") is not False:
                    raise ValueError("Only a synthetic demo model is allowed in this preview mode.")
                if report.get("sklearnVersion") != sklearn.__version__:
                    raise ValueError("Retrain the artifact with the installed scikit-learn version.")
                raw_bundle = joblib.load(demo_model_path)
                if tuple(raw_bundle.get("feature_names", ())) != FEATURE_NAMES or raw_bundle.get("schema_version") != 1:
                    raise ValueError("Model feature schema does not match the preview.")
                self.bundle = raw_bundle
                self.pipeline = raw_bundle.get("pipeline")
                self.report = report
                self.threshold = float(raw_bundle.get("threshold", -0.14))
                self.is_production = False
                self.error = None
                return

            self.error = "Run python -m route_lab.train_real to train the model."
        except FileNotFoundError:
            self.error = "Model files not found."
        except Exception as e:
            self.bundle = None
            self.pipeline = None
            self.report = None
            self.error = f"Model load error: {str(e)}"

    def status(self) -> Dict[str, Any]:
        return {
            "available": self.pipeline is not None or self.bundle is not None,
            "algorithm": "Isolation Forest (StandardScaler + 200 Estimators)",
            "dataScope": "real-corridor-fleet-data" if self.is_production else "synthetic-demo-only",
            "productionReady": self.is_production,
            "note": "Spatial anomaly detection based on GPS offset, velocity variance, and stationary dwell time.",
            "report": self.report,
            "error": self.error,
        }

    def score(self, features: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        if (self.pipeline is None and self.bundle is None) or features is None:
            return {
                "available": False,
                "label": "Not assessed",
                "score": None,
                "reason": self.error if not self.pipeline and not self.bundle else "Usable location history is required.",
            }
        
        row = [[features[name] for name in FEATURE_NAMES]]
        try:
            pipe = self.pipeline or self.bundle.get("pipeline")
            score = float(pipe.decision_function(row)[0])
        except Exception as err:
            return {
                "available": False,
                "label": "Not assessed",
                "score": None,
                "reason": f"Scoring error: {str(err)}",
            }
            
        unusual = score < self.threshold
        return {
            "available": True,
            "label": "Anomalous Route Deviation" if unusual else "Normal Driving Pattern",
            "unusual": unusual,
            "score": round(score, 4),
            "threshold": round(self.threshold, 4),
            "isProbability": False,
            "dataScope": "real-corridor-fleet-data" if self.is_production else "synthetic-demo-only",
            "productionReady": self.is_production,
        }
