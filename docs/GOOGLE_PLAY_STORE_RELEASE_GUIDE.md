# 📱 Google Play Store Release & Android APK Packaging Guide
**Smart Security AI Cab Platform — Production Android App**

---

## 🚀 Overview

The Smart Security AI Cab Android application is packaged using **Capacitor 8** native runtime wrapping our high-performance **Vite + React 19** production build.

- **Package Identifier:** `com.smartsecuritycab.app`
- **Application Name:** `Smart Security AI Cab`
- **Minimum Android SDK:** 24 (Android 7.0 Nougat+)
- **Target Android SDK:** 34 (Android 14)

---

## 🛠️ Step 1: Automatic Asset Build & Native Sync

To build the latest React web assets and bundle them into the Android native package:

```bash
# From the project root:
./scripts/build-android-release.sh
```

Or manually:
```bash
cd frontend
npm run build
npx cap sync android
```

---

## 🔐 Step 2: Generate Release Keystore (One-Time Setup)

To publish on Google Play Store, generate a cryptographic signing key:

```bash
keytool -genkey -v -keystore smartcab-release.jks -alias smartcab -keyalg RSA -keysize 2048 -validity 10000
```
> 💡 *Keep `smartcab-release.jks` and your keystore passwords secure in your password manager.*

---

## 📦 Step 3: Build Production Android App Bundle (.aab) & APK

### Option A: Build Android App Bundle (.aab) for Google Play Console:
```bash
cd frontend/android
./gradlew bundleRelease
```
**Output File:**  
`frontend/android/app/build/outputs/bundle/release/app-release.aab`

---

### Option B: Build Direct Installable APK (.apk) for Testing on Android Phones:
```bash
cd frontend/android
./gradlew assembleRelease
```
**Output File:**  
`frontend/android/app/build/outputs/apk/release/app-release-unsigned.apk`

---

### Option C: Sign APK with `apksigner` for Direct Phone Installation:
```bash
zipalign -v -p 4 app-release-unsigned.apk smartcab-signed.apk
apksigner sign --ks smartcab-release.jks --out smartcab-production.apk smartcab-signed.apk
```

---

## 📋 Google Play Console Store Listing Metadata

| Field | Production Value |
| :--- | :--- |
| **App Name** | `Smart Security AI Cab` |
| **Short Description (80 chars max)** | `AI-Powered Cab Security, GPS Tracking, Vernacular Voice SOS & Verified Rides.` |
| **App Category** | `Maps & Navigation` / `Travel & Local` |
| **Target Audience** | `Ages 18 and over` / `Everyone` |
| **Privacy Policy URL** | `https://smart-cab-security-platform.vercel.app/` |
| **Contact Email** | `support@smartcabsecurity.in` |

### 📝 Full Description (Play Store):
```text
Smart Security AI Cab is India's most secure and technologically advanced ride-hailing and fleet safety platform.

🛡️ KEY SAFETY & CONVENIENCE FEATURES:

• 🤖 Isolation Forest AI Security: Continuous telemetry scans your cab's route in real time to detect unusual stops or unapproved route deviations before they become emergencies.
• 🎙️ 10-Language Indian Voice Guard: Hands-free voice commands in Gujarati (ગુજરાતી), Hindi (हिन्दी), Marathi (मराठी), Bengali (বাংলা), Tamil (தமிழ்), Telugu (తెలుగు), Kannada (ಕನ್ನಡ), Malayalam (മലയാളം), Punjabi (ਪੰਜਾਬੀ), and English.
• 🚨 Instant Family SOS & Police 112 Dispatch: 1-tap emergency broadcasts sent directly to your family via WhatsApp and SMS with a live GPS tracking link.
• 💳 Instant UPI, QR & Cash Payments: Pay effortlessly with Google Pay, PhonePe, Paytm, BHIM, or Cards.
• 🎁 Exclusive Ride Offers & First Ride Free: Save on daily commutes with special promo codes and discounts.
• 🚗 100% Verified Drivers: Rigorous KYC screening including Sarathi driving licence verification, vehicle fitness checks, and police clearance certificates.
• 🔒 DPDP Act Compliant: Your private personal data and location are encrypted and never sold or shared without consent.

Travel safely anywhere in India with Smart Security AI Cab.
```

---

## 🛡️ Android Native Permissions & Justifications

| Permission | Purpose |
| :--- | :--- |
| `ACCESS_FINE_LOCATION` & `ACCESS_COARSE_LOCATION` | Required to calculate pickup, dropoff, and real-time ride routing. |
| `ACCESS_BACKGROUND_LOCATION` | Required for active route safety monitoring while passenger's phone screen is locked. |
| `FOREGROUND_SERVICE_LOCATION` | Keeps live ride tracking and family telemetry active during trip progression. |
| `RECORD_AUDIO` | Powers the hands-free 10-language voice safety command assistant. |
| `CAMERA` | Enables driver onboarding document scanning (Driving Licence & Vehicle RC). |
| `VIBRATE` | Provides tactile emergency feedback during SOS alerts. |
