#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const flakePath = resolve(repoRoot, "flake.nix");
const buildTarget = ".#pnpmDeps";
const usage = `
Usage:
  node scripts/sync-flake-pnpm-deps-hash.mjs [--check | --dry-run]

What it does:
  - runs 'nix build ${buildTarget} --no-link'
  - exits non-zero with '--check' when flake.nix is out of sync
  - parses the fixed-output hash mismatch for fetchPnpmDeps
  - updates flake.nix to match the current pnpm-lock.yaml contents
  - re-runs the build to verify the new hash
`;

const normalizeArgs = (args) => {
  return args.filter((arg) => arg !== "--");
};

const hasFlag = (args, flagName) => {
  return args.includes(`--${flagName}`);
};

const ensureNoUnknownOptions = (args) => {
  const knownFlags = ["--check", "--dry-run", "--help"];
  const unknownOptions = args.filter(
    (arg) => arg.startsWith("--") && knownFlags.includes(arg) !== true,
  );

  if (unknownOptions.length > 0) {
    throw new Error(`Unknown option(s): ${unknownOptions.join(", ")}`);
  }
};

const ensureNoConflictingOptions = (args) => {
  if (hasFlag(args, "check") === true && hasFlag(args, "dry-run") === true) {
    throw new Error("Use either --check or --dry-run, not both.");
  }
};

const toText = (value) => {
  if (typeof value === "string") {
    return value;
  }

  if (value instanceof Uint8Array) {
    return Buffer.from(value).toString("utf8");
  }

  return "";
};

const runNixBuild = () => {
  try {
    const stdout = execFileSync("nix", ["build", buildTarget, "--no-link"], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });

    return {
      kind: "success",
      output: stdout,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stdout =
      error instanceof Error && "stdout" in error ? toText(error.stdout) : "";
    const stderr =
      error instanceof Error && "stderr" in error ? toText(error.stderr) : "";

    return {
      kind: "failure",
      message,
      output: `${stdout}\n${stderr}`.trim(),
    };
  }
};

const extractHashMismatch = (text) => {
  const match = text.match(/got:\s+(sha256-[A-Za-z0-9+/=]+)/u);

  if (match instanceof Array !== true) {
    return "";
  }

  return match[1] ?? "";
};

const extractCurrentHash = (flakeText) => {
  const match = flakeText.match(
    /pnpmDeps = pkgs\.fetchPnpmDeps \{[\s\S]*?hash = "([^"]+)";/mu,
  );

  if (match instanceof Array !== true) {
    throw new Error("Failed to locate fetchPnpmDeps hash in flake.nix");
  }

  return match[1] ?? "";
};

const replaceHash = (flakeText, nextHash) => {
  const pattern =
    /(pnpmDeps = pkgs\.fetchPnpmDeps \{[\s\S]*?hash = ")([^"]+)(";)/mu;

  if (pattern.test(flakeText) !== true) {
    throw new Error("Failed to update fetchPnpmDeps hash in flake.nix");
  }

  return flakeText.replace(pattern, `$1${nextHash}$3`);
};

const main = () => {
  const args = normalizeArgs(process.argv.slice(2));
  ensureNoUnknownOptions(args);
  ensureNoConflictingOptions(args);

  if (hasFlag(args, "help") === true) {
    console.info(usage.trim());
    return;
  }

  const checkOnly = hasFlag(args, "check");
  const dryRun = hasFlag(args, "dry-run");
  const initialBuild = runNixBuild();

  if (initialBuild.kind === "success") {
    console.info(
      "[sync-flake-pnpm-deps-hash] fetchPnpmDeps hash matches pnpm-lock.yaml.",
    );
    return;
  }

  const nextHash = extractHashMismatch(initialBuild.output);

  if (nextHash.length === 0) {
    throw new Error(
      `[sync-flake-pnpm-deps-hash] nix build failed for a reason other than a fetchPnpmDeps hash mismatch.\n\n${initialBuild.message}\n\n${initialBuild.output}`,
    );
  }

  const flakeText = readFileSync(flakePath, "utf8");
  const currentHash = extractCurrentHash(flakeText);

  if (currentHash === nextHash) {
    throw new Error(
      `[sync-flake-pnpm-deps-hash] flake.nix already contains ${nextHash}, but nix build still failed.\n\n${initialBuild.message}\n\n${initialBuild.output}`,
    );
  }

  if (checkOnly === true) {
    throw new Error(
      `[sync-flake-pnpm-deps-hash] fetchPnpmDeps hash is out of sync: ${currentHash} -> ${nextHash}\n\nRun 'pnpm nix:sync-pnpm-deps-hash' to update flake.nix.`,
    );
  }

  if (dryRun === true) {
    console.info(
      `[sync-flake-pnpm-deps-hash] would update flake.nix: ${currentHash} -> ${nextHash}`,
    );
    return;
  }

  writeFileSync(flakePath, replaceHash(flakeText, nextHash));

  console.info(
    `[sync-flake-pnpm-deps-hash] updated flake.nix: ${currentHash} -> ${nextHash}`,
  );

  const verificationBuild = runNixBuild();

  if (verificationBuild.kind !== "success") {
    throw new Error(
      `[sync-flake-pnpm-deps-hash] hash was updated, but nix build still failed.\n\n${verificationBuild.message}\n\n${verificationBuild.output}`,
    );
  }

  console.info(
    "[sync-flake-pnpm-deps-hash] verified nix build with the refreshed fetchPnpmDeps hash.",
  );
};

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
