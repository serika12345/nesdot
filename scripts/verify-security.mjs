#!/usr/bin/env node

import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const repoRoot = process.cwd();

const readTextFile = (relativePath) => {
  return readFileSync(resolve(repoRoot, relativePath), "utf8");
};

const parseJsonFile = (relativePath) => {
  try {
    return JSON.parse(readTextFile(relativePath));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    throw new Error(`Failed to parse ${relativePath}: ${message}`);
  }
};

const requireTextFragments = (relativePath, text, fragments) => {
  return fragments.flatMap((fragment) => {
    return text.includes(fragment)
      ? []
      : [`${relativePath} must contain \"${fragment}\".`];
  });
};

const listFiles = (relativeDirectoryPath) => {
  return readdirSync(resolve(repoRoot, relativeDirectoryPath), {
    withFileTypes: true,
  }).flatMap((entry) => {
    const relativePath = `${relativeDirectoryPath}/${entry.name}`;

    return entry.isDirectory() ? listFiles(relativePath) : [relativePath];
  });
};

const checkSupplyChainPolicy = () => {
  const relativePath = "pnpm-workspace.yaml";
  const workspaceConfig = readTextFile(relativePath);

  return requireTextFragments(relativePath, workspaceConfig, [
    "strictDepBuilds: true",
    "minimumReleaseAge: 1440",
    "blockExoticSubdeps: true",
    "onlyBuiltDependencies:",
    "  - esbuild",
    "  - unrs-resolver",
    "ignoredBuiltDependencies:",
    "  - canvas",
  ]);
};

const checkFrozenLockfileInstalls = () => {
  return [
    ".github/workflows/ci.yml",
    ".github/workflows/deploy-pages.yml",
    ".github/workflows/release-tauri-desktop.yml",
  ].flatMap((relativePath) => {
    const workflow = readTextFile(relativePath);

    return workflow.includes("pnpm install --frozen-lockfile")
      ? []
      : [`${relativePath} must install dependencies with --frozen-lockfile.`];
  });
};

const checkUpdaterConfiguration = () => {
  const relativePath = "src-tauri/tauri.conf.json";
  const tauriConfig = parseJsonFile(relativePath);
  const updater = tauriConfig.plugins?.updater;
  const createUpdaterArtifacts = tauriConfig.bundle?.createUpdaterArtifacts;

  const updaterConfigFailures =
    typeof updater === "object" && updater !== null
      ? []
      : [`${relativePath} must configure plugins.updater.`];

  if (updaterConfigFailures.length > 0) {
    return updaterConfigFailures;
  }

  const pubkey = updater.pubkey;
  const endpoints = updater.endpoints;
  const installMode = updater.windows?.installMode;
  const pubkeyFailures =
    typeof pubkey === "string" && pubkey.length > 0
      ? []
      : [`${relativePath} must define a non-empty updater pubkey.`];
  const endpointFailures =
    Array.isArray(endpoints) && endpoints.length > 0
      ? endpoints.flatMap((endpoint) => {
          return typeof endpoint === "string" && endpoint.startsWith("https://")
            ? []
            : [
                `${relativePath} updater endpoints must use HTTPS: ${String(endpoint)}`,
              ];
        })
      : [`${relativePath} must define at least one updater endpoint.`];
  const artifactFailures =
    createUpdaterArtifacts === true
      ? []
      : [`${relativePath} must keep bundle.createUpdaterArtifacts enabled.`];
  const installModeFailures =
    installMode === "passive"
      ? []
      : [
          `${relativePath} must keep updater.windows.installMode set to passive.`,
        ];

  return pubkeyFailures.concat(
    endpointFailures,
    artifactFailures,
    installModeFailures,
  );
};

const checkApplicationJsonBoundaries = () => {
  const sourceFiles = listFiles("src").filter((relativePath) => {
    return relativePath.endsWith(".ts") || relativePath.endsWith(".tsx");
  });
  const jsonParseFiles = sourceFiles.filter((relativePath) => {
    return readTextFile(relativePath).includes("JSON.parse(");
  });
  const expectedJsonParseFiles = [
    "src/infrastructure/browser/useImportImage.ts",
  ];
  const unexpectedJsonParseFiles = jsonParseFiles.flatMap((relativePath) => {
    return expectedJsonParseFiles.includes(relativePath)
      ? []
      : [
          `${relativePath} adds JSON.parse() outside the reviewed import boundary.`,
        ];
  });
  const missingReviewedBoundaries = expectedJsonParseFiles.flatMap(
    (relativePath) => {
      return jsonParseFiles.includes(relativePath)
        ? []
        : [`${relativePath} must remain the reviewed JSON import boundary.`];
    },
  );
  const importBoundaryPath = "src/infrastructure/browser/useImportImage.ts";
  const importBoundarySource = readTextFile(importBoundaryPath);
  const boundaryValidationFailures = requireTextFragments(
    importBoundaryPath,
    importBoundarySource,
    [
      "const parsed: unknown = JSON.parse(text);",
      "ProjectImportSchema.safeParse(parsed)",
    ],
  );

  return unexpectedJsonParseFiles.concat(
    missingReviewedBoundaries,
    boundaryValidationFailures,
  );
};

const failures = checkSupplyChainPolicy().concat(
  checkFrozenLockfileInstalls(),
  checkUpdaterConfiguration(),
  checkApplicationJsonBoundaries(),
);

if (failures.length > 0) {
  console.error("Security verification failed.");
  console.error("");
  failures.forEach((failure) => {
    console.error(`- ${failure}`);
  });
  process.exit(1);
}

console.log("Security verification passed.");
