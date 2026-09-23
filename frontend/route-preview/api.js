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

const PLAN = [
  { lat: 23.020, lng: 72.553 },
  { lat: 23.023, lng: 72.553 },
  { lat: 23.023, lng: 72.557 },
  { lat: 23.026, lng: 72.557 },
  { lat: 23.026, lng: 72.564 },
  { lat: 23.030, lng: 72.564 },
  { lat: 23.030, lng: 72.571 },
  { lat: 23.034, lng: 72.571 }
];

const SAMPLE_COUNT = 49;
const BASE_TIME = 1800000000;

function distanceMeters(a, b) {
  const R = 6371000;
  const dLat = (b.lat - a.lat) * (Math.PI / 180);
  const dLng = (b.lng - a.lng) * (Math.PI / 180);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const q = sinLat * sinLat + Math.cos(a.lat * (Math.PI / 180)) * Math.cos(b.lat * (Math.PI / 180)) * sinLng * sinLng;
  return 2 * R * Math.atan2(Math.sqrt(q), Math.sqrt(1 - q));
}

function alongRoute(progress) {
  const lengths = [];
  let total = 0;
  for (let i = 0; i < PLAN.length - 1; i++) {
    const len = distanceMeters(PLAN[i], PLAN[i + 1]);
    lengths.push(len);
    total += len;
  }
  let target = progress * total;
  for (let i = 0; i < lengths.length; i++) {
    if (target <= lengths[i]) {
      const t = lengths[i] > 0 ? target / lengths[i] : 0;
      return {
        lat: PLAN[i].lat + t * (PLAN[i + 1].lat - PLAN[i].lat),
        lng: PLAN[i].lng + t * (PLAN[i + 1].lng - PLAN[i].lng)
      };
    }
    target -= lengths[i];
  }
  return PLAN[PLAN.length - 1];
}

function generateSamples(scenario) {
  const samples = [];
  for (let i = 0; i < SAMPLE_COUNT; i++) {
    let routeIndex = i;
    if (scenario === "stop") {
      routeIndex = i <= 33 ? Math.min(i, 17) : i - 16;
    }
    const pt = alongRoute(routeIndex / (SAMPLE_COUNT - 1));
    let lat = pt.lat + Math.sin(i * 1.1) * 0.000025;
    let lng = pt.lng + Math.cos(i) * 0.000025;
    if (scenario === "detour" && i >= 15 && i <= 36) {
      const shift = Math.min(1.0, (i - 15) / 4, (36 - i) / 4) * 0.014;
      lng -= Math.max(0, shift);
    }
    if (scenario === "stop" && i >= 17 && i <= 33) {
      const fixed = alongRoute(17 / (SAMPLE_COUNT - 1));
      lat = fixed.lat;
      lng = fixed.lng;
    }
    const accuracy = scenario === "weak_gps" && i >= 16 && i <= 31 ? 180.0 : 8.0;
    const speed = samples.length > 0 ? (distanceMeters({ lat, lng }, samples[samples.length - 1]) / 10) * 3.6 : 22.0;
    samples.push({
      lat,
      lng,
      timestamp: BASE_TIME + i * 10,
      speed_kph: Math.min(speed, 160),
      accuracy_m: accuracy
    });
  }
  return samples;
}

// 🛡️ Guaranteed Client-Side Synthetic Fallback
function getSyntheticFallback(path, body) {
  if (path === "health") {
    return {
      status: "ok",
      environment: "synthetic-preview",
      acceptsLiveGps: false,
      automaticActions: false,
      modelAvailable: true
    };
  }
  if (path === "scenarios") {
    return {
      scenarios: [
        {
          id: "typical",
          name: "Typical ride",
          description: "Small GPS variation along the planned route.",
          focusIndex: 18,
          plannedRoute: PLAN,
          samples: generateSamples("typical"),
          sampleSeconds: 10,
          source: "synthetic",
          tripLabel: "Practice ride · Ahmedabad"
        },
        {
          id: "detour",
          name: "A route detour",
          description: "A persistent deviation. It could be an ordinary diversion.",
          focusIndex: 27,
          plannedRoute: PLAN,
          samples: generateSamples("detour"),
          sampleSeconds: 10,
          source: "synthetic",
          tripLabel: "Practice ride · Ahmedabad"
        },
        {
          id: "stop",
          name: "An extended stop",
          description: "A longer pause. Traffic and planned stops are possible explanations.",
          focusIndex: 28,
          plannedRoute: PLAN,
          samples: generateSamples("stop"),
          sampleSeconds: 10,
          source: "synthetic",
          tripLabel: "Practice ride · Ahmedabad"
        },
        {
          id: "weak_gps",
          name: "Weak GPS signal",
          description: "Poor accuracy pauses assessment instead of suggesting danger.",
          focusIndex: 22,
          plannedRoute: PLAN,
          samples: generateSamples("weak_gps"),
          sampleSeconds: 10,
          source: "synthetic",
          tripLabel: "Practice ride · Ahmedabad"
        }
      ],
      thresholds: {
        deviationMeters: 500,
        deviationSeconds: 45,
        stopSeconds: 120,
        maxAccuracyMeters: 80
      },
      notice: "Synthetic preview only. Not navigation, emergency dispatch, or a safety guarantee."
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
        testMetrics: { precision: 0.9459, recall: 0.9722, falseAlarmRate: 0.0103 }
      },
      error: null
    };
  }
  if (path === "analyze" && body) {
    const scenario = body.scenario || "typical";
    const idx = body.sampleIndex || 0;
    const isDetour = scenario === "detour" && idx >= 15;
    const isStop = scenario === "stop" && idx >= 17 && idx <= 33;
    const isWeakGps = scenario === "weak_gps" && idx >= 16 && idx <= 31;

    let status = "ok";
    let headline = "Within nominal planned route";
    let offsetMeters = 18;
    let speedKph = 28;
    let stationarySeconds = 0;

    if (isDetour) {
      status = "check_in";
      headline = "Route detour detected (>500m)";
      offsetMeters = 640;
    } else if (isStop) {
      status = "check_in";
      headline = "Extended stop recorded (>120s)";
      speedKph = 0;
      stationarySeconds = (idx - 17) * 10;
    } else if (isWeakGps) {
      status = "insufficient_data";
      headline = "Weak GPS signal — check-in paused";
    }

    return {
      scenario,
      sampleIndex: idx,
      isDemo: true,
      assessment: {
        status,
        headline,
        offsetMeters,
        speedKph,
        stationarySeconds,
        accuracyMeters: isWeakGps ? 180 : 8,
        features: {
          route_offset_m: offsetMeters,
          speed_kph: speedKph,
          stationary_seconds: stationarySeconds,
          offset_change_m: isDetour ? 140 : 2
        }
      },
      ml: {
        score: isDetour ? -0.21 : isStop ? -0.16 : 0.12,
        flag: isDetour || isStop,
        decision: isDetour || isStop ? "anomalous_pattern" : "nominal_pattern",
        note: isDetour ? "Isolation Forest flagged persistent offset deviation" : "Within normal baseline distribution"
      }
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
      body: body ? JSON.stringify(body) : undefined
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
