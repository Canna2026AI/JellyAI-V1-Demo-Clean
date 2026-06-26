import { spawn } from "node:child_process";

const commands = [
  ["admin", "npm", ["run", "dev:admin"]],
  ["front", "npm", ["run", "dev:front"]],
];

const children = commands.map(([label, command, args]) => {
  const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"], shell: false });
  const prefix = `[${label}]`;
  child.stdout.on("data", (chunk) => process.stdout.write(`${prefix} ${chunk}`));
  child.stderr.on("data", (chunk) => process.stderr.write(`${prefix} ${chunk}`));
  child.on("exit", (code, signal) => {
    if (signal) console.log(`${prefix} exited with ${signal}`);
    else if (code) console.log(`${prefix} exited with code ${code}`);
    children.forEach((other) => {
      if (other !== child && !other.killed) other.kill("SIGTERM");
    });
    if (code) process.exitCode = code;
  });
  return child;
});

function shutdown() {
  children.forEach((child) => {
    if (!child.killed) child.kill("SIGTERM");
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
