import test from "node:test";
import assert from "node:assert/strict";
import { packageCommand } from "./mobile-command.mjs";

test("Windows invokes npm through cmd.exe for .cmd support", () => {
  assert.deepEqual(packageCommand("npm", ["run", "build:route-preview"], "win32", "cmd.exe"),
    { command: "cmd.exe", args: ["/d", "/s", "/c", "npm run build:route-preview"] });
});
test("Windows invokes Capacitor through npx using the same fixed-command path", () => {
  assert.deepEqual(packageCommand("npx", ["cap", "sync"], "win32", "cmd.exe"),
    { command: "cmd.exe", args: ["/d", "/s", "/c", "npx cap sync"] });
});
test("Linux and macOS keep direct process execution", () => {
  for (const platform of ["linux", "darwin"]) {
    assert.deepEqual(packageCommand("npm", ["run", "build:route-preview"], platform),
      { command: "npm", args: ["run", "build:route-preview"] });
  }
});
test("shell metacharacters and arbitrary programs are rejected", () => {
  assert.throws(() => packageCommand("npm", ["run", "x & echo bad"], "win32"));
  assert.throws(() => packageCommand("powershell", ["anything"], "win32"));
});
