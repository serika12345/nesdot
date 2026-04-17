#!/usr/bin/env node

import { spawnSync } from "node:child_process";

import { z } from "zod";

import { licenseExpressionAllowsNonGplPath } from "./license-policy.mjs";

const repoRoot = process.cwd();
const pnpmExecutable = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const commandExecutionOptions = {
  cwd: repoRoot,
  encoding: "utf8",
  maxBuffer: 1024 * 1024 * 20,
};

const LicenseEntrySchema = z.object({
  license: z.string().optional(),
  name: z.string(),
  paths: z.array(z.string()),
  versions: z.array(z.string()),
});

const LicenseReportSchema = z.record(z.string(), z.array(LicenseEntrySchema));

const CargoMetadataPackageSchema = z.object({
  license: z.string().nullable().optional(),
  name: z.string(),
  source: z.string().nullable().optional(),
  version: z.string(),
});

const CargoMetadataSchema = z.object({
  packages: z.array(CargoMetadataPackageSchema),
});

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

const validateResolvedLicenseExpression = (
  scope,
  packageName,
  packageVersion,
  licenseExpression,
) => {
  const normalizedLicenseExpression = licenseExpression.trim();

  if (normalizedLicenseExpression.length === 0) {
    return [];
  }

  try {
    return licenseExpressionAllowsNonGplPath(normalizedLicenseExpression)
      ? []
      : [
          `Disallowed GPL-family ${scope} license path detected: ${packageName}@${packageVersion} => ${normalizedLicenseExpression}.`,
        ];
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    return [
      `Failed to parse ${scope} license expression for ${packageName}@${packageVersion}: ${message}`,
    ];
  }
};

const checkNodeDependencyLicensePolicy = () => {
  const command = ["licenses", "list", "--json"];
  const displayCommand = "pnpm licenses list --json";
  const commandResult = spawnSync(
    pnpmExecutable,
    command,
    commandExecutionOptions,
  );
  const commandFailures = buildCommandFailure(displayCommand, commandResult);

  if (commandFailures.length > 0) {
    return commandFailures;
  }

  const parsedReport = parseJsonText(
    `${displayCommand} output`,
    commandResult.stdout,
  );
  const licenseReportResult = LicenseReportSchema.safeParse(parsedReport);

  if (!licenseReportResult.success) {
    return [
      `${displayCommand} returned unexpected data: ${licenseReportResult.error.message}`,
    ];
  }

  return Object.entries(licenseReportResult.data).flatMap(
    ([licenseBucket, entries]) => {
      return entries.flatMap((entry) => {
        const resolvedLicense = entry.license ?? licenseBucket;

        return validateResolvedLicenseExpression(
          "Node dependency",
          entry.name,
          entry.versions.join(", "),
          resolvedLicense,
        );
      });
    },
  );
};

const checkRustDependencyLicensePolicy = () => {
  const command = [
    "metadata",
    "--format-version",
    "1",
    "--manifest-path",
    "src-tauri/Cargo.toml",
    "--locked",
  ];
  const displayCommand =
    "cargo metadata --format-version 1 --manifest-path src-tauri/Cargo.toml --locked";
  const commandResult = spawnSync("cargo", command, commandExecutionOptions);
  const commandFailures = buildCommandFailure(displayCommand, commandResult);

  if (commandFailures.length > 0) {
    return commandFailures;
  }

  const parsedMetadata = parseJsonText(
    `${displayCommand} output`,
    commandResult.stdout,
  );
  const cargoMetadataResult = CargoMetadataSchema.safeParse(parsedMetadata);

  if (!cargoMetadataResult.success) {
    return [
      `${displayCommand} returned unexpected data: ${cargoMetadataResult.error.message}`,
    ];
  }

  return cargoMetadataResult.data.packages.flatMap((pkg) => {
    return typeof pkg.source === "string"
      ? validateResolvedLicenseExpression(
          "Rust dependency",
          pkg.name,
          pkg.version,
          pkg.license ?? "",
        )
      : [];
  });
};

const failures = checkNodeDependencyLicensePolicy().concat(
  checkRustDependencyLicensePolicy(),
);

if (failures.length > 0) {
  console.error("License verification failed.");
  console.error("");
  failures.forEach((failure) => {
    console.error(`- ${failure}`);
  });
  process.exit(1);
}

console.log("License verification passed.");
