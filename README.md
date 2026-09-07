# smart-cab-security-platform
  AI-powered taxi safety platform with GPS tracking, SOS alerts, route deviation detection, and emergency response features.

## ℹ️ Brand

**Product name: Smart Security AI Cab** — displayed consistently across the app
(navbar, login, rides, safety center, admin, browser tab & favicon), just like
Uber/Ola keep their brand everywhere. Internal technical names (API routes,
`SMARTCAB_*` env vars, `smartcab_*` localStorage keys) stay unchanged so
existing logins and deployments are never broken.

## 🚀 Product upgrade (v3)

The app now runs like a real product instead of a demo:

### 🔐 Security
- Passwords are **hashed with PBKDF2-HMAC-SHA256 (210k iterations)** — never stored in plain text.
- Login/signup return a **signed auth token** (`Authorization: Bearer <token>`); every user-scoped
  endpoint (`/api/users/*`, trips, contacts, profile) is **owner-checked (401/403)**.
- **Rate limiting** on auth + emergency endpoints, **CORS allowlist** via env, **debug endpoints disabled**
  unless `SMARTCAB_DEBUG=true`, and **no hard-coded secrets** (keys come from the environment).

### 🚕 Real ride experience
- Every ride gets a **Ride ID** like `SC-2026-000184` (persisted, never reused).
- Full **ride lifecycle**: `REQUESTED → DRIVER_ASSIGNED → DRIVER_ACCEPTED → DRIVER_ARRIVING →
  RIDE_STARTED → IN_PROGRESS → COMPLETED` (+ `CANCELLED`, `DANGER`) with validated transitions
  (`POST /api/trips/{id}/status`).
- **My Rides** page (`/rides`) — Active / Upcoming / Completed / Cancelled with driver cards,
  Ride IDs, fares and live tracking.

### 🛡️ Safety Center (`/safety`)
- **Emergency SOS workflow** with confirmation → alert state (Ride ID, driver, vehicle, location,
  notified contacts, quick-dial 112/181/108). Honest notice: it does **not** auto-call emergency services.
- **Share Live Ride** creates a 24-hour tracking link and prepares the SMS for trusted contacts.
- **Real route-deviation detection** (`POST /api/ai/route-safety/check`): GPS point vs. the
  pickup→dropoff line, returns the actual distance in meters — a rule-based geometric check,
  **not** fake random "AI" scores. Every check is explicitly labeled as not claiming danger.

### 🛠️ Admin / Safety dashboard (`/admin`)
- Stats (active rides, emergencies, drivers online, deviations), active emergency cards with
  **Respond**, and an active-rides table with ride-status controls. Locked behind `X-Admin-Key`.

## ⚙️ Environment variables (backend)

| Variable | Purpose | Default (dev) |
|---|---|---|
| `SMARTCAB_SECRET_KEY` | Signs auth tokens | `dev-only-secret-change-me` |
| `SMARTCAB_ADMIN_KEY` | Admin dashboard key | `smartcab-admin-dev-key` |
| `SMARTCAB_EVIDENCE_KEY` | Evidence upload key | legacy dev key |
| `SMARTCAB_CORS_ORIGINS` | Comma-separated allowed origins | `*` (dev) |
| `SMARTCAB_DEBUG` | Enables `/api/debug/*` | off |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` | Real SMS to emergency contacts | unset → preview only |
| `DATABASE_URL` | Postgres (Supabase) persistence | unset → in-memory + disk |

Set `SMARTCAB_SECRET_KEY`, `SMARTCAB_ADMIN_KEY` and `SMARTCAB_CORS_ORIGINS` in production.

**Demo login:** `aayushi@example.com` / `smartcab123` · **Admin key:** `smartcab-admin-dev-key`

## 🚀 Deploy: Render (backend) + Vercel (frontend)

### 1. Render — backend
1. Push this branch to GitHub.
2. Render Dashboard → **New → Blueprint** → select the repository.
3. Render reads the root [`render.yaml`](render.yaml) and creates the `smartcab-backend` service from `backend-python-ai/`.
4. Environment variables are auto-generated: `SMARTCAB_SECRET_KEY`, `SMARTCAB_ADMIN_KEY`, `SMARTCAB_EVIDENCE_KEY` (shown once — **copy the admin key**, it's the password for `/admin`).
5. After the first deploy, set **`SMARTCAB_CORS_ORIGINS`** to your real Vercel URL, e.g. `https://smart-cab-security-platform.vercel.app` (the blueprint defaults to `*` so the app works immediately; tighten it for production).
6. Optional: add `DATABASE_URL` (Supabase pooler) for Postgres persistence, or `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM_NUMBER` to send real SMS.

> Render free tier sleeps after inactivity — the keep-alive workflow (`.github/workflows/keep-alive.yml`) pings `/api/health` every 10 minutes. Update `RENDER_HEALTH_URL` (repo secret) or the URL inside it after deploy.

### 2. Vercel — frontend
1. Vercel → **Add New Project** → import the repo → **Root Directory: `frontend`** (or configure a monorepo setting).
2. Framework preset: **Vite** (auto-detected via `frontend/vercel.json`).
3. Add environment variable (Settings → Environment Variables):
   - `VITE_API_URL` = `https://<your-render-service>.onrender.com`
4. Deploy. The SPA rewrites in `vercel.json` already handle `/rides`, `/safety`, `/admin`, `/track/:id`.

### 3. Connect the two
- Backend is reachable from the frontend via `VITE_API_URL`; without it, `frontend/src/api.js` falls back to the previous backend URL.
- The frontend sends `Authorization: Bearer <token>` automatically (see `src/api.js`), so the browser never stores credentials in cookies.

### Sanity checks after deploy
- `GET https://<backend>/api/health` → `{"status": "ok", ...}`
- `POST /api/auth/login` with the demo account → returns a `token`
- `GET /api/admin/stats` with `X-Admin-Key: <copied key>` → stats JSON
- Open `<frontend>/admin` and unlock with the same key

## Documentation

- [Project Idea](docs/Project_Idea.md)
- [Requirements](docs/Requirements.md)
- [System Architecture](docs/System_Architecture.md)
- [Team Roles](docs/Team_Roles.md)
- [Project Roadmap](docs/Project_Roadmap.md)
- [Project Timeline](docs/Project_Timeline.md)
- [Technology Stack](docs/Technology_Stack.md)

## Week 2 - UML Diagrams

### Use Case Diagram
See: [Use Case Diagram](docs/Use_Case_Diagram.md)

### Class Diagram
See: [Class Diagram](docs/Class_Diagram.md)

### Sequence Diagram
See: [Sequence Diagram](docs/Sequence_Diagram.md)

### State Diagram

See: [State Diagram](docs/State_Diagram.md)

### Activity Diagram

See: [Activity Diagram](docs/Activity_Diagram.md)


## Week 3 - Database Design

### ER Diagram
See: [ER Diagram](docs/ER_Diagram.md)

### Database Schema
See: [Database Schema](docs/Database_Schema.md)

### Data Dictionary
See: [Data Dictionary](docs/Data_Dictionary.md)

### Database SQL
See: [Database.sql](docs/Database.sql)

### System_Architecture_Diagram
See:  [System_Architecture_Diagram](docs/System_Architecture_Diagram.md)


## Week 4 - Backend Development

### API Design
- [API Design](docs/API_Design.md)

### Module Design
- [Module Design](docs/Module_Design.md)

### Backend Architecture
- [Backend Architecture](docs/Backend_Architecture.md)

### Business Logic
- [Business Logic](docs/Business_Logic.md)

## Login Page
See: [Login Page](docs/Login_Page.md)  

## Driver Registration Page
See: [Driver Registration](docs/Driver_Registration.md)

## Ride Booking Page
See: [Ride Booking](docs/Ride_Booking.md)

## Live Tracking Page
See: [Live Tracking](docs/Live_Tracking.md)

## SOS Emergency Page
See: [SOS Emergency](docs/SOS_Emergency.md)


## Week 5 - Frontend Development

### User Interface Design
- [User Interface Design](docs/UI_Design.md)

### Home Page Design
- [Home Page Design](docs/Home_Page.md)

### Authentication Pages
- [Authentication Pages](docs/Authentication_Pages.md)

### Dashboard Design
- [Dashboard Design](docs/Dashboard_Design.md)

### Frontend Integration
- [Frontend Integration](docs/Frontend_Backend_Integration.md)

### API Integration
- [API Integration](docs/API_Integration.md)

### Responsive Design
- [Responsive Design](docs/Responsive_Design.md)

## Project Modules

### Frontend
See: [Frontend Source Code](frontend/)

### Backend (Python — FastAPI) ✅ ACTIVE
The Python FastAPI service in [`backend-python-ai/`](backend-python-ai/) is the **single backend for the whole app**:
bookings (`/api/bookings` + `/api/trips`), SOS, live GPS tracking (`/api/location/*`),
live cabin video streaming (`/api/video/stream/*`), auth, pricing, evidence and emergency logging.

- Share links and live video chunks are persisted to disk, so they survive service restarts (Render free-tier sleeps).
- The frontend points at this backend via one config file: [`frontend/src/api.js`](frontend/src/api.js).

### 🤖 AI Safety Agent (LangChain + Gemini) ✅ ACTIVE
The rider app's Help chat is a **real LangChain ReAct agent** (`POST /api/agent`): a Gemini LLM
runs a ReAct loop (LangGraph) and decides which of 5 tools to call — `get_ride_status`,
`share_live_location`, `trigger_sos`, `report_driver`, `get_safety_tips`. It may only report
what those tools return (no invented ride data). If the rider says "I'm scared, call for
help", the agent fires a real SOS itself (ride → DANGER, emergency logged, contacts attached).

- Set `GEMINI_API_KEY` in the Render environment (free tier: [aistudio.google.com](https://aistudio.google.com/apikey)) to activate the LLM.
- Without the key, or if a call fails, the endpoint **automatically falls back** to the scripted
  multilingual assistant (`/api/assistant` logic) — the app never breaks. The chat shows a
  🤖 AI Agent badge on replies that came from the LLM.
- Known greetings and informational FAQs (including the informational quick questions in all six
  chat languages, but not the report action) take a **local fast path**, returning
  `engine: "scripted"` without initializing/calling Gemini.
  Only whole-message matches are eligible: ride-specific questions, SOS/share/report actions,
  mixed safety requests and unknown questions still go to the tool agent. Failure replies retain
  `engine: "fallback"`; successful LLM replies retain `engine: "ai"` and the AI badge.
- **Latency defaults (Issue #9):** Gemini 3 uses `thinking_level="low"` and `temperature=1.0`
  (the current SDK uses fixed sampling defaults for 3.6). Gemini 2.5 Flash uses `thinking_budget=0`.
  Other models keep compatible defaults. This does **not** change `GEMINI_MODEL` or any deployed
  Render/API-key settings. Install the updated requirements (`langchain-google-genai>=4.4.0,<5.0`):
  older SDKs can accept `thinking_level` but silently omit it for models absent from their registry.
- `SMARTCAB_GEMINI_TIMEOUT_SECONDS` defaults to **20s per model request**, with no SDK retries
  (`max_retries=1` means one attempt in SDK 4.x; `0` uses its default retries).
  `SMARTCAB_AGENT_TIMEOUT_SECONDS` defaults to **60s for initialization + the whole ReAct loop**,
  giving multi-tool work more room than the old 30s wait. Both accept positive finite seconds;
  invalid values use defaults and the model timeout is capped at the overall deadline.
- The endpoint uses native async execution: the overall timeout cancels the graph/model request
  instead of abandoning a still-running executor job. At most four agent requests run at once;
  overload falls back immediately rather than queueing. An already-started synchronous tool
  cannot be rolled back by cancellation. Overall deadlines/overload return `agent_timeout`/`agent_busy`
  in `fallbackReason`; SDK/network errors retain `agent_error` and the scripted fallback too.
- Timing logs correlate each response and LLM step using `request_id`: route/engine, total and
  per-step `elapsed_ms`, exception type, and output/reasoning token counts when the SDK provides
  them. Prompts, reply content, reasoning text, signatures and API keys are not logged by this
  telemetry. After deployment, compare these timings and timeout rates on the same ride/SOS/share
  prompts; live Gemini latency/quality still needs verification with the owner's configured key.
- Agent tools, routing, cancellation, SDK configuration, reply formatting and fallback are covered
  by the tests in [`backend-python-ai/tests/`](backend-python-ai/tests/). Run locally (no API key):
  `cd backend-python-ai && python -m pytest tests/ -q` after installing requirements and dev requirements.

### Backend (Java — Spring Boot) ⚠️ RETIRED
See: [Java Backend](backend-java-core/)

The Java backend is **retired** — the app no longer calls it. Its endpoint contract
(`POST /api/bookings`, `GET /api/bookings`, `PUT /api/bookings/{id}/sos`) is fully
re-implemented in the Python backend so nothing depends on it. The folder is kept
only for reference and can be deleted safely.

### Database
See: [Database Files](database/)




## Week 6 - GPS Tracking Integration

### Live Tracking
- [Live Tracking](docs/Live_Tracking.md)

### Live Tracking Test Guide
- [Live Tracking Test Guide](TEST_LIVE_TRACKING.md)


## Week 7 - Testing and Bug Fixing

### Test Cases
- [Test Cases](docs/Test_Cases.md)

### Bug Fixing
- [Bug Fixing](docs/Bug_Fixing.md)



