#!/usr/bin/env bash
# Resume the synthetic-only preview, including after temporary dependencies expire.
# Does not run main.py, change production settings, push code, or send alerts.
set -euo pipefail
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
CACHE="$ROOT/.cache/route-lab-startup"
mkdir -p "$CACHE"
case "${1:-}" in
  api)
    cd "$ROOT"
    if [[ ! -x .venv/bin/python ]]; then
      python3 -m venv .venv
    fi
    HASH="$(sha256sum backend-python-ai/requirements-route-preview.txt | cut -d ' ' -f 1)"
    if [[ ! -f "$CACHE/api-dependencies.sha" ]] || [[ "$(cat "$CACHE/api-dependencies.sha")" != "$HASH" ]] || ! .venv/bin/python -c 'import fastapi, uvicorn, numpy, sklearn, joblib' >/dev/null 2>&1; then
      echo 'Preparing the isolated Route Lab dependencies…'
      if ! .venv/bin/python -m pip install -r backend-python-ai/requirements-route-preview.txt > "$CACHE/api-install.log" 2>&1; then
        tail -n 40 "$CACHE/api-install.log"
        exit 1
      fi
      printf '%s\n' "$HASH" > "$CACHE/api-dependencies.sha"
    fi
    cd "$ROOT/backend-python-ai"
    if ! ../.venv/bin/python -c 'from route_lab.model import DemoModel; raise SystemExit(0 if DemoModel().bundle is not None else 1)' >/dev/null 2>&1; then
      if [[ -n "${SMARTCAB_ROUTE_MODEL_DIR:-}" ]]; then
        echo 'Custom model unavailable. Rule-based observations will still work; custom artifacts are not overwritten.'
      else
        echo 'Regenerating the synthetic demonstration model (no real trip data)…'
        ../.venv/bin/python -m route_lab.train --seed 42 > "$CACHE/training.log"
      fi
    fi
    exec ../.venv/bin/python -m uvicorn route_lab.api:app --host 0.0.0.0 --port 8001
    ;;
  web)
    cd "$ROOT/frontend"
    HASH="$(sha256sum package-lock.json package.json | sha256sum | cut -d ' ' -f 1)"
    if [[ ! -x node_modules/.bin/vite ]] || [[ ! -f "$CACHE/web-dependencies.sha" ]] || [[ "$(cat "$CACHE/web-dependencies.sha")" != "$HASH" ]]; then
      echo 'Preparing the mobile preview dependencies…'
      if ! npm ci > "$CACHE/web-install.log" 2>&1; then
        tail -n 40 "$CACHE/web-install.log"
        exit 1
      fi
      printf '%s\n' "$HASH" > "$CACHE/web-dependencies.sha"
    fi
    exec npm run dev:route-preview -- --host 0.0.0.0 --port 5173 --strictPort
    ;;
  *)
    echo 'Usage: bash scripts/start-route-lab.sh api|web'
    echo 'Run api and web in separate terminals/processes. Temporary preview only.'
    exit 2
    ;;
esac
