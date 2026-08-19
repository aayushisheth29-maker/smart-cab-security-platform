// Single source of truth for the SmartCab backend URL.
//
// The Java (Spring Boot) backend that used to run at localhost:8080 is
// retired — the Python FastAPI service is now the ONE backend for the
// whole app (bookings, tracking, live video, auth, pricing, evidence).
//
// Resolution order:
//   1. VITE_API_URL            — explicit override (new Render service, etc.)
//   2. VITE_PREVIEW_API_PORT   — sandbox/preview environments, where the
//                                backend runs on another port of the SAME
//                                preview domain (e.g. "5173-xxx.e2b.app"
//                                -> "8081-xxx.e2b.app"). Set only in dev.
//   3. The production Python backend on Render.
function resolveApiBase() {
  const env = typeof import.meta !== "undefined" ? import.meta.env : null;
  if (env && env.VITE_API_URL) return env.VITE_API_URL;

  if (env && env.VITE_PREVIEW_API_PORT && typeof window !== "undefined") {
    const host = window.location.host;
    const match = host.match(/^\d+-(.+)$/); // "5173-<sandbox>.e2b.app"
    if (match) {
      return `${window.location.protocol}//${env.VITE_PREVIEW_API_PORT}-${match[1]}`;
    }
  }

  return "https://smart-cab-security-platform-1.onrender.com";
}

export const API_BASE = resolveApiBase();
