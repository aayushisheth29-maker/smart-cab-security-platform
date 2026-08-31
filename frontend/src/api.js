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

// ---------------------------------------------------------------------------
// 🔐 AUTH HELPERS — after login the backend returns { ...user, token }.
// We keep the token in localStorage (smartcab_token) and send it as
// `Authorization: Bearer <token>` on every protected API call.
// ---------------------------------------------------------------------------
/** Headers object for plain fetch() calls that need the bearer token. */
export function authHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getAuthToken() {
  try {
    const token = localStorage.getItem('smartcab_token');
    if (token) return token;
    const rawUser = localStorage.getItem('smartcab_user');
    if (rawUser) {
      const user = JSON.parse(rawUser);
      if (user && user.token) return user.token;
    }
  } catch (e) { /* storage unavailable */ }
  return null;
}

export function storeAuth(user) {
  if (!user) {
    localStorage.removeItem('smartcab_token');
    localStorage.removeItem('smartcab_user');
    return;
  }
  const token = user.token || null;
  const safeUser = { ...user };
  delete safeUser.token;
  if (token) localStorage.setItem('smartcab_token', token);
  localStorage.setItem('smartcab_user', JSON.stringify(safeUser));
}

export function getAdminKey() {
  try {
    return sessionStorage.getItem('smartcab_admin_key') || '';
  } catch (e) { return ''; }
}

export function storeAdminKey(key) {
  try {
    if (key) sessionStorage.setItem('smartcab_admin_key', key);
    else sessionStorage.removeItem('smartcab_admin_key');
  } catch (e) { /* noop */ }
}

/**
 * fetch() wrapper that attaches the auth token + admin key and parses JSON.
 * Returns the parsed response body; throws on !ok with the API detail.
 */
export async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = getAuthToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const adminKey = getAdminKey();
  if (adminKey) headers.set('X-Admin-Key', adminKey);
  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  let data = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }
  if (!res.ok) {
    const detail =
      (data && typeof data === 'object' && (data.detail || data.message)) ||
      (typeof data === 'string' && data) ||
      `Request failed (${res.status})`;
    const err = new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}
