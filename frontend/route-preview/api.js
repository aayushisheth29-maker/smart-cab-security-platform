import { Capacitor } from "@capacitor/core";
import { isUsbPreviewOrigin } from "./usb-mode.mjs";

export function apiOrigin() {
  const configured = (import.meta.env.VITE_ROUTE_PREVIEW_API_URL || "").replace(
    /\/$/,
    "",
  );
  if (isUsbPreviewOrigin({
    dev: import.meta.env.DEV,
    flag: import.meta.env.VITE_ROUTE_USB_PREVIEW,
    origin: typeof window !== "undefined" ? window.location.origin : "",
    configured,
  })) return "";
  if (configured) {
    const parsed = new URL(configured);
    if (
      parsed.protocol !== "https:" ||
      parsed.username ||
      parsed.password ||
      parsed.search ||
      parsed.hash ||
      !["", "/"].includes(parsed.pathname)
    )
      throw new Error("A valid HTTPS staging API origin is required.");
    return parsed.origin;
  }
  if (Capacitor.isNativePlatform()) {
    throw new Error(
      "This native preview needs a staging API. Set VITE_ROUTE_PREVIEW_API_URL and rebuild with npm run mobile:prepare.",
    );
  }
  return ""; // Browser-facing requests stay same-origin; Vite proxies to the preview API.
}

export async function previewRequest(path, { signal, body } = {}) {
  // Use a timer rather than AbortSignal.timeout/any for older mobile webviews.
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(abort, 8000);
  if (signal?.aborted) controller.abort();
  try {
    const response = await fetch(`${apiOrigin()}/api/preview/${path}`, {
      method: body ? "POST" : "GET",
      signal: controller.signal,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok)
      throw new Error(
        `Preview service returned ${response.status}. No assessment is available.`,
      );
    return await response.json();
  } finally {
    signal?.removeEventListener("abort", abort);
    clearTimeout(timer);
  }
}
