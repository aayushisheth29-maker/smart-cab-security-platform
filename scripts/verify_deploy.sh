#!/usr/bin/env bash
# Smart Security AI Cab deploy verification — run from your PC (or any machine with internet):
#
#   bash scripts/verify_deploy.sh
#   bash scripts/verify_deploy.sh <backend-url> <admin-key>
#
# Checks: health -> login (token issued) -> debug endpoints OFF -> admin API.
set -euo pipefail

BACKEND="${1:-https://smart-cab-security-platform-1.onrender.com}"
ADMIN_KEY="${2:-smartcab-admin-dev-key}"

echo "🌐 Backend: $BACKEND"
echo ""

echo "── 1. Health ──────────────────────────────────────────────"
curl -sS --max-time 60 "$BACKEND/api/health"
echo ""

echo ""
echo "── 2. Login (upgraded auth: hashed password + token) ──────"
LOGIN=$(curl -sS --max-time 60 -X POST "$BACKEND/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"aayushi@example.com","password":"smartcab123"}')
echo "$LOGIN" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print('  name        :', d.get('name'))
print('  token issued:', bool(d.get('token')))
print('  saved addr  :', len(d.get('savedAddresses', [])))
print('  emergency   :', len(d.get('emergencyContacts', [])))
print('  ✅ login OK' if d.get('token') else '  ❌ no token!')
" 2>/dev/null || echo "  ❌ login failed — check the response above"

echo ""
echo "── 3. Debug endpoints (must be OFF = 404) ─────────────────"
CODE=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 60 \
  -X POST "$BACKEND/api/debug/create_test_link")
echo "  POST /api/debug/create_test_link -> $CODE $([ "$CODE" = "404" ] && echo '✅ secured' || echo '⚠️ still reachable!')"

echo ""
echo "── 4. Admin API ──────────────────────────────────────────"
NOSEC=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 60 "$BACKEND/api/admin/stats")
echo "  /api/admin/stats (no key) -> $NOSEC $([ "$NOSEC" = "401" ] && echo '✅ locked' || echo '⚠️ check')"
curl -sS --max-time 60 "$BACKEND/api/admin/stats" -H "X-Admin-Key: $ADMIN_KEY" | python3 -m json.tool 2>/dev/null \
  || echo "  ❌ admin stats failed with key: $ADMIN_KEY (does Render env have SMARTCAB_ADMIN_KEY set?)"

echo ""
echo "── 5. Route check (real geometric deviation check) ────────"
curl -sS --max-time 60 -X POST "$BACKEND/api/ai/route-safety/check" \
  -H 'Content-Type: application/json' \
  -d '{"pickupLat":23.0283,"pickupLng":72.5924,"dropoffLat":23.1033,"dropoffLng":72.5930,"currentLat":23.15,"currentLng":72.65,"rideCode":"SC-2026-000001"}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('  status:', d['status'], '|', d.get('distanceFromRouteMeters'), 'm off route')" 2>/dev/null \
  || echo "  ❌ route check failed"

echo ""
echo "🎉 Done. Open these in your browser:"
echo "   $BACKEND/api/health"
echo "   <frontend>/login  →  aayushi@example.com / smartcab123"
echo "   <frontend>/admin  →  unlock with your SMARTCAB_ADMIN_KEY"
