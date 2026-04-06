import { existsSync, mkdirSync, rmSync, renameSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const binaryBasePath = resolve(
  packageRoot,
  "../../apps/desktop/src-tauri/binaries/agent-runtime"
);
const extension = process.platform === "win32" ? ".exe" : "";
const rawBinaryPath = `${binaryBasePath}${extension}`;

function runCommand(command: string[]) {
  const result = Bun.spawnSync(command, {
    cwd: packageRoot,
    stdout: "pipe",
    stderr: "pipe"
  });

  if (!result.success) {
    const stderr = new TextDecoder().decode(result.stderr);
    throw new Error(`Command failed: ${command.join(" ")}\n${stderr}`);
  }

  return new TextDecoder().decode(result.stdout).trim();
}

mkdirSync(dirname(binaryBasePath), { recursive: true });

if (existsSync(rawBinaryPath)) {
  rmSync(rawBinaryPath);
}

runCommand(["bun", "build", "--compile", "src/index.ts", "--outfile", binaryBasePath]);

const targetTriple = runCommand(["rustc", "--print", "host-tuple"]);
if (!targetTriple) {
  throw new Error("Failed to determine Rust target triple for Tauri sidecar.");
}

const finalBinaryPath = `${binaryBasePath}-${targetTriple}${extension}`;
if (existsSync(finalBinaryPath)) {
  rmSync(finalBinaryPath);
}

renameSync(rawBinaryPath, finalBinaryPath);
console.log(`Built Tauri sidecar: ${finalBinaryPath}`);
