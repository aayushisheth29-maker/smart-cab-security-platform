import fs from "node:fs";
import path from "node:path";

export const USB_MARKER = "SMARTCAB_USB_PREVIEW_GENERATED";
export const USB_APP_ORIGIN = "http://localhost:5173";

export function debugFiles(base) {
  if (base.appId !== "com.smartcab.routelab.preview") {
    throw new Error("USB mode is limited to the separate SmartCab Route Lab preview app.");
  }
  const config = {
    ...base,
    _smartcabUsbPreview: USB_MARKER,
    server: { url: USB_APP_ORIGIN, cleartext: true, androidScheme: "http" },
    android: { ...base.android, allowMixedContent: false },
  };
  return {
    "android/app/src/debug/assets/capacitor.config.json": JSON.stringify(config, null, 2) + "\n",
    "android/app/src/debug/AndroidManifest.xml": `<?xml version="1.0" encoding="utf-8"?>
<!-- ${USB_MARKER}: debug variant only; never changes src/main or release settings. -->
<manifest xmlns:android="http://schemas.android.com/apk/res/android" xmlns:tools="http://schemas.android.com/tools">
  <application android:allowBackup="false" android:usesCleartextTraffic="true"
    android:networkSecurityConfig="@xml/smartcab_usb_network_security"
    tools:replace="android:allowBackup,android:usesCleartextTraffic" />
</manifest>
`,
    "android/app/src/debug/res/xml/smartcab_usb_network_security.xml": `<?xml version="1.0" encoding="utf-8"?>
<!-- ${USB_MARKER}: HTTP allowed only to loopback, reached over authorized USB. -->
<network-security-config>
  <base-config cleartextTrafficPermitted="false" />
  <domain-config cleartextTrafficPermitted="true">
    <domain includeSubdomains="false">localhost</domain>
    <domain includeSubdomains="false">127.0.0.1</domain>
  </domain-config>
</network-security-config>
`,
  };
}

export function writeDebugFiles(frontend, files) {
  const root = fs.realpathSync(frontend);
  const entries = Object.entries(files).map(([name, content]) => {
    const dest = path.resolve(root, name);
    if (!name.startsWith("android/app/src/debug/") || !dest.startsWith(root + path.sep)) {
      throw new Error("Refusing a non-debug file path.");
    }
    // Refuse symlinked paths so a test configuration cannot escape the project.
    let part = root;
    for (const segment of path.relative(root, dest).split(path.sep)) {
      part = path.join(part, segment);
      if (fs.existsSync(part) && fs.lstatSync(part).isSymbolicLink()) throw new Error("Refusing a linked debug path.");
    }
    if (fs.existsSync(dest) && !fs.readFileSync(dest, "utf8").includes(USB_MARKER)) {
      throw new Error("An existing custom debug configuration was found. It will not be overwritten.");
    }
    return [dest, content];
  });
  for (const [dest, content] of entries) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, content, "utf8");
  }
  return () => {
    for (const [dest, content] of entries) {
      if (fs.existsSync(dest) && !fs.lstatSync(dest).isSymbolicLink()
          && fs.readFileSync(dest, "utf8") === content) fs.unlinkSync(dest);
    }
  };
}

export function requireSyntheticHealth(data) {
  if (data?.environment !== "synthetic-preview" || data.acceptsLiveGps !== false || data.automaticActions !== false) {
    throw new Error("The API is not the isolated synthetic-only Route Lab service. Stopping.");
  }
  if (data.modelAvailable !== true) throw new Error("The synthetic model is not loaded. Train it in the backend's virtual environment first.");
}

export function reverseState(text) {
  const match = text.match(/(?:^|\s)tcp:5173\s+(\S+)/m);
  if (!match) return "missing";
  if (match[1] !== "tcp:5173") throw new Error("Phone port 5173 already has a different forwarding rule; it will not be changed.");
  return "reuse";
}

export function childEnvironment(original, modelDir) {
  const env = { ...original };
  delete env.GEMINI_API_KEY;
  delete env.GOOGLE_API_KEY;
  delete env.DATABASE_URL;
  env.SMARTCAB_ROUTE_MODEL_DIR = modelDir;
  env.VITE_ROUTE_PREVIEW_API_URL = "";
  env.VITE_ROUTE_USB_PREVIEW = "true";
  env.SMARTCAB_ROUTE_PREVIEW_TARGET = "http://127.0.0.1:8001";
  return env;
}
