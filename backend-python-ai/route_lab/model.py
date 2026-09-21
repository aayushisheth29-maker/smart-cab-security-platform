"""Load only a locally trained demo artifact. Never load a model uploaded by a client."""
import json
import os
from pathlib import Path
from .features import FEATURE_NAMES

DEFAULT_MODEL_DIR = Path(__file__).resolve().parents[1] / ".cache" / "route-model"


class DemoModel:
    def __init__(self, directory=None):
        self.bundle = None
        self.report = None
        self.error = "Run python -m route_lab.train to create the synthetic demo model."
        directory = Path(directory or os.environ.get("SMARTCAB_ROUTE_MODEL_DIR", DEFAULT_MODEL_DIR))
        try:
            import joblib
            import sklearn
            report = json.loads((directory / "report.json").read_text())
            if report.get("dataScope") != "synthetic-demo-only" or report.get("productionReady") is not False:
                raise ValueError("Only a synthetic demo model is allowed in this preview.")
            if report.get("sklearnVersion") != sklearn.__version__:
                raise ValueError("Retrain the artifact with the installed scikit-learn version.")
            # joblib/pickle can execute code. This path is server-controlled, never an upload/API parameter.
            bundle = joblib.load(directory / "model.joblib")
            if tuple(bundle["feature_names"]) != FEATURE_NAMES or bundle.get("schema_version") != 1:
                raise ValueError("Model feature schema does not match the preview.")
            self.bundle, self.report, self.error = bundle, report, None
        except FileNotFoundError:
            pass
        except Exception:
            self.error = "Demo model unavailable or incompatible. Retrain locally; rule-based warnings still work."

    def status(self):
        return {"available": self.bundle is not None, "algorithm": "Isolation Forest",
                "dataScope": "synthetic-demo-only", "productionReady": False,
                "note": "Detects unusual feature patterns, not danger. Scores are not probabilities.",
                "report": self.report, "error": self.error}

    def score(self, features):
        if self.bundle is None or features is None:
            return {"available": False, "label": "Not assessed", "score": None,
                    "reason": self.error if self.bundle is None else "Usable location history is required."}
        row = [[features[name] for name in FEATURE_NAMES]]
        try:
            score = float(self.bundle["pipeline"].decision_function(row)[0])
        except Exception:
            return {"available": False, "label": "Not assessed", "score": None,
                    "reason": "Model prediction unavailable. Rule-based observations remain available."}
        unusual = score < self.bundle["threshold"]
        return {"available": True, "label": "Unusual in demo data" if unusual else "Within demo patterns",
                "unusual": unusual, "score": round(score, 4), "threshold": round(self.bundle["threshold"], 4),
                "isProbability": False, "dataScope": "synthetic-demo-only", "productionReady": False}
