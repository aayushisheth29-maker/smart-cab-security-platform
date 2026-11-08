#!/usr/bin/env python3
"""Package reviewed Route Lab sources for an owner handoff, never the live app or secrets.

Usage: python3 scripts/package-route-lab.py --output /home/user/SmartCab-Route-Lab-Test.zip
Uses only stdlib + git. Does not install packages, call APIs, or push/merge anything.
"""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import subprocess
from urllib.parse import urlsplit
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parents[1]
ARCHIVE_ROOT = "SmartCab-Route-Lab-Test"
EXPORT_PATHS = (
    ".gitignore", "frontend/.gitignore", "frontend/package.json", "frontend/package-lock.json",
    "frontend/capacitor.config.json", "frontend/vite.route-preview.config.js",
    "frontend/playwright.route-preview.config.js", "frontend/route-preview", "frontend/android", "frontend/ios",
    "frontend/scripts/prepare-mobile.mjs", "frontend/scripts/mobile-command.mjs",
    "frontend/scripts/mobile-command.test.mjs", "frontend/scripts/usb-preview.mjs",
    "frontend/scripts/usb-preview-utils.mjs", "frontend/scripts/usb-preview.test.mjs",
    "frontend/scripts/usb-preview-lifecycle.test.mjs", "backend-python-ai/route_lab",
    "backend-python-ai/requirements-route-preview.txt", "backend-python-ai/tests/test_route_lab.py",
    "docs/ROUTE_LAB_MOBILE_GUIDE.md", "docs/ROUTE_LAB_USB_TEST.md", "scripts/start-route-lab.sh",
)
EXCLUDED_PARTS = {".git", ".cache", "node_modules", ".venv", "__pycache__", ".gradle", "build", "dist", "Pods", "DerivedData", "xcuserdata"}
EXCLUDED_NAMES = {".npmrc", ".netrc", "local.properties", "credentials.json", "google-services.json", "GoogleService-Info.plist"}
EXCLUDED_SUFFIXES = {".joblib", ".pkl", ".pickle", ".pyc", ".jks", ".keystore", ".p12", ".p8", ".pem", ".mobileprovision", ".apk", ".aab"}

START_HERE = """# SmartCab Route Lab — start here on Windows

This is the source project for your separate mobile test preview, NOT an APK.
It is not the production rider/owner website. The iPhone project is included for
future macOS/Xcode work; start with Android on your Windows laptop.

## Do these steps now

1. Right-click the ZIP and choose Extract All. Use a NEW folder, not an old SmartCab
   checkout. Depending on the extraction destination, you may see two nested folders
   with similar names; open the one containing this START_HERE file and `frontend`.
2. Open the extracted `frontend` folder in File Explorer. You should see
   `package.json`, `package-lock.json`, `android`, and `route-preview`.
3. Click File Explorer's address bar, type `cmd`, and press Enter. This opens a
   Command Prompt in the correct folder. Administrator mode is not needed.
4. Run:

   npm ci

5. Let npm finish. STOP HERE and report whether it succeeded. Do not create a new
   Android Studio project or try to run the app yet.

Node.js 22.12+ is required. Node v24.18.0 and npm 11.16.0 meet the version requirements.
Android Studio should have Android SDK Platform 36 (Android 16.0/API 36.0).
Existing SDK 37 can stay installed.

## Why we are not pressing Run yet

The native projects need generated web assets and Capacitor synchronization.
The online ML demo also needs a reachable, separately approved HTTPS test backend.
None is configured in this ZIP. The protected temporary Arena URL is NOT a
standalone phone backend; never copy traffic-access tokens into the project.
Do not put a production URL or Gemini key into this demo to make an error disappear.

Once a staging backend is approved, the existing `mobile:prepare` command checks
its synthetic-only health marker, builds the web assets, and runs Capacitor sync.
Then `npm run mobile:android` can open the ready project in Android Studio.
The private source handoff itself does NOT configure hosting, produce a signed
APK, install anything on your phone, publish to stores, or merge a pull request.

## About this ZIP

- Route Lab UI, Android/iPhone project shells, and the synthetic Python API/trainer.
- No .git history, API keys, local .env files, signing keys, actual ride data,
  node_modules, trained binary models, or cached build outputs.
- No production rider/admin app entry points. For this standalone handoff,
  `npm run dev`, `build`, and `preview` use the dedicated Route Lab configuration.
- Dependencies and the package lock retain the source project's version constraints.
- HANDOFF_MANIFEST.json records the included file hashes and scope.

You do not need Python for the `npm ci` step. The optional Python code is included
for later authorized test-backend setup/training; it is not a production deployment.
The current ML demonstration uses invented examples and cannot validate ride safety.
See docs/ROUTE_LAB_MOBILE_GUIDE.md for the complete explanation and later steps.
"""


def allowed(relative):
    path = PurePosixPath(relative)
    return (not path.is_absolute() and ".." not in path.parts
            and not EXCLUDED_PARTS.intersection(path.parts)
            and path.name not in EXCLUDED_NAMES
            and not path.name.startswith(".env")
            and path.suffix.lower() not in EXCLUDED_SUFFIXES)


def export(output):
    names = subprocess.check_output(
        ["git", "ls-files", "-z", "--cached", "--others", "--exclude-standard", "--", *EXPORT_PATHS],
        cwd=ROOT,
    ).decode().split("\0")
    files = {}
    for relative in sorted(set(filter(None, names))):
        if not allowed(relative):
            continue
        source = ROOT / relative
        if source.is_symlink() or not source.resolve().is_relative_to(ROOT):
            raise ValueError(f"Refusing an external or linked file: {relative}")
        if source.is_file():
            files[relative] = source.read_bytes()
    required = {"frontend/package.json", "frontend/package-lock.json", "frontend/route-preview/App.jsx",
                "frontend/android/settings.gradle", "frontend/android/gradlew.bat",
                "frontend/scripts/mobile-command.mjs", "backend-python-ai/route_lab/api.py"}
    if not required.issubset(files):
        raise ValueError(f"Handoff is incomplete: {required - files.keys()}")
    # The original rider/owner entry points are intentionally not exported.
    # Safe aliases make all default commands point only at the Route Lab.
    package = json.loads(files["frontend/package.json"])
    package["scripts"]["dev"] = "vite --config vite.route-preview.config.js"
    package["scripts"]["build"] = "vite build --config vite.route-preview.config.js"
    package["scripts"]["preview"] = "vite preview --config vite.route-preview.config.js"
    files["frontend/package.json"] = (json.dumps(package, indent=2) + "\n").encode()
    lock = json.loads(files["frontend/package-lock.json"])
    for dependency in lock.get("packages", {}).values():
        url = urlsplit(dependency.get("resolved", ""))
        if url.username or url.password:
            raise ValueError("A dependency URL contains credentials; refusing export.")
    files["START_HERE_WINDOWS.md"] = START_HERE.encode()
    manifest = {
        "scope": "synthetic-route-lab-source-only", "isApk": False,
        "stagingBackendConfigured": False, "nodeMinimum": "22.12.0", "androidSdkPlatform": 36,
        "standaloneAliases": ["npm run dev", "npm run build", "npm run preview"],
        "files": {name: hashlib.sha256(data).hexdigest() for name, data in sorted(files.items())},
    }
    files["HANDOFF_MANIFEST.json"] = (json.dumps(manifest, indent=2) + "\n").encode()
    output = Path(output).resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(output, "w", compression=ZIP_DEFLATED, compresslevel=9) as archive:
        for name, data in sorted(files.items()):
            info = ZipInfo(f"{ARCHIVE_ROOT}/{name}")
            info.create_system = 3
            source = ROOT / name
            mode = source.stat().st_mode if source.is_file() else 0o100644
            info.external_attr = (mode & 0xFFFF) << 16
            info.compress_type = ZIP_DEFLATED
            archive.writestr(info, data)
    with ZipFile(output) as archive:
        if archive.testzip() is not None:
            raise ValueError("ZIP integrity check failed")
    print(f"Created {output}: {len(files)} files, {output.stat().st_size / 1024:.0f} KiB")
    return output


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=ROOT.parent / f"{ARCHIVE_ROOT}.zip")
    export(parser.parse_args().output)
