# SmartCab Route Lab — mobile preview & ML training guide

**Status: test preview only. No production deployment or store release.**

You chose Android + iPhone, route warnings first, and synthetic data because no permitted training dataset is available yet. This adds a working learning environment without connecting to live rides or modifying the existing app's SOS behavior.

## What is built

| Component | Current implementation |
| --- | --- |
| Mobile UI | A separate React entry point using the existing frontend toolchain; route monitor, scenario replay, model lab, training/mobile guide, and simulated check-ins. |
| Phone projects | Capacitor Android and iOS project shells under `frontend/android/` and `frontend/ios/`. They are not signed or compiled native releases. |
| Route rules | Distance to a **planned polyline**, sustained-deviation detection, and stop-duration checks. These are explainable rules, not ML. |
| Data-quality gate | Rejects missing/invalid/inaccurate locations, stale or out-of-order timestamps, gaps, and insufficient history. An unknown assessment never means “safe.” |
| ML experiment | An actual Isolation Forest pipeline trained on **invented feature windows**, with trip-grouped splits, calibration, held-out evaluation, and a downloadable model card. |
| Independent API | `route_lab.api:app`. It does not import `main.py`, read production stores, use Gemini, or connect to a database. |
| Allowed API input | Only a synthetic scenario ID and sample index. Live coordinates and additional fields are rejected. |
| Not implemented | Continuous background GPS, camera/drowsiness analysis, real notifications, automatic police dispatch, door/window control, App Store or Google Play publishing. |

The original confidential snippet has **not** been copied into public GitHub. No new feature changes have been pushed, merged, or deployed to the live site by this work. Any later sharing/release needs your approval.

## Try the running preview

Open the **SmartCab mobile preview** live-preview tab in Arena. This is a temporary development preview, not permanent hosting.

1. Start with **Typical ride**. Scrub the timeline or press Play.
2. Select **A route detour**. The rule explains how long the synthetic samples stayed beyond the distance threshold.
3. Select **An extended stop**. The message acknowledges traffic or planned stops as possible explanations.
4. Select **Weak GPS signal**. Assessment pauses, and ML does not score an unusable sample.
5. Try a **demo check-in**. Acknowledgements stay in page memory. No messages are sent.
6. Open **Model lab** for the synthetic training report, or **Build & learn** for in-app instructions.

The route canvas is an **offline illustration**, not navigation. No map provider receives coordinates. The preview does not request camera, microphone, or location permissions.

## Resume a paused Arena preview

The preview is temporary: its processes and cached dependencies can expire when the workspace pauses. The saved source code is unaffected. The preview process entries now use resumable launchers:

```bash
# From the repository root, in two separate processes/terminals:
bash scripts/start-route-lab.sh api
bash scripts/start-route-lab.sh web
```

These launchers restore missing preview dependencies and regenerate a missing default synthetic model before starting the services. Custom model directories are not overwritten. They never start the production backend, merge/push code, or change Render settings.

In Arena, open the **SmartCab mobile preview** globe entry (port 5173), not the Route Lab API entry. The raw sandbox URL may require Arena's authenticated viewer; do not share access tokens or disable its access protection.

## Run it again locally

### Prerequisites

- Python **3.11+** (the existing backend uses 3.11).
- Node.js **22+** and npm for Vite/Capacitor 8.
- No Gemini key, database password, or cloud training account is needed.

From the repository root, macOS/Linux:

```bash
python -m venv .venv
.venv/bin/python -m pip install -r backend-python-ai/requirements-route-preview.txt
cd frontend
npm ci
cd ..
```

Windows PowerShell: use `py -3.11 -m venv .venv`, then `.venv\Scripts\python.exe` instead of `.venv/bin/python`. The `npm` commands are the same.

Train the demonstration model:

```bash
cd backend-python-ai
../.venv/bin/python -m route_lab.train --seed 42
```

Then start the **separate preview API**, from `backend-python-ai/`:

```bash
../.venv/bin/python -m uvicorn route_lab.api:app --host 0.0.0.0 --port 8001
```

In another terminal, from `frontend/`:

```bash
npm run dev:route-preview -- --host 0.0.0.0 --port 5173
```

Open the frontend on port 5173. Browser API requests use `/api/preview/*`; Vite proxies them to port 8001. `SMARTCAB_ROUTE_PREVIEW_TARGET` can change the **server-side** proxy target. Browser code does not use localhost to contact a different service.

Normal `npm run dev` / `npm run build` still use the existing rider/owner app. The Route Lab uses `vite.route-preview.config.js` and writes to ignored `frontend/build/route-preview/` instead of the production `dist/`.

If no model artifact exists, rule-based warnings still work and the ML panel honestly says it is unavailable. Restart the preview API after retraining; the model loads once at startup.

## How the ML training works

### 1. Decide what the model is allowed to predict

Here the task is **“is this movement-feature window unusual relative to the training examples?”** It is **not** “is this driver dangerous?” or “is the passenger safe?”

Isolation Forest is an unsupervised outlier detector. It is not automatically the best model for every route problem, and it does not output calibrated danger probabilities.

### 2. Build useful features

The model uses four numeric values, in this exact order:

| Feature | Unit | Meaning |
| --- | --- | --- |
| `route_offset_m` | metres | Nearest distance to a segment of the planned polyline. |
| `speed_kph` | km/h | Current usable speed observation. |
| `stationary_seconds` | seconds | Continuous low-speed time within a small area. |
| `offset_change_m` | metres | Change in offset over the recent sample window. |

Raw latitude/longitude, faces, identifiers, demographics, and invented neighborhood safety indexes are **not** model features. Signal-quality failures stop scoring rather than being treated as anomalies.

### 3. Generate demonstration data

`route_lab/train.py` creates **240 imaginary trips**, each with 24 correlated feature windows. Some contain injected detours or long stops. These are invented distributions, not millions of real safe trips.

The demonstration event labels indicate injected unusual movement. They do **not** label actual danger. Good results on this simple synthetic dataset are expected to be much easier than real-world performance.

### 4. Split complete trips before training

- 144 trips for training.
- 48 different trips for calibration.
- 48 different trips for a held-out test.

Every window from one trip stays in one split. Randomly splitting individual GPS rows would let neighboring observations leak between training and test data, producing misleadingly good metrics.

The model trains only on nominal training windows. A `RobustScaler` is fit inside the training pipeline, followed by `IsolationForest`. Neither sees calibration/test data during fitting.

### 5. Choose the threshold on calibration data

The script uses nominal calibration windows to choose a cutoff at their lower 2% decision-score quantile. This is a **demonstration operating point**, not a validated safety threshold and not a probability of danger.

Test data is not used to tune the threshold. The UI displays the raw decision score separately from the rule-based warning; it does not manufacture a combined “risk out of 100.”

### 6. Evaluate once on the held-out test

The report includes:

- True positives: injected unusual windows flagged.
- False positives: nominal windows flagged.
- False negatives: injected unusual windows missed.
- True negatives: nominal windows not flagged.
- Precision, recall, and false-alarm rate for this **synthetic test only**.

Never present these figures as real ride-safety accuracy. For example, a high synthetic recall cannot prove that a model would recognize a real emergency.

### 7. Save and version the artifact

Training writes:

```text
backend-python-ai/.cache/route-model/
  model.joblib    # scaler + forest + threshold + ordered feature schema
  report.json     # seed, versions, splits, metrics, limitations
```

The files are ignored and reproducible. The preview refuses artifacts whose dependency version, feature schema, or synthetic-only marker is incompatible. Retrain instead of blindly loading old artifacts.

**Security:** joblib/pickle files can execute code when loaded. Never load a model sent by an untrusted person. There is no model-upload endpoint; the artifact directory is server-controlled. Do not commit real trip datasets or model files to public GitHub.

To choose another local output folder:

```bash
python -m route_lab.train --output-dir /YOUR/PRIVATE/MODEL/FOLDER --seed 42
```

Set `SMARTCAB_ROUTE_MODEL_DIR` to that trusted folder for the preview API. Use a private folder, not a shared upload directory.

## Moving beyond synthetic data — a separate future phase

Do not substitute real rider records into this demonstration and call it production-ready. A real-data pipeline needs a separately reviewed collection and evaluation plan:

1. **Consent and purpose:** obtain appropriate driver/rider permission, specify what is collected, and support retention/deletion policies. Decide whether the feature can work with less data or on-device processing.
2. **Capture context:** planned route, permitted route changes, timestamped observations, GPS accuracy, trip state, traffic/road closures where available, and human-reviewed event annotations.
3. **Label observations honestly:** “authorized diversion,” “unexplained deviation,” “traffic stop,” “GPS failure,” and “unreviewed.” Do not label neighborhoods or drivers as dangerous from an outlier score.
4. **Validate broadly:** separate drivers, trips, route areas, and later time periods. Include poor connectivity, tunnels, varying phones, ordinary long stops, and changing road conditions.
5. **Measure useful outcomes:** false alerts per trip/hour, missed reviewed events, detection delay, data-quality coverage, and subgroup/environment differences. Evaluate thresholds against operating capacity and harm from false alarms.
6. **Shadow mode first:** observe and review without acting on riders or drivers. Keep manual SOS available independently; do not gate emergency access on an ML score.
7. **Release review:** qualified safety/privacy review, monitoring, incident handling, rollback, and explicit owner approval before a limited opt-in pilot.

Real camera monitoring is a later project. Eye detection failures are not proof of fatigue, and head direction is not proof of phone use. Video consent, on-device inference, realistic validation, and separate compute capacity are prerequisites. Do not put continuous video analysis in the chat/booking request path.

## Android and iPhone device builds

The generated **native project shells** package the Route Lab preview, not the complete production booking app. The separate bundle ID is `com.smartcab.routelab.preview`. This keeps experimentation distinct from a future production app identity.

### First: provide a staging backend

A packaged app cannot use Vite's browser proxy. It needs an HTTPS URL for a separately hosted `route_lab.api:app` service.

For any **future, separately approved** staging deployment:

- Install `backend-python-ai/requirements-route-preview.txt`.
- Train the synthetic artifact during the staging build, or place your trusted demo artifact in its private storage.
- Start `uvicorn route_lab.api:app --host 0.0.0.0 --port $PORT` from `backend-python-ai/`.
- Health check: `/api/preview/health`.
- Do not supply production database/API keys. No Gemini configuration is required.
- Do not replace the live `main:app` service or change the existing Render blueprint.

No such permanent cloud service has been created here. The Arena preview is temporary. Never put Gemini/API secrets in `VITE_*` variables; they are public build-time values.

From `frontend/`, macOS/Linux:

```bash
VITE_ROUTE_PREVIEW_API_URL=https://YOUR-STAGING-API npm run mobile:prepare
```

Windows PowerShell:

```powershell
$env:VITE_ROUTE_PREVIEW_API_URL="https://YOUR-STAGING-API"
npm run mobile:prepare
```

For an `onrender.com` staging domain, additionally set `SMARTCAB_CONFIRM_STAGING=1` **only after confirming it is not production**. The script requires an HTTPS origin without credentials/path and checks that its health response explicitly says synthetic-only, no live GPS, and no automatic actions. If that check fails, it refuses the native preparation.

`mobile:prepare` builds the web assets and runs `cap sync`. Native project generation alone does not configure a reachable backend, sign binaries, or publish anything.

### Android

1. Install Android Studio and its supported JDK. The generated Capacitor 8 project targets Android SDK 36, with minimum SDK 24. Use the toolchain required by its Gradle/Android plugin versions.
2. Run `npm run mobile:android` to open `frontend/android/`.
3. Wait for Gradle sync, select an emulator or test phone, and press Run.
4. Verify layout, resume/offline behavior, API connectivity, and accessibility on devices.
5. Play Store distribution later needs a signing/upload key, developer account, policies, and review. Do not paste signing keys or account credentials into chat.

### iPhone

1. Use macOS with a compatible Xcode/iOS SDK. This Linux workspace cannot compile/sign an iOS app.
2. Run `npm run mobile:ios` to open `frontend/ios/App/` in Xcode.
3. Resolve Swift Package Manager dependencies, select your signing team, and run on a simulator/test device.
4. Test safe-area insets, offline/reconnection behavior, navigation, and accessibility on iPhone.
5. TestFlight/App Store distribution later needs appropriate Apple membership/signing and review. No App Store publishing has occurred.

No native permission prompts are expected in this version: it uses synthetic scenarios only. Adding real foreground/background GPS is future work with separate consent, permission, battery, and OS-lifecycle testing.

## Verification commands

Rule/API tests (from `backend-python-ai/`):

```bash
../.venv/bin/python -m pytest tests/test_route_lab.py -q
```

Full backend regression suite additionally needs the original backend requirements and dev requirements installed.

Browser tests (with the preview API/frontend already running, from `frontend/`):

```bash
npx playwright install chromium
npm run test:route-preview
```

If your CI provides its own compatible Chromium, set `CHROMIUM_EXECUTABLE_PATH`; optional `CHROMIUM_ARGS` is a JSON array of launch arguments. These tests cover desktop and mobile **browser layouts**, not a compiled Android/iOS app.

Build checks:

```bash
npm run build:route-preview
npm run build
npm audit
```

## What to do next

Explore the four scenarios and the in-app model lab. Then decide whether you want to arrange a **separate staging service and an Android test build first**, or refine the warning behavior. Real data collection, live deployment, and any public GitHub/store release remain separate approval steps.
