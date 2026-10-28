/** Opt-in development only. Browser API calls stay relative to the Vite origin. */
export function isUsbPreviewOrigin({ dev, flag, origin, configured = "" }) {
  if (!dev || flag !== "true") return false;
  const url = new URL(origin);
  if (url.protocol !== "http:" || !["localhost", "127.0.0.1"].includes(url.hostname)
      || url.port !== "5173" || url.username || url.password) {
    throw new Error("USB preview is restricted to the laptop's loopback frontend through adb reverse.");
  }
  if (configured) throw new Error("USB preview cannot use an external API URL. Stop and restart the USB launcher.");
  return true;
}
