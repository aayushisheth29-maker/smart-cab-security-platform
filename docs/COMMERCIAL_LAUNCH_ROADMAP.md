# 🚀 SmartCab RouteGuard™ - Official Commercial Launch, Hosting & Copyright Guide

This blueprint provides the complete end-to-end steps to launch **SmartCab** as an official, registered, production-grade commercial platform with real-world machine learning intelligence.

---

## 🏛️ Phase 1: Government Registration, Copyright & Trademark (India)

### 1. Software Copyright Registration (Copyright Office of India)
Software programs are protected as **Literary Works (Computer Software)** under Section 2(o) of the Indian Copyright Act, 1957.
- **Official Portal:** [https://copyright.gov.in](https://copyright.gov.in)
- **Form:** Form XIV (Application for Registration of Copyright)
- **Filing Fee:** ₹500 (individual/startup) per application.
- **Documents Required:**
  1. **Source Code & Object Code Deposit:** First 10 and last 10 pages of clean source code (without proprietary secrets/API keys).
  2. **Statement of Particulars (SoP)** & **Statement of Further Particulars (SoFP)**.
  3. **No Objection Certificate (NOC)** from the author/creator to the company.
  4. **Software Design Document (SDD):** Architecture diagram of the Isolation Forest anomaly detector, React UI, and FastAPI backend.

### 2. Trademark Registration (IP India - Controller General of Patents, Designs & Trademarks)
Protect your brand name, logo, and slogan ("SmartCab", "RouteGuard AI").
- **Official Portal:** [https://ipindiaonline.gov.in](https://ipindiaonline.gov.in)
- **Applicable Trademark Classes:**
  - **Class 9 (Software & Telematics):** Mobile application software for taxi booking, GPS navigation, and passenger safety monitoring.
  - **Class 39 (Transportation & Logistics):** Taxi transport, passenger cab booking, and vehicle escort services.
  - **Class 42 (Software as a Service):** Cloud computing platforms for fleet route anomaly detection.
- **Filing Fee:** ₹4,500 (Individual / DPIIT-recognized Startup) or ₹9,000 (Others).

### 3. Data Protection & Regulatory Compliance (DPDP Act 2023 & Motor Vehicle Act)
- **Digital Personal Data Protection (DPDP) Act 2023:**
  - Prominent Notice & Explicit Consent before initiating GPS background tracking.
  - Right to Erasure: Option for passengers to purge historical ride breadcrumbs after trip completion.
  - Dedicated Data Protection Officer (DPO) contact email in the Privacy Policy.
- **Motor Vehicle Aggregator Guidelines:**
  - Mandatory in-app Emergency Button (112 integration readiness).
  - Driver background verification check and KYC documentation.

---

## 🌐 Phase 2: Domain Purchase, Cloud Hosting & Production Setup

### 1. Buy Your Official Domain Name
- Recommended providers: **Namecheap**, **GoDaddy**, or **Cloudflare Registrar**.
- Suggested domain names:
  - `smartcab.in` (India primary)
  - `smartcabsecurity.com`
  - `smartcab.ai`

### 2. Frontend Hosting (Vercel / Cloudflare Pages)
The SmartCab web platform and RouteGuard dashboard are already optimized for **Vercel** with automatic SPA routing.
1. In your Vercel Dashboard, go to **Project Settings → Domains**.
2. Add your custom domain (e.g. `smartcab.in` or `app.smartcab.in`).
3. Set your DNS records in your domain registrar:
   - `CNAME` for `app` pointing to `cname.vercel-dns.com`
   - `A` record for `@` pointing to `76.76.21.21`
4. Automatic free SSL certificates (Let's Encrypt) are issued immediately.

### 3. AI Backend Hosting (Render / AWS ECS / DigitalOcean)
The FastAPI AI backend and scikit-learn ML engine can run on:
- **Render Web Service (Standard Tier):**
  - Continuous deployment connected to your GitHub repository.
  - Custom domain connection: `api.smartcab.in`.
  - Environment variables: `GEMINI_API_KEY`, `MONGODB_URI`, `TWILIO_ACCOUNT_SID`, `JWT_SECRET`.
- **AWS Elastic Container Service (ECS) or EC2:**
  - Docker container running `uvicorn main:app --workers 4 --host 0.0.0.0 --port 8000`.

### 4. Database Setup (MongoDB Atlas / PostgreSQL)
- **MongoDB Atlas Dedicated Cluster:**
  - Free 512 MB sandbox or M10 production cluster located in **AWS Mumbai (ap-south-1)** for sub-10ms database latency across India.
  - Collections: `users`, `drivers`, `rides`, `telemetry_logs`, `safety_incidents`.

---

## 📱 Phase 3: Android (Google Play) & iOS (Apple App Store) Launch

### 1. Android Release Build
Capacitor has already created the native Android shell in `frontend/android/`.
1. Open terminal on your laptop:
   ```bash
   cd frontend
   npm run mobile:prepare
   ```
2. In Android Studio:
   - Go to **Build → Generate Signed Bundle / APK**.
   - Select **Android App Bundle (.aab)**.
   - Create a new production keystore (`smartcab-release.jks`) and store the password safely.
   - Build the release bundle.
3. **Google Play Console ($25 one-time fee):**
   - Create a new App: "SmartCab - Safe Rides & AI Security".
   - Fill in Data Safety declarations (Location: Approximate & Precise, used for Navigation & Safety).
   - Upload your `.aab` file to Closed Testing / Production Track.

### 2. iOS Release Build (Apple App Store)
1. Open the project in Xcode on a Mac:
   ```bash
   cd frontend
   npx cap open ios
   ```
2. Set your **Bundle Identifier** (`com.smartcab.app`) and Apple Developer Team.
3. Configure Background Modes: `Location updates`.
4. Archive and upload to **App Store Connect ($99/year fee)**.

---

## 🌲 Phase 4: Scaling the Real Machine Learning Pipeline

1. **Continuous Fleet Learning:**
   - As drivers complete trips, breadcrumb coordinates are anonymously batched into the database.
   - The weekly retraining cron job executes `python -m route_lab.train_real` to update the Isolation Forest model on newly paved roads and real urban traffic patterns.
2. **Hybrid Anomaly System:**
   - **Level 1 (Deterministic Fast Rule):** Immediate deviation check (>300m for >30s).
   - **Level 2 (Scikit-Learn Isolation Forest):** Multi-dimensional pattern detection (speed vs. route offset vs. stop duration).
   - **Level 3 (AI Chatbot Context Check):** Friendly, unalarming passenger check-in.

---

*SmartCab RouteGuard™ — Engineered for safety, privacy, and scalable fleet intelligence.*
