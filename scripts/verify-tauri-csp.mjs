#!/usr/bin/env node

import { execFileSync, spawn } from "node:child_process";
import { existsSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { findViolationLines, logPredicate } from "./verify-tauri-csp-core.mjs";

const repoRoot = process.cwd();
const tauriBinaryPath = resolve(repoRoot, "src-tauri/target/debug/nesdot");
const runtimeDiagnosticsPath = resolve(
  tmpdir(),
  `nesdot-verify-tauri-csp-${process.pid}.jsonl`,
);

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
      `Expected a debug Tauri binary at ${tauriBinaryPath}, but it does not exist.`,
    );
  }

  const binaryStat = statSync(tauriBinaryPath);

  if (binaryStat.isFile() !== true) {
    throw new Error(
      `Expected ${tauriBinaryPath} to be a debug Tauri binary produced by tauri build --debug --no-bundle.`,
    );
  }
};

const runDebugBuild = () => {
  execFileSync("pnpm", ["tauri", "build", "--debug", "--no-bundle"], {
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

const clearRuntimeDiagnosticsFile = () => {
  rmSync(runtimeDiagnosticsPath, {
    force: true,
  });
};

const formatRuntimeDiagnosticLine = (line) => {
  try {
    const parsed = JSON.parse(line);

    if (typeof parsed !== "object" || parsed === null) {
      return line;
    }

    const kind =
      "kind" in parsed && typeof parsed.kind === "string" ? parsed.kind : "";
    const message =
      "message" in parsed && typeof parsed.message === "string"
        ? parsed.message
        : line;
    const details =
      "details" in parsed && typeof parsed.details === "string"
        ? parsed.details
        : "";

    return details.length > 0
      ? `[${kind}] ${message} (${details})`
      : `[${kind}] ${message}`;
  } catch {
    return line;
  }
};

const readRuntimeDiagnosticLines = () => {
  if (existsSync(runtimeDiagnosticsPath) !== true) {
    return [];
  }

  const diagnosticsText = readFileSync(runtimeDiagnosticsPath, "utf8").trim();

  if (diagnosticsText.length === 0) {
    return [];
  }

  return diagnosticsText.split("\n").map(formatRuntimeDiagnosticLine);
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

  clearRuntimeDiagnosticsFile();
  await delay(1_000);

  const appProcess = spawn(tauriBinaryPath, [], {
    cwd: repoRoot,
    detached: true,
    stdio: "ignore",
    env: {
      ...process.env,
      NESDOT_VERIFY_TAURI_CSP_DIAGNOSTICS_FILE: runtimeDiagnosticsPath,
      NESDOT_VERIFY_TAURI_CSP_SELF_TEST:
        process.env.NESDOT_VERIFY_TAURI_CSP_SELF_TEST ?? "",
    },
  });
  const appPid = ensurePid(appProcess, "The debug Tauri app");

  appProcess.unref();

  await delay(8_000);
  terminateProcessGroup(appPid);
  await delay(1_000);

  if (logProcess.killed !== true) {
    logProcess.kill("SIGTERM");
  }

  return closedLogLines;
};

const main = async () => {
  ensureSupportedPlatform();
  console.info(
    "[verify-tauri-csp] Building the debug desktop binary with tauri build --debug --no-bundle...",
  );
  runDebugBuild();
  ensureBuiltBinary();

  console.info(
    "[verify-tauri-csp] Launching the debug Tauri binary and inspecting macOS unified logs...",
  );

  const logLines = await collectRuntimeLogLines();
  const runtimeDiagnosticLines = readRuntimeDiagnosticLines();
  const violationLines = findViolationLines(logLines);

  if (runtimeDiagnosticLines.length > 0 || violationLines.length > 0) {
    throw new Error(
      [
        "Detected CSP or console-error diagnostics while launching the debug Tauri binary:",
        ...runtimeDiagnosticLines.map((line) => `[runtime-diagnostic] ${line}`),
        ...violationLines,
      ].join("\n"),
    );
  }

  console.info(
    "[verify-tauri-csp] No CSP or console errors were detected while launching src-tauri/target/debug/nesdot.",
  );
};

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);

  console.error(`[verify-tauri-csp] ${message}`);
  process.exitCode = 1;
});
