# Smart Security AI Cab — PPT Content (mapped to the 10-slide template)

> Copy the text under each slide heading into the matching template slide.
> Items in [BRACKETS] need the team's real details filled in.
>
> ✅ **Updated after the LangChain AI agent was built in** — every AI claim
> below is real, deployed, and demoable. The template's "Tech: LangChain AI
> Agents" line is now TRUE.

---

## Slide 1 — Title

**Smart Security AI Cab**
*Trusted Intelligent Transport*

Students: Aayushi Sheth, [Name 2] | Batch: [Graduation Year]
Duration: 2 Months | Tech: LangChain AI Agents (ReAct + Gemini), FastAPI, React

---

## Slide 2 — Mission Statement

Smart Security AI Cab is an AI-powered taxi safety platform that protects the rider from booking to drop-off. At its core is a **LangChain ReAct AI agent** the rider talks to during the ride — it fetches real ride data, shares live location with family, and fires SOS on its own when the rider is in danger. Around it: live GPS tracking, cabin video, route-deviation detection, and a key-protected owner portal for driver vetting.

**Core Focus:**
- An AI agent that can **act**, not just talk — it calls real tools (ride status, share location, SOS, report driver)
- Give family a private live-tracker link (name, driver, route, timer, cabin video)
- Make every ride traceable, verifiable, and safe

---

## Slide 3 — Identifying the Friction (The Challenge)

**Pain points identified:**
- Riders (especially solo travellers & women) fear unverified drivers; existing safety features (SOS button, manual driver checks) are **passive**
- Family has **no real-time view** of where the ride actually is — only the app holder knows
- In a panic, riders can't navigate menus — they just shout for help, and nothing acts
- Driver onboarding relies on manual document checks — no systematic, evidence-based screening
- After an incident, there is **no verifiable proof** (no tracked route, no video, no log)

**Why an AI agent, not a standard script:**
A scripted menu can't understand "driver is speeding, I'm scared" and then *decide* what to do. Our ReAct agent interprets free-text in any of 7+ languages, reasons about the situation, and autonomously chains real tool calls — fetch ride status → create family share link → fire SOS with driver, route and last-known location. A standard script would need a separate hard-coded branch for every possible sentence; the agent generalizes.

---

## Slide 4 — Technology Stack (Framework)

| Layer | Technology |
|---|---|
| **AI / Agent Layer** | **LangChain + LangGraph ReAct agent** on Google **Gemini** (free tier). 5 real tools: `get_ride_status`, `share_live_location`, `trigger_sos`, `report_driver`, `get_safety_tips`. Tool-grounded: the agent may only report data the tools return — it never hallucinates ride data. Graceful fallback to a scripted multilingual assistant when offline. |
| **Data Layer** | JSON disk-persistence store (users, trips, emergencies, support requests, admin credentials — survives server restarts), live GPS location store, cabin-video chunk store |
| **Backend** | Python 3 + FastAPI, PBKDF2 password hashing, JWT-style session tokens, per-route rate limiting, geocoding + 62-airport offline coordinate DB |
| **Frontend** | React 18 + Vite, Leaflet maps with 3 tile-provider fallback, WebRTC camera streaming, share-sheet integration, in-chat "AI Agent" badge |
| **Hosting** | Render (API, keep-alive workflow) + 2 Vercel projects (public rider app + private Owner Portal) |

---

## Slide 5 — Timeline (Gantt chart rows)

| Week | Work Package |
|---|---|
| 1 | Project ideation, requirements, team setup |
| 2 | UML diagrams — use case, class, sequence, state, activity |
| 3 | Database design — ER diagram, schema, data dictionary, SQL |
| 4 | Backend development — API design, auth, bookings, SOS, live-tracking APIs |
| 5 | Frontend development — UI, auth pages, dashboard, API integration, responsive design |
| 6 | GPS live-tracking integration + end-to-end live-tracking test guide |
| 7 | Testing & bug fixing, LangChain AI safety agent, Owner Portal, deployment (Render + Vercel), final submission |

*(Build the Gantt chart with these 7 rows across the 2-month span.)*

---

## Slide 6 — Technical Workflow (System Architecture)

**The agentic loop:** *"Our agent uses a ReAct pattern (LangGraph) on Gemini. Given the rider's message plus context (their active ride, driver, language), it decides step-by-step which tool to call — `get_ride_status`, `share_live_location`, `trigger_sos`, `report_driver` or `get_safety_tips` — reads each tool's real result, and only then answers. If the rider is in danger it calls `trigger_sos` immediately."*

- **Step 1 — Book:** Rider enters pickup/dropoff (or searches any of 62 DGCA airports by name/IATA) → geocoding + real distance-based fare → driver auto-assigned.
- **Step 2 — Ask the agent:** In-app Help chat → `POST /api/agent` → ReAct loop runs tool calls against the live backend (real trips, real share links, real SOS log).
- **Step 3 — Track & Protect:** GPS pings every few seconds → family opens the private share link: rider name, driver, live map, timer, cabin video. Safety engine analyses each ping for deviation/GPS loss → 60s countdown → **auto-SOS** with driver, route, last-known location; the AI agent can also fire the same SOS from conversation.
- **Step 4 — Verify:** Drivers apply through a 2-step application with document vault → **automated photo screening** (PASS/REVIEW/FAIL) → owner approves/rejects from the key-protected Owner Portal; agent-filed driver reports appear there too.

---

## Slide 7 — Unique (Novel Approach / X-Factor)

- **An agent that acts, not just chats** — "I'm scared" → the agent *itself* calls `trigger_sos`: ride marked DANGER, emergency logged with driver/route/location, contacts attached — no button, no menu, no panic navigation
- **Tool-grounded, hallucination-proof** — the agent may only report what its tools return; ride data, links and SOS results are always real
- **Fail-safe by design** — no API key / LLM down → automatic fallback to the scripted multilingual assistant; the safety product never goes dark
- **Active, not passive, safety** — deviation/GPS-loss triggers a 60s countdown that auto-fires SOS; honest "sent/failed" display
- **Zero-trust Owner Portal** — rotatable hashed admin key, lockout recovery, invisible in the rider app; agent-filed reports and emergencies land there
- **Restart-proof live data** — cloud cold-starts never erase an active ride

---

## Slide 8 — Demo Video

[Insert the recorded demo video (Google Drive link from the submission form)]

**Suggested agent demo moment (if re-recording):** book a ride, then in the Help chat type:
1. `Where is my driver?` → agent calls `get_ride_status`, answers with real driver/plate/route
2. `Share my location with my family` → agent creates and sends the real tracker link
3. `I'm scared, call for help` → agent calls `trigger_sos` — then show the ride marked DANGER in the Safety Center / Owner Portal

---

## Slide 9 — Roadmap & Future Scope

**Phase 1 (immediate):** Security hardening — rotate admin key, disable key-reset flag, full end-to-end test matrix, external UAT with real phones.

**Phase 2 (next 3–6 months):**
- Multi-turn agent memory (remember the conversation across the ride) + voice input ("I'm not safe" by voice)
- ML route-anomaly detection (per-rider baselines) instead of threshold logic
- Real emergency-services integration (auto-call/notify 112 with live location)
- Agent tool expansion: ride reschedule, fare dispute, lost-item recovery via driver contact

**Phase 3 (long term):**
- Multi-city rollout + driver marketplace with live demand pricing
- UPI payments, insurance tie-ups, and evidence packs for claims
- Wearable panic-button integration & traffic-aware rerouting

---

## Slide 10 — Conclusion

Smart Security AI Cab demonstrates that a **LangChain ReAct agent can be a safety product, not just a chatbot**: given five real tools, it answers from live data, shares the ride with family in one sentence, and fires a real SOS when the rider can't press a button — all fail-safe, all deployed in production on Render + Vercel with an automated API test suite covering the agent's tools and fallback.

**Thank you for your attention. Questions & feedback are welcome.**

---

## Deployment links (for the Q&A slide / verbally)

- Rider app (with the AI agent in Help chat): https://smart-cab-security-platform.vercel.app
- Owner Portal (key-protected): https://smart-cab-owner-portal.vercel.app
- Backend health: https://smart-cab-security-platform-1.onrender.com/api/health
