#!/usr/bin/env bash
# ==============================================================================
# 🤖 Smart Security AI Cab - Android Production Release & Packaging Tool
# ==============================================================================
set -e

echo "🚀 Starting Smart Security AI Cab Android Production Build..."

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"

cd "$FRONTEND_DIR"

# 1. Build the production web bundle (Vite)
echo "📦 1/3: Compiling React 19 + Vite Production Web Bundle..."
npm run build

# 2. Sync web assets with native Capacitor Android shell
echo "🔄 2/3: Syncing web bundle with Android Native Capacitor Container..."
npx cap sync android

echo "✅ 3/3: Native Android assets updated successfully at frontend/android/app/src/main/assets/public"
echo ""
echo "========================================================================"
echo "📱 ANDROID PRODUCTION BUILD INSTRUCTIONS FOR GOOGLE PLAY STORE"
echo "========================================================================"
echo ""
echo "1. Build Android App Bundle (.aab) for Google Play Console:"
echo "   cd frontend/android && ./gradlew bundleRelease"
echo ""
echo "2. Build Direct APK (.apk) for Phone Testing:"
echo "   cd frontend/android && ./gradlew assembleRelease"
echo ""
echo "3. Open Android Studio Project:"
echo "   cd frontend && npx cap open android"
echo ""
echo "📄 Refer to docs/GOOGLE_PLAY_STORE_RELEASE_GUIDE.md for complete Play Store listing details."
echo "========================================================================"
