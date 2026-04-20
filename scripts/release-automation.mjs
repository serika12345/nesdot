#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { bumpSemver } from "./release-semver.mjs";

const RELEASE_FILES = Object.freeze({
  flakeNix: "flake.nix",
  packageJson: "package.json",
  tauriConfig: "src-tauri/tauri.conf.json",
  cargoToml: "src-tauri/Cargo.toml",
  cargoLock: "src-tauri/Cargo.lock",
});

const VALID_BUMP_PARTS = Object.freeze(["patch", "minor", "major"]);

const usage = `
Usage:
  node scripts/release-automation.mjs [options]

Options:
  --part=patch|minor|major   Bump target. Default: patch
  --version=x.y.z            Explicit version (overrides --part)
  --branch=main              Release branch. Default: main
  --remote=origin            Git remote name. Default: origin
  --skip-checks              Skip lint/typecheck/test checks
  --skip-e2e-console         Skip test:e2e:console
  --dry-run                  Print actions without executing them
  --help                     Show this help
`;

const getOptionValue = (args, optionName) => {
  const prefix = `--${optionName}=`;
  const matches = args.filter((arg) => arg.startsWith(prefix));

  if (matches.length === 0) {
    return null;
  }

  const option = matches[matches.length - 1];
  return option.slice(prefix.length);
};

const hasFlag = (args, flagName) => args.includes(`--${flagName}`);

const ensureNoUnknownOptions = (args) => {
  const knownFlags = [
    "--skip-checks",
    "--skip-e2e-console",
    "--dry-run",
    "--help",
  ];
  const knownPrefixes = ["--part=", "--version=", "--branch=", "--remote="];

  const unknownOptions = args.filter((arg) => {
    const isOption = arg.startsWith("--");
    const isKnownFlag = knownFlags.includes(arg);
    const isKnownPrefix = knownPrefixes.some((prefix) =>
      arg.startsWith(prefix),
    );

    return isOption === true && isKnownFlag !== true && isKnownPrefix !== true;
  });

  if (unknownOptions.length > 0) {
    throw new Error(`Unknown option(s): ${unknownOptions.join(", ")}`);
  }
};

const parseArgs = (args) => {
  const normalizedArgs = args.filter((arg) => arg !== "--");

  ensureNoUnknownOptions(normalizedArgs);

  const requestedPart = getOptionValue(normalizedArgs, "part") ?? "patch";
  const explicitVersion = getOptionValue(normalizedArgs, "version");
  const branchName = getOptionValue(normalizedArgs, "branch") ?? "main";
  const remoteName = getOptionValue(normalizedArgs, "remote") ?? "origin";
  const skipChecks = hasFlag(normalizedArgs, "skip-checks");
  const skipE2EConsole = hasFlag(normalizedArgs, "skip-e2e-console");
  const dryRun = hasFlag(normalizedArgs, "dry-run");
  const help = hasFlag(normalizedArgs, "help");

  const isValidPart = VALID_BUMP_PARTS.includes(requestedPart);

  if (isValidPart !== true) {
    throw new Error(`Invalid --part value: ${requestedPart}`);
  }

  return {
    requestedPart,
    explicitVersion,
    branchName,
    remoteName,
    skipChecks,
    skipE2EConsole,
    dryRun,
    help,
  };
};

const toJson = (text, filePath) => {
  try {
    return JSON.parse(text);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse ${filePath}: ${message}`);
  }
};

const packageVersionPattern =
  /(\[package\][\s\S]*?^version = ")(\d+\.\d+\.\d+)(")/mu;

const cargoLockVersionPattern =
  /(\[\[package\]\]\r?\nname = "nesdot"\r?\nversion = ")(\d+\.\d+\.\d+)(")/u;

const updateCargoVersion = (cargoTomlText, nextVersion) => {
  const hasPackageVersion = packageVersionPattern.test(cargoTomlText);

  if (hasPackageVersion !== true) {
    throw new Error("Failed to find [package] version in src-tauri/Cargo.toml");
  }

  return cargoTomlText.replace(packageVersionPattern, `$1${nextVersion}$3`);
};

const updateCargoLockVersion = (cargoLockText, nextVersion) => {
  const hasPackageVersion = cargoLockVersionPattern.test(cargoLockText);

  if (hasPackageVersion !== true) {
    throw new Error("Failed to find nesdot version in src-tauri/Cargo.lock");
  }

  return cargoLockText.replace(cargoLockVersionPattern, `$1${nextVersion}$3`);
};

const versionPattern = /^\d+\.\d+\.\d+$/u;

const ensureValidVersion = (version, label) => {
  const isValid = versionPattern.test(version);

  if (isValid !== true) {
    throw new Error(`Invalid ${label}: ${version}`);
  }
};

const createRunner = ({ cwd, dryRun }) => {
  const capture = (commandParts) => {
    const [command, ...args] = commandParts;
    const output = execFileSync(command, args, {
      cwd,
      encoding: "utf8",
    });

    return output.trim();
  };

  const run = (commandParts) => {
    const [command, ...args] = commandParts;
    const rendered = [command, ...args].join(" ");

    if (dryRun === true) {
      console.info(`[dry-run] ${rendered}`);
      return;
    }

    execFileSync(command, args, {
      cwd,
      stdio: "inherit",
    });
  };

  return { run, capture };
};

const ensureCleanWorkingTree = (capture) => {
  const porcelain = capture(["git", "status", "--porcelain"]);
  const isClean = porcelain === "";

  if (isClean !== true) {
    throw new Error(
      "Working tree is not clean. Commit or stash changes first.",
    );
  }
};

const ensureCurrentBranch = ({ capture, branchName }) => {
  const currentBranch = capture(["git", "rev-parse", "--abbrev-ref", "HEAD"]);
  const isExpectedBranch = currentBranch === branchName;

  if (isExpectedBranch !== true) {
    throw new Error(
      `Release automation must run from ${branchName}. Current branch: ${currentBranch}`,
    );
  }
};

const parseGitRefSha = (refOutput, label) => {
  const firstLine = refOutput.split("\n")[0] ?? "";
  const [sha] = firstLine.split("\t");
  const hasSha = sha !== undefined && sha !== "";

  if (hasSha !== true) {
    throw new Error(`Failed to resolve ${label}`);
  }

  return sha;
};

const ensureDryRunBranchMatchesRemote = ({
  capture,
  branchName,
  remoteName,
}) => {
  const localHead = capture(["git", "rev-parse", "HEAD"]);
  const remoteRef = capture([
    "git",
    "ls-remote",
    "--heads",
    remoteName,
    branchName,
  ]);
  const remoteHead = parseGitRefSha(
    remoteRef,
    `${remoteName}/${branchName} head`,
  );
  const isUpToDate = localHead === remoteHead;

  if (isUpToDate !== true) {
    throw new Error(
      `Dry run requires ${branchName} to match ${remoteName}/${branchName}. Run git pull --ff-only first.`,
    );
  }
};

const readCargoTomlVersion = (cargoTomlText) => {
  const cargoVersionMatch = cargoTomlText.match(packageVersionPattern);
  const cargoVersion = cargoVersionMatch?.[2] ?? "";

  ensureValidVersion(cargoVersion, "src-tauri/Cargo.toml version");
  return cargoVersion;
};

const readCargoLockVersion = (cargoLockText) => {
  const cargoLockVersionMatch = cargoLockText.match(cargoLockVersionPattern);
  const cargoLockVersion = cargoLockVersionMatch?.[2] ?? "";

  ensureValidVersion(cargoLockVersion, "src-tauri/Cargo.lock version");
  return cargoLockVersion;
};

const readAlignedReleaseVersion = (repoRoot) => {
  const packageJsonPath = resolve(repoRoot, RELEASE_FILES.packageJson);
  const tauriConfigPath = resolve(repoRoot, RELEASE_FILES.tauriConfig);
  const cargoTomlPath = resolve(repoRoot, RELEASE_FILES.cargoToml);
  const cargoLockPath = resolve(repoRoot, RELEASE_FILES.cargoLock);

  const packageJson = toJson(
    readFileSync(packageJsonPath, "utf8"),
    RELEASE_FILES.packageJson,
  );
  const tauriConfig = toJson(
    readFileSync(tauriConfigPath, "utf8"),
    RELEASE_FILES.tauriConfig,
  );
  const cargoTomlVersion = readCargoTomlVersion(
    readFileSync(cargoTomlPath, "utf8"),
  );
  const cargoLockVersion = readCargoLockVersion(
    readFileSync(cargoLockPath, "utf8"),
  );
  const currentVersion = String(packageJson.version);

  ensureValidVersion(currentVersion, "package.json version");
  ensureValidVersion(
    String(tauriConfig.version),
    "src-tauri/tauri.conf.json version",
  );

  const isAligned =
    tauriConfig.version === currentVersion &&
    cargoTomlVersion === currentVersion &&
    cargoLockVersion === currentVersion;

  if (isAligned !== true) {
    throw new Error(
      "Release versions must already be aligned across package.json, src-tauri/tauri.conf.json, src-tauri/Cargo.toml, and src-tauri/Cargo.lock",
    );
  }

  return currentVersion;
};

const writeVersionFiles = ({ repoRoot, nextVersion, dryRun }) => {
  const packageJsonPath = resolve(repoRoot, RELEASE_FILES.packageJson);
  const tauriConfigPath = resolve(repoRoot, RELEASE_FILES.tauriConfig);
  const cargoTomlPath = resolve(repoRoot, RELEASE_FILES.cargoToml);
  const cargoLockPath = resolve(repoRoot, RELEASE_FILES.cargoLock);

  const packageJson = toJson(
    readFileSync(packageJsonPath, "utf8"),
    RELEASE_FILES.packageJson,
  );
  const tauriConfig = toJson(
    readFileSync(tauriConfigPath, "utf8"),
    RELEASE_FILES.tauriConfig,
  );
  const cargoTomlText = readFileSync(cargoTomlPath, "utf8");
  const cargoLockText = readFileSync(cargoLockPath, "utf8");

  const nextPackageJson = {
    ...packageJson,
    version: nextVersion,
  };
  const nextTauriConfig = {
    ...tauriConfig,
    version: nextVersion,
  };
  const nextCargoTomlText = updateCargoVersion(cargoTomlText, nextVersion);
  const nextCargoLockText = updateCargoLockVersion(cargoLockText, nextVersion);

  if (dryRun === true) {
    console.info(
      `[dry-run] update ${RELEASE_FILES.packageJson} -> ${nextVersion}`,
    );
    console.info(
      `[dry-run] update ${RELEASE_FILES.tauriConfig} -> ${nextVersion}`,
    );
    console.info(
      `[dry-run] update ${RELEASE_FILES.cargoToml} -> ${nextVersion}`,
    );
    console.info(
      `[dry-run] update ${RELEASE_FILES.cargoLock} -> ${nextVersion}`,
    );
    return;
  }

  writeFileSync(
    packageJsonPath,
    `${JSON.stringify(nextPackageJson, null, 2)}\n`,
  );
  writeFileSync(
    tauriConfigPath,
    `${JSON.stringify(nextTauriConfig, null, 2)}\n`,
  );
  writeFileSync(cargoTomlPath, nextCargoTomlText);
  writeFileSync(cargoLockPath, nextCargoLockText);
};

const formatVersionFiles = (run) => {
  const filePaths = [RELEASE_FILES.packageJson, RELEASE_FILES.tauriConfig];

  run(["pnpm", "exec", "prettier", "--write", ...filePaths]);
};

const syncPnpmDepsHash = (run) => {
  run(["pnpm", "nix:sync-pnpm-deps-hash"]);
};

const runVerification = ({ run, skipChecks, skipE2EConsole }) => {
  if (skipChecks === true) {
    console.info("[release-automation] skip checks (--skip-checks)");
    return;
  }

  run(["pnpm", "verify"]);

  if (skipE2EConsole !== true) {
    run(["pnpm", "test:e2e:console"]);
  }

  run(["pnpm", "verify:rust"]);

  if (process.platform === "darwin") {
    run(["pnpm", "verify:tauri:csp"]);
  }
};

const ensureTagDoesNotExist = ({ capture, tagName, remoteName }) => {
  const localTag = capture(["git", "tag", "-l", tagName]);
  const hasLocalTag = localTag !== "";

  if (hasLocalTag === true) {
    throw new Error(`Tag already exists locally: ${tagName}`);
  }

  const remoteTag = capture([
    "git",
    "ls-remote",
    "--tags",
    remoteName,
    tagName,
  ]);
  const hasRemoteTag = remoteTag !== "";

  if (hasRemoteTag === true) {
    throw new Error(`Tag already exists on remote: ${tagName}`);
  }
};

const release = ({
  run,
  capture,
  repoRoot,
  branchName,
  remoteName,
  requestedPart,
  explicitVersion,
  skipChecks,
  skipE2EConsole,
  dryRun,
}) => {
  ensureCleanWorkingTree(capture);
  ensureCurrentBranch({ capture, branchName });

  if (dryRun === true) {
    ensureDryRunBranchMatchesRemote({ capture, branchName, remoteName });
  }

  run(["git", "fetch", remoteName]);
  run(["git", "pull", "--ff-only", remoteName, branchName]);

  const currentVersion = readAlignedReleaseVersion(repoRoot);
  const nextVersion =
    explicitVersion === null
      ? bumpSemver(currentVersion, requestedPart)
      : explicitVersion;

  ensureValidVersion(nextVersion, "target version");

  if (currentVersion === nextVersion) {
    throw new Error(
      `Next version must differ from current version (${currentVersion})`,
    );
  }

  const tagName = `v${nextVersion}`;
  ensureTagDoesNotExist({ capture, tagName, remoteName });
  writeVersionFiles({ repoRoot, nextVersion, dryRun });
  formatVersionFiles(run);
  syncPnpmDepsHash(run);
  runVerification({ run, skipChecks, skipE2EConsole });

  run([
    "git",
    "add",
    RELEASE_FILES.flakeNix,
    RELEASE_FILES.packageJson,
    RELEASE_FILES.tauriConfig,
    RELEASE_FILES.cargoToml,
    RELEASE_FILES.cargoLock,
  ]);
  run(["git", "commit", "-m", `chore: release ${tagName}`]);
  run(["git", "push", remoteName, branchName]);
  run(["git", "tag", "-a", tagName, "-m", `Release ${tagName}`]);
  run(["git", "push", remoteName, tagName]);

  if (dryRun === true) {
    console.info(
      `[release-automation] dry-run completed for ${tagName} on ${branchName}`,
    );
  } else {
    console.info(`[release-automation] released ${tagName} from ${branchName}`);
  }
  console.info(
    `[release-automation] workflow: https://github.com/paseri3739/nesdot/actions`,
  );
};

const main = () => {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  if (options.help === true) {
    console.info(usage.trim());
    return;
  }

  const repoRoot = resolve(process.cwd());
  const { run, capture } = createRunner({
    cwd: repoRoot,
    dryRun: options.dryRun,
  });

  release({
    run,
    capture,
    repoRoot,
    branchName: options.branchName,
    remoteName: options.remoteName,
    requestedPart: options.requestedPart,
    explicitVersion: options.explicitVersion,
    skipChecks: options.skipChecks,
    skipE2EConsole: options.skipE2EConsole,
    dryRun: options.dryRun,
  });
};

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[release-automation] ${message}`);
  process.exitCode = 1;
}
