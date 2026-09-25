# Private Android USB test on your own laptop

This mode is for the separate synthetic Route Lab app, not the production rider/admin
sites and not a standalone release. It requires an unlocked, authorized Android phone
connected by USB to your own laptop. It does not enable wireless ADB, OEM unlocking,
camera capture, live GPS, notifications or SOS.

## Prerequisites

- The existing Route Lab `frontend` folder, Node.js 22.12+, and `npm ci` completed.
- Its Android project generated with Capacitor, SDK 36 installed, and Android Studio sync completed.
- The separate Python environment at `backend-python-ai/.venv` (or repository-root `.venv`).
- The synthetic model trained with `python -m route_lab.train --seed 42` in that environment.
- Exactly one authorized USB Android device; `adb devices` should show status `device`.

Do not copy device IDs, account passwords, API keys, or signing credentials into chat.

## Start

From the **frontend** folder, in normal Command Prompt (not the Node interactive prompt):

```text
node scripts/usb-preview.mjs
```

Wait for **USB PREVIEW READY**. The launcher checks the separate preview app ID,
Python environment, trained-model health, available local ports and the USB device.
It then:

1. Starts the synthetic API on laptop loopback `127.0.0.1:8001`.
2. Starts Vite on laptop loopback `127.0.0.1:5173`.
3. Proxies browser requests through Vite using relative `/api/preview/*` URLs.
4. Uses authenticated USB `adb -d reverse tcp:5173 tcp:5173` so the phone's frontend
   origin reaches the laptop. Browser code does not call another backend at localhost.
5. Writes managed overrides only under `android/app/src/debug/`. The debug WebView
   loads the Vite development frontend through the USB forwarding rule.

These servers deliberately use loopback on **your laptop**, not Arena's public preview.
Do not point them at production, share them over a LAN, or paste an Arena traffic token.
The ordinary Arena web-preview launcher remains bound to 0.0.0.0 for its authenticated proxy.

## Run the test app

Leave the launcher terminal open and the USB cable connected. In Android Studio select
`app` and your Vivo, then use Run for the **debug** build. The first actual APK build can
need additional downloads even though Gradle sync already succeeded.

The app uses real model inference on your laptop, but inputs and model training are
synthetic. This is not real ride monitoring and does not establish safety performance.

If a build/install error appears, inspect that error. Do not upgrade AGP/Gradle blindly,
turn off phone security controls, enable OEM unlocking, or enable wireless ADB to bypass it.

## Security and release boundary

- Android HTTP permission is debug-only and restricted by network security configuration
  to `localhost` and `127.0.0.1`. Non-loopback cleartext is denied.
- The generated debug config disables mixed content and backups for this test.
- No `src/main`, release manifest, Gradle version, or base Capacitor configuration is modified.
- The native same-origin API exception needs BOTH a Vite development server and the explicit
  USB-mode flag. It is limited to the loopback frontend on port 5173.
- A packaged web build fails if the USB flag is set; normal native builds retain the HTTPS
  staging-API requirement. No development access token is embedded in any client.
- Existing custom debug files and conflicting port forwards are not overwritten.

## Stop

Press Ctrl+C in the launcher terminal after testing. The launcher stops only its own
API/frontend processes, removes a forwarding rule it created, and removes its generated
debug files only if their contents were not subsequently edited. A pre-existing identical
forwarding rule is left alone. Turn USB debugging off when you finish testing.

An already installed USB debug APK still expects the laptop frontend. Stopping the
launcher does NOT turn it into a standalone or store-ready app. Such a build requires
separately approved hosting/configuration and device/release validation.
