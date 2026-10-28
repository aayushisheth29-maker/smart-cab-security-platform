/** Fixed package commands, including npm.cmd/npx.cmd dispatch on Windows. */
export function packageCommand(command, args, platform = process.platform, windowsShell = process.env.ComSpec || "cmd.exe") {
  // Only controlled tokens belong here, never URLs, credentials, or user input.
  if (!["npm", "npx"].includes(command) || !args.every(arg => /^[a-zA-Z0-9:_-]+$/.test(arg))) {
    throw new TypeError("Unsupported package command");
  }
  if (platform === "win32") {
    return { command: windowsShell, args: ["/d", "/s", "/c", [command, ...args].join(" ")] };
  }
  return { command, args };
}
