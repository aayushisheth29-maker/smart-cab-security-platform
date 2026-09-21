/**
 * Local Android USB development only, on the user's laptop (not an Arena/public server).
 * Starts loopback-only servers, adds one authorized adb reverse mapping, and creates
 * debug-source-set overrides. No release configuration, cloud service or real GPS.
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import net from "node:net";
import { spawn, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { debugFiles, writeDebugFiles, requireSyntheticHealth, reverseState, childEnvironment } from "./usb-preview-utils.mjs";

const frontend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const project = path.dirname(frontend);
const backend = path.join(project, "backend-python-ai");
const win = process.platform === "win32";
const pythonName = win ? "Scripts/python.exe" : "bin/python";
const python = [path.join(backend, ".venv", pythonName), path.join(project, ".venv", pythonName)].find(p => fs.existsSync(p));
const sdk = process.env.ANDROID_SDK_ROOT || process.env.ANDROID_HOME || (win
  ? path.join(process.env.LOCALAPPDATA || "", "Android", "Sdk")
  : path.join(os.homedir(), ...(process.platform === "darwin" ? ["Library", "Android", "sdk"] : ["Android", "Sdk"])));
const adb = path.join(sdk, "platform-tools", win ? "adb.exe" : "adb");
const vite = path.join(frontend, "node_modules", "vite", "bin", "vite.js");
const children = [];
let removeDebugFiles = () => {};
let ownsReverse = false;
let stopping = false;

function adbCommand(args) {
  // -d selects exactly one USB device, never a wireless device or arbitrary serial.
  return execFileSync(adb, ["-d", ...args], { encoding: "utf8", timeout: 10000, stdio: ["ignore", "pipe", "pipe"] }).trim();
}
function cleanup() {
  for (const child of children) {
    if (child.exitCode === null && !child.killed) child.kill("SIGTERM");
  }
  if (ownsReverse) {
    try { adbCommand(["reverse", "--remove", "tcp:5173"]); } catch { /* disconnected phone */ }
  }
  removeDebugFiles(); // leaves any subsequently user-edited file alone
}
function finish(code, message) {
  if (stopping) return;
  stopping = true;
  cleanup();
  if (message) console.log(message);
  process.exit(code);
}
process.on("SIGINT", () => finish(0, "USB preview stopped. Turn off USB debugging when you finish testing."));
process.on("SIGTERM", () => finish(0, "USB preview stopped."));
process.on("exit", () => { if (!stopping) cleanup(); });

async function checkFree(port) {
  await new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once("error", () => reject(new Error(`Port ${port} is already in use. Close only your previous Route Lab server, then try again.`)));
    probe.listen(port, "127.0.0.1", () => probe.close(resolve));
  });
}
function start(command, args, cwd, env, label) {
  const child = spawn(command, args, { cwd, env, stdio: "inherit", windowsHide: true });
  children.push(child);
  child.once("error", e => finish(1, `${label} could not start: ${e.message}`));
  child.once("exit", (code, signal) => {
    if (!stopping) finish(code === 0 || signal === "SIGINT" ? 0 : 1, `${label} stopped; the USB preview has been closed.`);
  });
  return child;
}
async function waitForHealth(url) {
  const end = Date.now() + 45000;
  while (Date.now() < end) {
    let data;
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1500) });
      if (response.ok) data = await response.json();
    } catch { /* startup can take a few seconds */ }
    if (data) { requireSyntheticHealth(data); return; }
    await new Promise(resolve => setTimeout(resolve, 350));
  }
  throw new Error("A local server did not become ready. Read its error above; no production API is used as a fallback.");
}

async function main() {
  if (!python) throw new Error("The test backend's .venv was not found. Set up its Python environment first.");
  if (!fs.existsSync(adb)) throw new Error("ADB was not found in the Android SDK. Check ANDROID_SDK_ROOT or the default SDK location.");
  if (!fs.existsSync(vite)) throw new Error("Run npm ci from frontend first.");
  if (!fs.existsSync(path.join(frontend, "android", "app", "build.gradle"))) throw new Error("Generate the separate preview's Android project first.");
  const base = JSON.parse(fs.readFileSync(path.join(frontend, "capacitor.config.json"), "utf8"));
  const files = debugFiles(base);
  try {
    if (adbCommand(["get-state"]) !== "device") throw new Error();
  } catch {
    throw new Error("Connect exactly one Android phone over USB, keep it unlocked, and authorize USB debugging on your own laptop.");
  }
  const mapping = reverseState(adbCommand(["reverse", "--list"]));
  await checkFree(8001);
  await checkFree(5173);
  const env = childEnvironment(process.env, path.join(backend, ".cache", "route-model"));
  console.log("Starting the synthetic-only API on this laptop's loopback interface...");
  start(python, ["-m", "uvicorn", "route_lab.api:app", "--host", "127.0.0.1", "--port", "8001"], backend, env, "Preview API");
  await waitForHealth("http://127.0.0.1:8001/api/preview/health");
  console.log("Starting the loopback frontend. All browser API requests use the same-origin proxy...");
  start(process.execPath, [vite, "--config", path.join(frontend, "vite.route-preview.config.js"), "--host", "127.0.0.1", "--port", "5173", "--strictPort"], frontend, env, "Preview frontend");
  await waitForHealth("http://127.0.0.1:5173/api/preview/health");
  removeDebugFiles = writeDebugFiles(frontend, files);
  if (mapping === "missing") {
    adbCommand(["reverse", "tcp:5173", "tcp:5173"]);
    ownsReverse = true;
  }
  console.log("\nUSB PREVIEW READY");
  console.log("In Android Studio, select your Vivo and the app configuration, then run the DEBUG app.");
  console.log("Keep this terminal open and the USB cable connected. This is not a standalone/release build.");
  console.log("Only synthetic scenarios are processed. No camera, live GPS, SOS or cloud hosting is enabled.");
  console.log("Ctrl+C stops these servers and cleans up this session's managed debug settings.\n");
}
main().catch(error => finish(1, `USB preview stopped: ${error.message}`));
