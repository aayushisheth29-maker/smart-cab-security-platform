# SmartCab Python AI Backend (FastAPI)

Lightweight service that does the "AI" part of SmartCab (route-safety scoring
+ video evidence handling) and writes an audit trail to the same Postgres
the Java backend uses.

## Endpoints

| Method | Path                              | Purpose |
|--------|-----------------------------------|---------|
| GET    | `/`                               | Service health + endpoint index |
| GET    | `/api/ai/check-route`             | Fake "safe" risk score, recorded in `ai_route_checks` |
| POST   | `/api/video/upload-evidence`      | Multipart video upload, recorded in `ai_evidence_log` |
| GET    | `/api/video/recent`               | Last 20 evidence entries (for dashboards) |

## Configuration

| Env var               | Default                              | Purpose |
|-----------------------|--------------------------------------|---------|
| `DATABASE_URL`        | *(empty)*                            | Postgres connection string (same one Java uses) |
| `EVIDENCE_VAULT_DIR`  | `secure_evidence_vault`              | Where uploaded videos are stored on disk |
| `SMARTCAB_API_KEY`    | `sk_test_smartcab_vault_9982`        | The dummy API key the upload endpoint checks |
| `PORT`                | `10000` (set by Render)              | Port to listen on |

If `DATABASE_URL` is **not** set, the service still works — it just doesn't
log to Postgres. File uploads still succeed and are stored on disk.

## Run

```bash
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 10000
```

## Tables it creates on first run (when `DATABASE_URL` is set)

- `ai_route_checks(id, driver_id, lat, lng, risk_score, is_safe, recorded_at)`
- `ai_evidence_log(id, evidence_id UNIQUE, driver_id, file_name, storage_path, size_bytes, recorded_at)`

These live alongside the Java-owned tables (`users`, `trips`, `evidence`, …)
in the same Postgres instance.
