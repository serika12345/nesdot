#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const repoRoot = process.cwd();
const baselinePath = resolve(repoRoot, "scripts/cve-audit-baseline.json");

const readJsonFile = (filePath) => {
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    throw new Error(`Failed to parse ${filePath}: ${message}`);
  }
};

const runJsonCommand = (command, args) => {
  try {
    const output = execFileSync(command, args, {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });

    return JSON.parse(output);
  } catch (error) {
    const stdout =
      typeof error === "object" &&
      error !== null &&
      typeof error.stdout === "string"
        ? error.stdout.trim()
        : "";
    const stderr =
      typeof error === "object" &&
      error !== null &&
      typeof error.stderr === "string"
        ? error.stderr.trim()
        : "";

    if (stdout.length > 0) {
      try {
        return JSON.parse(stdout);
      } catch {
        // fall through to the command failure below
      }
    }

    const fallbackMessage =
      stderr.length > 0
        ? stderr
        : stdout.length > 0
          ? stdout
          : error instanceof Error
            ? error.message
            : String(error);

    throw new Error(
      `Failed to run ${command} ${args.join(" ")}: ${fallbackMessage}`,
    );
  }
};

const uniqueSorted = (values) => {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
};

const readBaseline = () => {
  const baseline = readJsonFile(baselinePath);
  const pnpmAllowed = baseline.pnpm?.githubAdvisoryIds;
  const cargoAllowed = baseline.cargo?.rustSecIds;

  if (Array.isArray(pnpmAllowed) !== true) {
    throw new Error(
      "scripts/cve-audit-baseline.json must define pnpm.githubAdvisoryIds as an array.",
    );
  }

  if (Array.isArray(cargoAllowed) !== true) {
    throw new Error(
      "scripts/cve-audit-baseline.json must define cargo.rustSecIds as an array.",
    );
  }

  return {
    pnpmAllowed: uniqueSorted(
      pnpmAllowed.filter((value) => typeof value === "string"),
    ),
    cargoAllowed: uniqueSorted(
      cargoAllowed.filter((value) => typeof value === "string"),
    ),
  };
};

const collectPnpmAdvisories = (auditResult) => {
  const advisories = Object.values(auditResult.advisories ?? {});

  return uniqueSorted(
    advisories.flatMap((advisory) => {
      return typeof advisory.github_advisory_id === "string"
        ? [advisory.github_advisory_id]
        : [];
    }),
  );
};

const collectCargoAdvisories = (auditResult) => {
  const vulnerabilityList = Array.isArray(auditResult.vulnerabilities?.list)
    ? auditResult.vulnerabilities.list
    : Array.isArray(auditResult.vulnerabilities)
      ? auditResult.vulnerabilities
      : [];

  return uniqueSorted(
    vulnerabilityList.flatMap((entry) => {
      const advisory =
        typeof entry === "object" &&
        entry !== null &&
        typeof entry.advisory === "object" &&
        entry.advisory !== null
          ? entry.advisory
          : entry;

      return typeof advisory.id === "string"
        ? [advisory.id]
        : typeof advisory.identifier === "string"
          ? [advisory.identifier]
          : [];
    }),
  );
};

const countCargoWarnings = (auditResult) => {
  const warnings =
    typeof auditResult.warnings === "object" && auditResult.warnings !== null
      ? auditResult.warnings
      : {};

  return Object.values(warnings).reduce((count, warningGroup) => {
    return count + (Array.isArray(warningGroup) ? warningGroup.length : 0);
  }, 0);
};

const diffIds = (currentIds, allowedIds) => {
  return currentIds.filter((id) => allowedIds.includes(id) !== true);
};

const staleIds = (currentIds, allowedIds) => {
  return allowedIds.filter((id) => currentIds.includes(id) !== true);
};

const printSection = (title, ids) => {
  if (ids.length === 0) {
    return;
  }

  console.error(title);
  ids.forEach((id) => {
    console.error(`- ${id}`);
  });
  console.error("");
};

const baseline = readBaseline();
const pnpmAuditResult = runJsonCommand("pnpm", [
  "audit",
  "--json",
  "--audit-level=moderate",
]);
const cargoAuditWithLockfileResult = runJsonCommand("cargo", [
  "audit",
  "--json",
  "--file",
  "src-tauri/Cargo.lock",
]);

const pnpmCurrentIds = collectPnpmAdvisories(pnpmAuditResult);
const cargoCurrentIds = collectCargoAdvisories(cargoAuditWithLockfileResult);
const cargoWarningCount = countCargoWarnings(cargoAuditWithLockfileResult);
const pnpmUnexpectedIds = diffIds(pnpmCurrentIds, baseline.pnpmAllowed);
const cargoUnexpectedIds = diffIds(cargoCurrentIds, baseline.cargoAllowed);
const pnpmStaleIds = staleIds(pnpmCurrentIds, baseline.pnpmAllowed);
const cargoStaleIds = staleIds(cargoCurrentIds, baseline.cargoAllowed);

if (pnpmUnexpectedIds.length > 0 || cargoUnexpectedIds.length > 0) {
  console.error("CVE verification failed.");
  console.error("");
  printSection("Unexpected pnpm advisories:", pnpmUnexpectedIds);
  printSection("Unexpected RustSec advisories:", cargoUnexpectedIds);
  process.exit(1);
}

console.log("CVE verification passed.");
console.log(
  `pnpm advisories: ${pnpmCurrentIds.length} tracked by baseline, RustSec advisories: ${cargoCurrentIds.length} tracked by baseline, informational RustSec warnings: ${cargoWarningCount}.`,
);

if (pnpmStaleIds.length > 0 || cargoStaleIds.length > 0) {
  console.log("");
  if (pnpmStaleIds.length > 0) {
    console.log("Baseline entries no longer reported by pnpm audit:");
    pnpmStaleIds.forEach((id) => {
      console.log(`- ${id}`);
    });
  }
  if (cargoStaleIds.length > 0) {
    console.log("Baseline entries no longer reported by cargo audit:");
    cargoStaleIds.forEach((id) => {
      console.log(`- ${id}`);
    });
  }
}
