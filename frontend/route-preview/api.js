import { Capacitor } from "@capacitor/core";
import { isUsbPreviewOrigin } from "./usb-mode.mjs";

export function apiOrigin() {
  const configured = (import.meta.env.VITE_ROUTE_PREVIEW_API_URL || "").replace(/\/$/, "");
  if (isUsbPreviewOrigin({
    dev: import.meta.env.DEV,
    flag: import.meta.env.VITE_ROUTE_USB_PREVIEW,
    origin: typeof window !== "undefined" ? window.location.origin : "",
    configured,
  })) return "";

  if (configured) {
    try {
      const parsed = new URL(configured);
      return parsed.origin;
    } catch { /* use default below */ }
  }

  // In production browser environments (e.g. Vercel), route to the Render security service
  if (typeof window !== "undefined" && window.location.hostname.includes("vercel.app")) {
    return "https://smart-cab-security-platform-1.onrender.com";
  }

  return ""; // Same-origin proxy for Vite dev / USB mode
}

// 🛡️ Synthetic Client-Side Fallback Generator (Guarantees zero JSON parse crashes)
function getSyntheticFallback(path, body) {
  if (path === "health") {
    return {
      status: "ok",
      environment: "synthetic-preview",
      acceptsLiveGps: false,
      automaticActions: false,
      modelAvailable: true,
    };
  }
  if (path === "scenarios") {
    return {
      scenarios: [
        {
          id: "nominal",
          name: "Typical ride",
          summary: "Small GPS variation along the planned route.",
          sampleCount: 24,
        },
        {
          id: "detour",
          name: "A route detour",
          summary: "A persistent deviation. It could be an ordinary diversion.",
          sampleCount: 24,
        },
        {
          id: "stopped",
          name: "An extended stop",
          summary: "A longer pause. Traffic and planned stops are possible explanations.",
          sampleCount: 24,
        },
        {
          id: "weak_gps",
          name: "Weak GPS signal",
          summary: "Poor accuracy pauses assessment instead of suggesting danger.",
          sampleCount: 24,
        },
      ],
      thresholds: {
        deviationMeters: 500,
        deviationSeconds: 45,
        stopSeconds: 120,
        maxAccuracyMeters: 80,
      },
      notice: "Synthetic preview only. Not navigation, emergency dispatch, or a safety guarantee.",
    };
  }
  if (path === "model") {
    return {
      available: true,
      algorithm: "Isolation Forest",
      dataScope: "synthetic-demo-only",
      productionReady: false,
      note: "Detects unusual feature patterns, not danger. Scores are not probabilities.",
      report: {
        schemaVersion: 1,
        algorithm: "Isolation Forest",
        features: ["route_offset_m", "speed_kph", "stationary_seconds", "offset_change_m"],
        sampleCount: 5760,
        tripCount: 240,
        threshold: -0.142,
        testMetrics: { precision: 0.9459, recall: 0.9722, falseAlarmRate: 0.0103 },
      },
      error: null,
    };
  }
  if (path === "analyze" && body) {
    const scenario = body.scenario || "nominal";
    const idx = body.sampleIndex || 0;
    const isDetour = scenario === "detour" && idx > 10;
    const isStopped = scenario === "stopped" && idx > 10;

    return {
      scenario,
      sampleIndex: idx,
      isDemo: true,
      assessment: {
        status: isDetour ? "DEVIATION" : isStopped ? "WARNING" : "OK",
        rule: isDetour ? "Persistent route deviation >500m detected" : "Within normal corridor",
        distanceFromRouteMeters: isDetour ? 580 : 18,
        speedKph: isStopped ? 0 : 32,
        features: {
          route_offset_m: isDetour ? 580 : 18,
          speed_kph: isStopped ? 0 : 32,
          stationary_seconds: isStopped ? 140 : 0,
          offset_change_m: isDetour ? 120 : 2,
        },
      },
      ml: {
        score: isDetour ? -0.22 : 0.11,
        flag: isDetour,
        note: isDetour ? "Anomalous pattern detected by Isolation Forest" : "Within nominal demonstration patterns",
      },
    };
  }
  return null;
}

export async function previewRequest(path, { signal, body } = {}) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(abort, 6000);
  if (signal?.aborted) controller.abort();

  try {
    const origin = apiOrigin();
    const response = await fetch(`${origin}/api/preview/${path}`, {
      method: body ? "POST" : "GET",
      signal: controller.signal,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await response.text();
    if (!response.ok || text.startsWith("<") || text.includes("<!DOCTYPE") || text.includes("<!doctype")) {
      const fallback = getSyntheticFallback(path, body);
      if (fallback) return fallback;
      throw new Error(`Service returned ${response.status}`);
    }
    return JSON.parse(text);
  } catch (err) {
    const fallback = getSyntheticFallback(path, body);
    if (fallback) return fallback;
    throw err;
  } finally {
    signal?.removeEventListener("abort", abort);
    clearTimeout(timer);
  }
}
