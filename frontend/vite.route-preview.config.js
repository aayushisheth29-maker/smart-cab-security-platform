import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
export default defineConfig(({ command }) => {
  if (command === "build" && process.env.VITE_ROUTE_USB_PREVIEW === "true") {
    throw new Error("USB mode is for the development server, not a packaged/release web build.");
  }
  return {
  root: `${here}route-preview`,
  envDir: here,
  plugins: [react()],
  publicDir: false,
  server: {
    host: "0.0.0.0",
    allowedHosts: [".e2b.app", "localhost", "127.0.0.1"],
    proxy: {
      "/api/preview": {
        target:
          process.env.SMARTCAB_ROUTE_PREVIEW_TARGET || "http://127.0.0.1:8001",
        changeOrigin: true,
      },
    },
  },
  build: { outDir: `${here}build/route-preview`, emptyOutDir: true },
  };
});
