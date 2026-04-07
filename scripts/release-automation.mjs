#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { bumpSemver } from "./release-semver.mjs";

const RELEASE_FILES = Object.freeze({
  packageJson: "package.json",
  tauriConfig: "src-tauri/tauri.conf.json",
  cargoToml: "src-tauri/Cargo.toml",
});

const VALID_BUMP_PARTS = Object.freeze(["patch", "minor", "major"]);

const usage = `
Usage:
  node scripts/release-automation.mjs [options]

Options:
  --part=patch|minor|major   Bump target. Default: patch
  --version=x.y.z            Explicit version (overrides --part)
  --source=develop           Source branch to release from. Default: develop
  --target=main              Target branch to merge into. Default: main
  --remote=origin            Git remote name. Default: origin
  --skip-checks              Skip lint/typecheck/test checks
  --skip-e2e-console         Skip test:e2e:console
  --dry-run                  Print actions without executing
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
  const knownPrefixes = [
    "--part=",
    "--version=",
    "--source=",
    "--target=",
    "--remote=",
  ];

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
  const sourceBranch = getOptionValue(normalizedArgs, "source") ?? "develop";
  const targetBranch = getOptionValue(normalizedArgs, "target") ?? "main";
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
    sourceBranch,
    targetBranch,
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

const updateCargoVersion = (cargoTomlText, nextVersion) => {
  const packageVersionPattern =
    /(\[package\][\s\S]*?^version = ")(\d+\.\d+\.\d+)(")/mu;
  const hasPackageVersion = packageVersionPattern.test(cargoTomlText);

  if (hasPackageVersion !== true) {
    throw new Error("Failed to find [package] version in src-tauri/Cargo.toml");
  }

  return cargoTomlText.replace(packageVersionPattern, `$1${nextVersion}$3`);
};

const versionPattern = /^\d+\.\d+\.\d+$/u;

const ensureValidVersion = (version, label) => {
  const isValid = versionPattern.test(version);

  if (isValid !== true) {
    throw new Error(`Invalid ${label}: ${version}`);
  }
};

const createRunner = ({ cwd, dryRun }) => {
  const run = (commandParts, options = { capture: false }) => {
    const [command, ...args] = commandParts;
    const rendered = [command, ...args].join(" ");

    if (dryRun === true) {
      console.info(`[dry-run] ${rendered}`);
      return "";
    }

    if (options.capture === true) {
      const output = execFileSync(command, args, {
        cwd,
        encoding: "utf8",
      });
      return output.trim();
    }

    execFileSync(command, args, {
      cwd,
      stdio: "inherit",
    });

    return "";
  };

  return { run };
};

const ensureCleanWorkingTree = (run) => {
  const porcelain = run(["git", "status", "--porcelain"], { capture: true });
  const isClean = porcelain === "";

  if (isClean !== true) {
    throw new Error(
      "Working tree is not clean. Commit or stash changes first.",
    );
  }
};

const readCurrentVersion = (repoRoot) => {
  const packageJsonPath = resolve(repoRoot, RELEASE_FILES.packageJson);
  const packageJsonText = readFileSync(packageJsonPath, "utf8");
  const packageJson = toJson(packageJsonText, RELEASE_FILES.packageJson);
  const currentVersion = String(packageJson.version);

  ensureValidVersion(currentVersion, "package.json version");
  return currentVersion;
};

const writeVersionFiles = ({ repoRoot, nextVersion, dryRun }) => {
  const packageJsonPath = resolve(repoRoot, RELEASE_FILES.packageJson);
  const tauriConfigPath = resolve(repoRoot, RELEASE_FILES.tauriConfig);
  const cargoTomlPath = resolve(repoRoot, RELEASE_FILES.cargoToml);

  const packageJson = toJson(
    readFileSync(packageJsonPath, "utf8"),
    RELEASE_FILES.packageJson,
  );
  const tauriConfig = toJson(
    readFileSync(tauriConfigPath, "utf8"),
    RELEASE_FILES.tauriConfig,
  );
  const cargoTomlText = readFileSync(cargoTomlPath, "utf8");

  const nextPackageJson = {
    ...packageJson,
    version: nextVersion,
  };
  const nextTauriConfig = {
    ...tauriConfig,
    version: nextVersion,
  };
  const nextCargoTomlText = updateCargoVersion(cargoTomlText, nextVersion);

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
};

const runVerification = ({ run, skipChecks, skipE2EConsole }) => {
  if (skipChecks === true) {
    console.info("[release-automation] skip checks (--skip-checks)");
    return;
  }

  run(["pnpm", "lint"]);
  run(["pnpm", "typecheck:safety"]);
  run(["pnpm", "test"]);

  if (skipE2EConsole !== true) {
    run(["pnpm", "test:e2e:console"]);
  }
};

const ensureTagDoesNotExist = ({ run, tagName }) => {
  const localTag = run(["git", "tag", "-l", tagName], { capture: true });
  const hasLocalTag = localTag !== "";

  if (hasLocalTag === true) {
    throw new Error(`Tag already exists locally: ${tagName}`);
  }

  const remoteTag = run(["git", "ls-remote", "--tags", "origin", tagName], {
    capture: true,
  });
  const hasRemoteTag = remoteTag !== "";

  if (hasRemoteTag === true) {
    throw new Error(`Tag already exists on remote: ${tagName}`);
  }
};

const release = ({
  run,
  repoRoot,
  sourceBranch,
  targetBranch,
  remoteName,
  requestedPart,
  explicitVersion,
  skipChecks,
  skipE2EConsole,
  dryRun,
}) => {
  ensureCleanWorkingTree(run);

  const originalBranch =
    dryRun === true
      ? sourceBranch
      : run(["git", "rev-parse", "--abbrev-ref", "HEAD"], {
          capture: true,
        });

  run(["git", "fetch", remoteName]);
  run(["git", "checkout", sourceBranch]);
  run(["git", "pull", "--ff-only", remoteName, sourceBranch]);

  const currentVersion = readCurrentVersion(repoRoot);
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

  writeVersionFiles({ repoRoot, nextVersion, dryRun });

  runVerification({ run, skipChecks, skipE2EConsole });

  const tagName = `v${nextVersion}`;
  ensureTagDoesNotExist({ run, tagName });

  run([
    "git",
    "add",
    RELEASE_FILES.packageJson,
    RELEASE_FILES.tauriConfig,
    RELEASE_FILES.cargoToml,
  ]);
  run([
    "git",
    "commit",
    "-m",
    `chore: bump version to ${nextVersion} for release`,
  ]);
  run(["git", "push", remoteName, sourceBranch]);

  run(["git", "checkout", targetBranch]);
  run(["git", "pull", "--ff-only", remoteName, targetBranch]);
  run([
    "git",
    "merge",
    "--no-ff",
    sourceBranch,
    "-m",
    `Merge branch ${sourceBranch} into ${targetBranch} for ${tagName} release`,
  ]);
  run(["git", "push", remoteName, targetBranch]);
  run(["git", "tag", "-a", tagName, "-m", `Release ${tagName}`]);
  run(["git", "push", remoteName, tagName]);

  const shouldReturnToOriginal = originalBranch !== targetBranch;

  if (shouldReturnToOriginal === true) {
    run(["git", "checkout", originalBranch]);
  }

  if (dryRun === true) {
    console.info(`[release-automation] dry-run completed for ${tagName}`);
  } else {
    console.info(`[release-automation] released ${tagName}`);
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
  const { run } = createRunner({ cwd: repoRoot, dryRun: options.dryRun });

  release({
    run,
    repoRoot,
    sourceBranch: options.sourceBranch,
    targetBranch: options.targetBranch,
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
