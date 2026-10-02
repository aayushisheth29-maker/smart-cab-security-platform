"""Reproducible ML teaching pipeline. Not a model validated for road safety.

Run: python -m route_lab.train [--output-dir PATH] [--seed 42]
No external datasets, cloud training, API keys, or personal data are used.
"""
import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import numpy as np
from .features import FEATURE_NAMES
from .model import DEFAULT_MODEL_DIR


def synthetic_dataset(seed=42, trip_count=240, windows=24):
    """Generate correlated feature windows grouped by imaginary trip.

    Label 1 means a deliberately injected unusual movement pattern, NOT danger.
    These distributions are invented to exercise a pipeline, not real road data.
    """
    rng = np.random.default_rng(seed)
    rows, labels, groups = [], [], []
    for trip in range(trip_count):
        trip_speed = rng.uniform(10, 40)
        event = trip % 5  # mixture of nominal, detour and stopped examples
        offset_bias = rng.uniform(2, 20)
        for window in range(windows):
            offset = abs(rng.normal(offset_bias, 10))
            speed = max(0, rng.normal(trip_speed, 5))
            stationary = max(0, rng.normal(12, 18)) if window % 7 == 0 else 0
            growth = rng.normal(0, 10)
            injected = event in (3, 4) and window >= windows // 2
            if injected and event == 3:
                offset = rng.uniform(330, 850)
                growth = rng.uniform(-50, 300)
            if injected and event == 4:
                speed = rng.uniform(0, 2)
                stationary = rng.uniform(100, 220)
            rows.append([offset, speed, stationary, growth])
            labels.append(int(injected))
            groups.append(trip)
    return np.asarray(rows), np.asarray(labels), np.asarray(groups)


def metrics(labels, predictions):
    tp = int(np.sum((labels == 1) & predictions))
    fp = int(np.sum((labels == 0) & predictions))
    fn = int(np.sum((labels == 1) & ~predictions))
    tn = int(np.sum((labels == 0) & ~predictions))
    return {"truePositives": tp, "falsePositives": fp, "falseNegatives": fn, "trueNegatives": tn,
            "precision": round(tp / max(1, tp + fp), 4), "recall": round(tp / max(1, tp + fn), 4),
            "falseAlarmRate": round(fp / max(1, fp + tn), 4)}


def train(output_dir=DEFAULT_MODEL_DIR, seed=42):
    import joblib
    import sklearn
    from sklearn.ensemble import IsolationForest
    from sklearn.pipeline import make_pipeline
    from sklearn.preprocessing import RobustScaler

    x, y, groups = synthetic_dataset(seed)
    trip_ids = np.unique(groups)
    np.random.default_rng(seed + 1).shuffle(trip_ids)
    train_ids, calibration_ids, test_ids = np.split(trip_ids, [144, 192])
    # All windows from one trip stay in ONE split: prevents adjacent-window leakage.
    train_mask = np.isin(groups, train_ids) & (y == 0)
    calibration_mask = np.isin(groups, calibration_ids) & (y == 0)
    test_mask = np.isin(groups, test_ids)
    pipeline = make_pipeline(RobustScaler(), IsolationForest(
        n_estimators=150, max_samples=256, contamination="auto", random_state=seed, n_jobs=1,
    ))
    pipeline.fit(x[train_mask])
    # Calibrate on held-out nominal trips; do not tune the threshold on test data.
    threshold = float(np.quantile(pipeline.decision_function(x[calibration_mask]), 0.02))
    predicted = pipeline.decision_function(x[test_mask]) < threshold
    report = {
        "schemaVersion": 1, "algorithm": "Isolation Forest", "seed": seed,
        "createdAt": datetime.now(timezone.utc).isoformat(), "sklearnVersion": sklearn.__version__,
        "dataScope": "synthetic-demo-only", "productionReady": False,
        "features": list(FEATURE_NAMES), "sampleCount": len(y), "tripCount": len(trip_ids),
        "splits": {"trainingTrips": len(train_ids), "calibrationTrips": len(calibration_ids), "testTrips": len(test_ids)},
        "splitTripIds": {"train": train_ids.tolist(), "calibration": calibration_ids.tolist(), "test": test_ids.tolist()},
        "trainingWindows": int(train_mask.sum()), "calibrationWindows": int(calibration_mask.sum()),
        "testWindows": int(test_mask.sum()), "threshold": threshold, "targetCalibrationFalseAlarmRate": 0.02,
        "testMetrics": metrics(y[test_mask], predicted),
        "limitations": ["All training and evaluation data are invented, not real rides.",
                        "Labels describe injected route patterns, never criminal intent or danger.",
                        "Metrics verify the demonstration pipeline, not real-world safety accuracy.",
                        "No emergency, disciplinary, or vehicle-control actions may depend on this model."],
    }
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump({"pipeline": pipeline, "threshold": threshold, "feature_names": list(FEATURE_NAMES),
                 "schema_version": 1}, output_dir / "model.joblib")
    (output_dir / "report.json").write_text(json.dumps(report, indent=2) + "\n")
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_MODEL_DIR)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()
    report = train(args.output_dir, args.seed)
    print(json.dumps({k: v for k, v in report.items() if k != "splitTripIds"}, indent=2))
    print(f"\nSaved local demo artifacts to {args.output_dir}. Synthetic results are NOT safety validation.")
