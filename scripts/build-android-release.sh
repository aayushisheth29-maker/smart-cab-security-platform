#!/usr/bin/env bash
# ==============================================================================
# 🤖 SmartCab Android Production Release & Keystore Signing Tool
# ==============================================================================
set -e

echo "🚀 Preparing SmartCab Android Production Release Bundle..."

cd "$(dirname "$0")/../frontend"

# 1. Build the production web bundle
echo "📦 Building React Production Assets (Vite)..."
npm run build

# 2. Sync web assets with native Capacitor shell
echo "🔄 Syncing Capacitor Android Project..."
npx cap sync android

echo "✅ Android assets synced successfully to frontend/android/app/src/main/assets/public"
echo ""
echo "📱 NEXT STEPS TO GENERATE SIGNED .AAB BUNDLE FOR GOOGLE PLAY:"
echo "1. Open Android Studio: npx cap open android"
echo "2. Go to 'Build' -> 'Generate Signed Bundle / APK...'"
echo "3. Select 'Android App Bundle' (.aab)"
echo "4. Create or select your release keystore (smartcab-release.jks)"
echo "5. Select 'release' build variant and click 'Finish'"
echo "6. Upload app-release.aab to Google Play Console Production Track."
