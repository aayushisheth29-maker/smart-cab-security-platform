import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { isUsbPreviewOrigin } from "../route-preview/usb-mode.mjs";
import { debugFiles, writeDebugFiles, requireSyntheticHealth, reverseState, childEnvironment, USB_MARKER } from "./usb-preview-utils.mjs";

for (const host of ["localhost", "127.0.0.1"]) {
  test(`USB browser calls stay same-origin on ${host}`, () => {
    assert.equal(isUsbPreviewOrigin({ dev: true, flag: "true", origin: `http://${host}:5173` }), true);
  });
}
test("USB mode cannot enable a native shortcut in a production build", () => {
  assert.equal(isUsbPreviewOrigin({ dev: false, flag: "true", origin: "http://localhost:5173" }), false);
  assert.equal(isUsbPreviewOrigin({ dev: true, flag: "false", origin: "http://localhost:5173" }), false);
});
test("USB mode rejects non-loopback or external API configurations", () => {
  for (const origin of ["https://public.invalid", "http://192.168.1.2:5173", "http://localhost:8001", "https://localhost:5173"]) {
    assert.throws(() => isUsbPreviewOrigin({ dev: true, flag: "true", origin }));
  }
  assert.throws(() => isUsbPreviewOrigin({ dev: true, flag: "true", origin: "http://localhost:5173", configured: "https://production.invalid" }));
});
test("generated configuration is debug-only and does not mutate the source config", () => {
  const base = { appId: "com.smartcab.routelab.preview", server: { androidScheme: "https" } };
  const original = JSON.stringify(base);
  const files = debugFiles(base);
  assert.equal(JSON.stringify(base), original);
  assert.ok(Object.keys(files).every(p => p.startsWith("android/app/src/debug/")));
  const config = JSON.parse(files["android/app/src/debug/assets/capacitor.config.json"]);
  assert.equal(config.server.url, "http://localhost:5173");
  assert.equal(config.android.allowMixedContent, false);
  const xml = files["android/app/src/debug/res/xml/smartcab_usb_network_security.xml"];
  assert.match(xml, /base-config cleartextTrafficPermitted="false"/);
  assert.match(xml, /includeSubdomains="false">localhost/);
  assert.match(xml, /includeSubdomains="false">127\.0\.0\.1/);
  assert.throws(() => debugFiles({ appId: "com.example.production" }));
});
test("custom debug files are not overwritten and cleanup preserves user edits", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "smartcab-usb-test-"));
  try {
    const files = debugFiles({ appId: "com.smartcab.routelab.preview" });
    const manifest = path.join(root, "android/app/src/debug/AndroidManifest.xml");
    fs.mkdirSync(path.dirname(manifest), { recursive: true });
    fs.writeFileSync(manifest, "custom developer file");
    assert.throws(() => writeDebugFiles(root, files));
    assert.equal(fs.readFileSync(manifest, "utf8"), "custom developer file");
    fs.unlinkSync(manifest);
    const cleanup = writeDebugFiles(root, files);
    assert.ok(fs.readFileSync(manifest, "utf8").includes(USB_MARKER));
    fs.appendFileSync(manifest, "\n<!-- user edit -->\n");
    cleanup();
    assert.ok(fs.existsSync(manifest));
    assert.equal(fs.existsSync(path.join(root, "android/app/src/debug/assets/capacitor.config.json")), false);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
test("synthetic health gates fail closed", () => {
  const good = { environment: "synthetic-preview", acceptsLiveGps: false, automaticActions: false, modelAvailable: true };
  requireSyntheticHealth(good);
  for (const change of [{ environment: "production" }, { acceptsLiveGps: true }, { automaticActions: true }, { modelAvailable: false }]) {
    assert.throws(() => requireSyntheticHealth({ ...good, ...change }));
  }
});
test("USB forwarding never overwrites a different mapping", () => {
  assert.equal(reverseState(""), "missing");
  assert.equal(reverseState("UsbFfs tcp:5173 tcp:5173\n"), "reuse");
  assert.throws(() => reverseState("UsbFfs tcp:5173 tcp:9999\n"));
});
test("child process configuration cannot inherit a remote backend or production credentials", () => {
  const original = { GEMINI_API_KEY: "secret", GOOGLE_API_KEY: "secret", DATABASE_URL: "secret", VITE_ROUTE_PREVIEW_API_URL: "https://production.invalid", SMARTCAB_ROUTE_PREVIEW_TARGET: "https://production.invalid" };
  const env = childEnvironment(original, "demo-model-dir");
  assert.equal(env.GEMINI_API_KEY, undefined);
  assert.equal(env.DATABASE_URL, undefined);
  assert.equal(env.VITE_ROUTE_PREVIEW_API_URL, "");
  assert.equal(env.VITE_ROUTE_USB_PREVIEW, "true");
  assert.equal(env.SMARTCAB_ROUTE_PREVIEW_TARGET, "http://127.0.0.1:8001");
  assert.equal(original.GEMINI_API_KEY, "secret");
});
