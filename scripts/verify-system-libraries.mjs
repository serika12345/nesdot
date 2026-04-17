#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { z } from "zod";

import {
  extractLinuxBuildInputPackageNames,
  normalizeLicenseIdList,
  normalizeNixLicenseMetadata,
  reviewedSystemLibraryPolicy,
  systemLibraryLicenseStatus,
} from "./system-library-policy.mjs";

const repoRoot = process.cwd();
const commandExecutionOptions = {
  cwd: repoRoot,
  encoding: "utf8",
  maxBuffer: 1024 * 1024 * 20,
};

const LockedNixpkgsSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  rev: z.string(),
  type: z.literal("github"),
});

const FlakeMetadataSchema = z.object({
  locks: z.object({
    nodes: z.object({
      nixpkgs: z.object({
        locked: LockedNixpkgsSchema,
      }),
    }),
  }),
});

const readTextFile = (relativePath) => {
  return readFileSync(resolve(repoRoot, relativePath), "utf8");
};

const parseJsonText = (relativePath, text) => {
  try {
    return JSON.parse(text);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    throw new Error(`Failed to parse ${relativePath}: ${message}`);
  }
};

const buildCommandFailure = (displayCommand, commandResult) => {
  if (commandResult.error instanceof Error) {
    return [`Failed to run ${displayCommand}: ${commandResult.error.message}`];
  }

  if (commandResult.status === 0) {
    return [];
  }

  const stderrText = commandResult.stderr.trim();
  const stdoutText = commandResult.stdout.trim();
  const outputText = stderrText.length > 0 ? stderrText : stdoutText;
  const outputSuffix = outputText.length > 0 ? ` Output: ${outputText}` : "";

  return [
    `${displayCommand} failed with exit code ${String(commandResult.status)}.${outputSuffix}`,
  ];
};

const reviewedSystemLibraryMap = Object.fromEntries(
  reviewedSystemLibraryPolicy.map((entry) => {
    return [entry.packageName, entry.expectedLicenseIds];
  }),
);

const readLockedNixpkgsReference = () => {
  const displayCommand = "nix flake metadata --json .";
  const commandResult = spawnSync(
    "nix",
    ["flake", "metadata", "--json", "."],
    commandExecutionOptions,
  );
  const commandFailures = buildCommandFailure(displayCommand, commandResult);

  if (commandFailures.length > 0) {
    return {
      failures: commandFailures,
    };
  }

  const parsedMetadata = parseJsonText(
    `${displayCommand} output`,
    commandResult.stdout,
  );
  const flakeMetadataResult = FlakeMetadataSchema.safeParse(parsedMetadata);

  if (!flakeMetadataResult.success) {
    return {
      failures: [
        `${displayCommand} returned unexpected data: ${flakeMetadataResult.error.message}`,
      ],
    };
  }

  const lockedNixpkgs = flakeMetadataResult.data.locks.nodes.nixpkgs.locked;

  return {
    failures: [],
    lockedReference: `github:${lockedNixpkgs.owner}/${lockedNixpkgs.repo}/${lockedNixpkgs.rev}`,
  };
};

const readSystemLibraryLicense = (lockedReference, packageName) => {
  const displayCommand = `nix eval --json ${lockedReference}#${packageName}.meta.license`;
  const commandResult = spawnSync(
    "nix",
    ["eval", "--json", `${lockedReference}#${packageName}.meta.license`],
    commandExecutionOptions,
  );
  const commandFailures = buildCommandFailure(displayCommand, commandResult);

  if (commandFailures.length > 0) {
    return {
      failures: commandFailures,
    };
  }

  try {
    return {
      failures: [],
      licenseIds: normalizeNixLicenseMetadata(
        parseJsonText(`${displayCommand} output`, commandResult.stdout),
      ),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    return {
      failures: [
        `Failed to normalize system library license metadata for ${packageName}: ${message}`,
      ],
    };
  }
};

const buildExpectedLicenseMismatch = (packageName, actualLicenseIds) => {
  const expectedLicenseIds = reviewedSystemLibraryMap[packageName];

  if (expectedLicenseIds === undefined) {
    return [`${packageName} is present in linuxBuildInputs but not reviewed.`];
  }

  return normalizeLicenseIdList(actualLicenseIds).join(" | ") ===
    normalizeLicenseIdList(expectedLicenseIds).join(" | ")
    ? []
    : [
        `${packageName} license metadata changed. Expected ${normalizeLicenseIdList(expectedLicenseIds).join(", ")}, found ${normalizeLicenseIdList(actualLicenseIds).join(", ")}.`,
      ];
};

const flakeText = readTextFile("flake.nix");
const linuxBuildInputPackageNames =
  extractLinuxBuildInputPackageNames(flakeText);
const unexpectedPackages = linuxBuildInputPackageNames.flatMap(
  (packageName) => {
    return reviewedSystemLibraryMap[packageName] === undefined
      ? [`${packageName} is present in linuxBuildInputs but not reviewed.`]
      : [];
  },
);
const missingReviewedPackages = reviewedSystemLibraryPolicy.flatMap((entry) => {
  return linuxBuildInputPackageNames.includes(entry.packageName)
    ? []
    : [
        `${entry.packageName} is missing from linuxBuildInputs and the reviewed baseline must be updated.`,
      ];
});
const lockedReferenceResult = readLockedNixpkgsReference();

if (lockedReferenceResult.failures.length > 0) {
  console.error("System library verification failed.");
  console.error("");
  lockedReferenceResult.failures.forEach((failure) => {
    console.error(`- ${failure}`);
  });
  process.exit(1);
}

const verificationResults = linuxBuildInputPackageNames.map((packageName) => {
  const licenseResult = readSystemLibraryLicense(
    lockedReferenceResult.lockedReference,
    packageName,
  );

  return {
    failures: licenseResult.failures,
    licenseIds: licenseResult.licenseIds ?? [],
    packageName,
  };
});

const licenseFailures = verificationResults.flatMap((result) => {
  return result.failures;
});
const reviewFailures = verificationResults.flatMap((result) => {
  return result.failures.length > 0
    ? []
    : buildExpectedLicenseMismatch(
        result.packageName,
        result.licenseIds,
      ).concat(
        systemLibraryLicenseStatus(result.licenseIds) === "disallowed"
          ? [
              `${result.packageName} resolved to a disallowed strong copyleft system library license: ${normalizeLicenseIdList(result.licenseIds).join(", ")}.`,
            ]
          : [],
      );
});
const failures = unexpectedPackages
  .concat(missingReviewedPackages)
  .concat(licenseFailures)
  .concat(reviewFailures);

if (failures.length > 0) {
  console.error("System library verification failed.");
  console.error("");
  failures.forEach((failure) => {
    console.error(`- ${failure}`);
  });
  process.exit(1);
}

console.log("System library verification passed.");
console.log("");
verificationResults.forEach((result) => {
  const status = systemLibraryLicenseStatus(result.licenseIds);
  const statusLabel =
    status === "reviewed" ? "reviewed weak copyleft" : "allowed";

  console.log(
    `- ${result.packageName}: ${normalizeLicenseIdList(result.licenseIds).join(", ")} (${statusLabel})`,
  );
});
