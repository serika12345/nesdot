#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const repoRoot = process.cwd();
const verifierScriptPath = resolve(repoRoot, "scripts/verify-tauri-csp.mjs");

if (process.platform !== "darwin") {
  console.info(
    `[verify-tauri-csp] Skipping macOS-only runtime verification on ${process.platform}.`,
  );
  process.exit(0);
}

execFileSync(process.execPath, [verifierScriptPath], {
  cwd: repoRoot,
  stdio: "inherit",
});
