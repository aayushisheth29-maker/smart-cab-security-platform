import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./route-preview/tests",
  outputDir: "./build/playwright-results",
  timeout: 30000,
  fullyParallel: true,
  use: {
    launchOptions: {
      executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || undefined,
      args: process.env.CHROMIUM_ARGS
        ? JSON.parse(process.env.CHROMIUM_ARGS)
        : undefined,
    },
    baseURL: process.env.ROUTE_LAB_PREVIEW_URL || "http://127.0.0.1:5173",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop-chromium",
      use: { browserName: "chromium", viewport: { width: 1440, height: 1000 } },
    },
    {
      name: "mobile-layout-chromium",
      use: {
        browserName: "chromium",
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});
