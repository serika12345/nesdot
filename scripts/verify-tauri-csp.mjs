#!/usr/bin/env node

import { execFileSync, spawn } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const repoRoot = process.cwd();
const tauriBinaryPath = resolve(repoRoot, "result/bin/nesdot");

const logPredicate = [
  '(process == "nesdot")',
  "||",
  '((process CONTAINS "WebKit") AND (eventMessage CONTAINS[c] "Content Security" || eventMessage CONTAINS[c] "console"))',
].join(" ");

const violationPatterns = Object.freeze([
  /content.?security/u,
  /csp/u,
  /style-src/u,
  /refused to apply/u,
  /refused to load/u,
  /console-error/u,
  /console error/u,
]);

const harmlessPatterns = Object.freeze([
  /Filtering the log data using/u,
  /CFPasteboard/u,
  /Connection invalid/u,
  /sandbox/iu,
  /Operation not permitted/iu,
  /AudioComponentRegistrar/u,
  /coreservicesd/u,
  /RunningBoard/u,
  /AppKit:WindowTab/u,
  /Missing entitlements/u,
  /networkd_settings_read_from_file_locked/u,
  /bootstrap look-up/u,
  /Error registering app with intents framework/u,
  /SLSLogBreak/u,
  /Attempt to connect to launchservicesd prohibited/u,
  /Conn 0x0 is not a valid connection ID/u,
  /Unable to hide query parameters from script/u,
  /invalid product id/u,
  /CRASHSTRING:/u,
  /BoardServices/u,
  /XPCErrorDescription/u,
  /TCC:access/u,
  /appintents:Connection/u,
  /Handshake aborted as the connection has been invalidated/u,
]);

const ensureSupportedPlatform = () => {
  if (process.platform !== "darwin") {
    throw new Error(
      "verify:tauri:csp is only supported on macOS because it inspects the unified log for WebKit/Tauri runtime CSP violations.",
    );
  }
};

const ensureBuiltBinary = () => {
  if (existsSync(tauriBinaryPath) !== true) {
    throw new Error(
      `Expected a nix-built Tauri binary at ${tauriBinaryPath}, but it does not exist.`,
    );
  }

  const binaryStat = statSync(tauriBinaryPath);

  if (binaryStat.isFile() !== true) {
    throw new Error(
      `Expected ${tauriBinaryPath} to be a file produced by nix build.`,
    );
  }
};

const runNixBuild = () => {
  execFileSync("nix", ["build"], {
    cwd: repoRoot,
    stdio: "inherit",
  });
};

const ensurePid = (childProcess, processLabel) => {
  if (typeof childProcess.pid !== "number") {
    throw new Error(`${processLabel} did not expose a process id.`);
  }

  return childProcess.pid;
};

const terminateProcessGroup = (pid) => {
  try {
    process.kill(-pid, "SIGTERM");
  } catch (error) {
    const errorCode =
      error instanceof Error && "code" in error ? String(error.code) : "";

    if (errorCode !== "ESRCH") {
      throw error;
    }
  }
};

const collectRuntimeLogLines = async () => {
  const logLines = [];
  const logProcess = spawn(
    "log",
    [
      "stream",
      "--style",
      "compact",
      "--predicate",
      logPredicate,
      "--timeout",
      "20",
    ],
    {
      cwd: repoRoot,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  const appendChunk = (chunk) => {
    const lines = chunk
      .toString()
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    logLines.push(...lines);
  };
  const closedLogLines = new Promise((resolve, reject) => {
    logProcess.on("error", reject);
    logProcess.on("close", () => resolve(logLines));
  });

  logProcess.stdout.on("data", appendChunk);
  logProcess.stderr.on("data", appendChunk);

  await delay(1_000);

  const appProcess = spawn(tauriBinaryPath, [], {
    cwd: repoRoot,
    detached: true,
    stdio: "ignore",
  });
  const appPid = ensurePid(appProcess, "The nix-built Tauri app");

  appProcess.unref();

  await delay(8_000);
  terminateProcessGroup(appPid);
  await delay(1_000);

  if (logProcess.killed !== true) {
    logProcess.kill("SIGTERM");
  }

  return closedLogLines;
};

const findViolationLines = (logLines) => {
  return logLines.filter((line) => {
    const isViolation = violationPatterns.some((pattern) => pattern.test(line));
    const isHarmless = harmlessPatterns.some((pattern) => pattern.test(line));

    return isViolation === true && isHarmless !== true;
  });
};

const main = async () => {
  ensureSupportedPlatform();
  console.info("[verify-tauri-csp] Building the desktop app with nix build...");
  runNixBuild();
  ensureBuiltBinary();

  console.info(
    "[verify-tauri-csp] Launching the nix-built Tauri app and inspecting macOS unified logs...",
  );

  const logLines = await collectRuntimeLogLines();
  const violationLines = findViolationLines(logLines);

  if (violationLines.length > 0) {
    throw new Error(
      [
        "Detected CSP or console-error lines while launching the nix-built Tauri app:",
        ...violationLines,
      ].join("\n"),
    );
  }

  console.info(
    "[verify-tauri-csp] No CSP or console errors were detected while launching result/bin/nesdot.",
  );
};

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);

  console.error(`[verify-tauri-csp] ${message}`);
  process.exitCode = 1;
});
