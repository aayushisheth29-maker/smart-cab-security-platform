/** Build only the Route Lab app. Never default a native build to production APIs. */
import { spawnSync } from "node:child_process";
import { packageCommand } from "./mobile-command.mjs";

const raw = process.env.VITE_ROUTE_PREVIEW_API_URL;
let endpoint;
try {
  endpoint = new URL(raw);
} catch {
  /* handled below */
}
if (
  !endpoint ||
  endpoint.protocol !== "https:" ||
  endpoint.username ||
  endpoint.password ||
  endpoint.search ||
  endpoint.hash ||
  !["", "/"].includes(endpoint.pathname) ||
  ["localhost", "127.0.0.1", "::1", "[::1]"].includes(endpoint.hostname) ||
  (endpoint.hostname.endsWith(".onrender.com") &&
    !process.env.SMARTCAB_CONFIRM_STAGING)
) {
  console.error(
    "Set VITE_ROUTE_PREVIEW_API_URL to your HTTPS staging API origin (no credentials or path).",
  );
  console.error(
    "For an onrender.com staging origin, also set SMARTCAB_CONFIRM_STAGING=1 after verifying it is NOT production.",
  );
  process.exit(1);
}
// Checking this marker prevents accidentally connecting the preview to main.py.
try {
  const response = await fetch(`${endpoint.origin}/api/preview/health`, {
    signal: AbortSignal.timeout(10000),
  });
  const data = await response.json();
  if (
    !response.ok ||
    data.environment !== "synthetic-preview" ||
    data.acceptsLiveGps !== false ||
    data.automaticActions !== false
  ) {
    throw new Error("The backend is not a synthetic-only Route Lab service.");
  }
} catch (error) {
  console.error(`Staging verification failed: ${error.message}`);
  process.exit(1);
}
for (const [command, args] of [
  ["npm", ["run", "build:route-preview"]],
  ["npx", ["cap", "sync"]],
]) {
  const invocation = packageCommand(command, args);
  const result = spawnSync(invocation.command, invocation.args, {
    stdio: "inherit",
    env: process.env,
  });
  if (result.error) {
    console.error(`Could not start ${command}: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log(
  "Web assets and native projects prepared. This is NOT a signed Android/iOS release.",
);
