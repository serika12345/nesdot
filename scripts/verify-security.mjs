#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync } from "node:fs";
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

const forbidTextFragments = (relativePath, text, fragments) => {
  return fragments.flatMap((fragment) => {
    return text.includes(fragment)
      ? [`${relativePath} must not contain \"${fragment}\".`]
      : [];
  });
};

const normalizeDirectiveSources = (value) => {
  if (Array.isArray(value)) {
    return value.filter((source) => typeof source === "string");
  }

  return typeof value === "string"
    ? value.split(/\s+/u).filter((source) => source.length > 0)
    : [];
};

const requireDirectiveSources = (
  relativePath,
  directives,
  directiveName,
  requiredSources,
) => {
  const availableSources = normalizeDirectiveSources(
    directives?.[directiveName],
  );

  if (availableSources.length === 0) {
    return [`${relativePath} must define ${directiveName} in the CSP.`];
  }

  return requiredSources.flatMap((requiredSource) => {
    return availableSources.includes(requiredSource)
      ? []
      : [`${relativePath} ${directiveName} must include ${requiredSource}.`];
  });
};

const forbidDirectiveSources = (
  relativePath,
  directives,
  directiveName,
  forbiddenSources,
) => {
  const availableSources = normalizeDirectiveSources(
    directives?.[directiveName],
  );

  return forbiddenSources.flatMap((forbiddenSource) => {
    return availableSources.includes(forbiddenSource)
      ? [
          `${relativePath} ${directiveName} must not include ${forbiddenSource}.`,
        ]
      : [];
  });
};

const forbidDirectiveDefinition = (relativePath, directives, directiveName) => {
  return Object.prototype.hasOwnProperty.call(directives ?? {}, directiveName)
    ? [`${relativePath} must not define ${directiveName}.`]
    : [];
};

const requireMatchingDirectiveSources = (
  relativePath,
  referenceDirectives,
  candidateDirectives,
  directiveName,
  referenceLabel,
  candidateLabel,
) => {
  const referenceSources = normalizeDirectiveSources(
    referenceDirectives?.[directiveName],
  );
  const candidateSources = normalizeDirectiveSources(
    candidateDirectives?.[directiveName],
  );
  const sameLength = referenceSources.length === candidateSources.length;
  const sameSources =
    sameLength === true &&
    referenceSources.every(
      (source, index) => candidateSources[index] === source,
    );

  return sameSources === true
    ? []
    : [
        `${relativePath} ${candidateLabel} ${directiveName} must match ${referenceLabel} ${directiveName}.`,
      ];
};

const listFiles = (relativeDirectoryPath) => {
  return readdirSync(resolve(repoRoot, relativeDirectoryPath), {
    withFileTypes: true,
  }).flatMap((entry) => {
    const relativePath = `${relativeDirectoryPath}/${entry.name}`;

    return entry.isDirectory() ? listFiles(relativePath) : [relativePath];
  });
};

const listTypeScriptSourceFiles = () => {
  return listFiles("src").filter((relativePath) => {
    return relativePath.endsWith(".ts") || relativePath.endsWith(".tsx");
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

const checkTauriSecurityConfiguration = () => {
  const relativePath = "src-tauri/tauri.conf.json";
  const tauriConfig = parseJsonFile(relativePath);
  const security = tauriConfig.app?.security;

  if (typeof security !== "object" || security === null) {
    return [`${relativePath} must configure app.security.`];
  }

  const headerFailures =
    security.headers?.["X-Content-Type-Options"] === "nosniff"
      ? []
      : [`${relativePath} must set X-Content-Type-Options to nosniff.`];
  const prototypeFailures =
    security.freezePrototype === true
      ? []
      : [`${relativePath} must enable app.security.freezePrototype.`];
  const cspFailures =
    typeof security.csp === "object" && security.csp !== null
      ? []
      : [`${relativePath} must define app.security.csp.`];
  const devCspFailures =
    typeof security.devCsp === "object" && security.devCsp !== null
      ? []
      : [`${relativePath} must define app.security.devCsp.`];

  if (cspFailures.length > 0 || devCspFailures.length > 0) {
    return headerFailures.concat(
      prototypeFailures,
      cspFailures,
      devCspFailures,
    );
  }

  return headerFailures
    .concat(prototypeFailures)
    .concat(
      requireDirectiveSources(relativePath, security.csp, "default-src", [
        "'self'",
      ]),
    )
    .concat(
      requireDirectiveSources(relativePath, security.csp, "script-src", [
        "'self'",
      ]),
    )
    .concat(
      requireDirectiveSources(relativePath, security.csp, "style-src", [
        "'self'",
      ]),
    )
    .concat(
      requireDirectiveSources(relativePath, security.csp, "style-src-attr", [
        "'none'",
      ]),
    )
    .concat(
      forbidDirectiveSources(relativePath, security.csp, "style-src", [
        "'unsafe-inline'",
      ]),
    )
    .concat(
      forbidDirectiveDefinition(relativePath, security.csp, "style-src-elem"),
    )
    .concat(
      requireDirectiveSources(relativePath, security.csp, "img-src", [
        "'self'",
        "blob:",
        "data:",
      ]),
    )
    .concat(
      requireDirectiveSources(relativePath, security.csp, "connect-src", [
        "'self'",
        "ipc:",
        "http://ipc.localhost",
      ]),
    )
    .concat(
      requireDirectiveSources(relativePath, security.csp, "object-src", [
        "'none'",
      ]),
    )
    .concat(
      requireMatchingDirectiveSources(
        relativePath,
        security.csp,
        security.devCsp,
        "default-src",
        "csp",
        "devCsp",
      ),
    )
    .concat(
      requireMatchingDirectiveSources(
        relativePath,
        security.csp,
        security.devCsp,
        "script-src",
        "csp",
        "devCsp",
      ),
    )
    .concat(
      requireMatchingDirectiveSources(
        relativePath,
        security.csp,
        security.devCsp,
        "style-src",
        "csp",
        "devCsp",
      ),
    )
    .concat(
      requireMatchingDirectiveSources(
        relativePath,
        security.csp,
        security.devCsp,
        "style-src-attr",
        "csp",
        "devCsp",
      ),
    )
    .concat(
      requireMatchingDirectiveSources(
        relativePath,
        security.csp,
        security.devCsp,
        "img-src",
        "csp",
        "devCsp",
      ),
    )
    .concat(
      requireMatchingDirectiveSources(
        relativePath,
        security.csp,
        security.devCsp,
        "font-src",
        "csp",
        "devCsp",
      ),
    )
    .concat(
      requireMatchingDirectiveSources(
        relativePath,
        security.csp,
        security.devCsp,
        "object-src",
        "csp",
        "devCsp",
      ),
    )
    .concat(
      requireMatchingDirectiveSources(
        relativePath,
        security.csp,
        security.devCsp,
        "base-uri",
        "csp",
        "devCsp",
      ),
    )
    .concat(
      requireMatchingDirectiveSources(
        relativePath,
        security.csp,
        security.devCsp,
        "form-action",
        "csp",
        "devCsp",
      ),
    )
    .concat(
      requireMatchingDirectiveSources(
        relativePath,
        security.csp,
        security.devCsp,
        "frame-ancestors",
        "csp",
        "devCsp",
      ),
    )
    .concat(
      requireDirectiveSources(relativePath, security.devCsp, "style-src", [
        "'self'",
      ]),
    )
    .concat(
      requireDirectiveSources(relativePath, security.devCsp, "style-src-attr", [
        "'none'",
      ]),
    )
    .concat(
      forbidDirectiveSources(relativePath, security.devCsp, "style-src", [
        "'unsafe-inline'",
      ]),
    )
    .concat(
      forbidDirectiveDefinition(
        relativePath,
        security.devCsp,
        "style-src-elem",
      ),
    )
    .concat(
      requireDirectiveSources(relativePath, security.devCsp, "connect-src", [
        "'self'",
        "ipc:",
        "http://ipc.localhost",
        "http://localhost:1420",
        "http://127.0.0.1:1420",
        "http://[::1]:1420",
        "ws://localhost:1421",
        "ws://127.0.0.1:1421",
        "ws://[::1]:1421",
      ]),
    );
};

const checkDangerousApiLinting = () => {
  const relativePath = "eslint.config.js";
  const eslintConfig = readTextFile(relativePath);

  return requireTextFragments(relativePath, eslintConfig, [
    '"no-eval": "error"',
    '"no-implied-eval": "error"',
    '"no-new-func": "error"',
    '"no-script-url": "error"',
    "dangerouslySetInnerHTML",
    "insertAdjacentHTML",
    "innerHTML",
    "outerHTML",
    "document",
  ]);
};

const checkCveAuditIntegration = () => {
  const packageJsonPath = "package.json";
  const ciWorkflowPath = ".github/workflows/ci.yml";
  const flakePath = "flake.nix";
  const cveScriptPath = "scripts/verify-cves.mjs";
  const cveBaselinePath = "scripts/cve-audit-baseline.json";
  const packageJson = readTextFile(packageJsonPath);
  const ciWorkflow = readTextFile(ciWorkflowPath);
  const flakeNix = readTextFile(flakePath);
  const cveScript = readTextFile(cveScriptPath);
  const cveBaseline = parseJsonFile(cveBaselinePath);
  const baselineIds = cveBaseline.pnpm?.githubAdvisoryIds;

  const baselineFailures =
    Array.isArray(baselineIds) && baselineIds.length > 0
      ? []
      : [`${cveBaselinePath} must define at least one tracked pnpm advisory.`];

  return baselineFailures
    .concat(
      requireTextFragments(packageJsonPath, packageJson, [
        '"verify:cve": "node scripts/verify-cves.mjs"',
      ]),
    )
    .concat(
      requireTextFragments(ciWorkflowPath, ciWorkflow, ["pnpm verify:cve"]),
    )
    .concat(requireTextFragments(flakePath, flakeNix, ["cargo-audit"]))
    .concat(
      requireTextFragments(cveScriptPath, cveScript, [
        "pnpm audit",
        "--json",
        "--audit-level=moderate",
        "cargo",
        "audit",
      ]),
    );
};

const checkInlineStyleAttributeBoundaries = () => {
  const sourceFiles = listTypeScriptSourceFiles();
  const forbiddenChecks = [
    {
      message:
        "must not set style attributes directly while style-src-attr is disabled.",
      pattern: /setAttribute\(\s*["']style["']/u,
    },
    {
      message: "must not assign cssText while style-src-attr is disabled.",
      pattern: /\.cssText\s*=/u,
    },
  ];

  return sourceFiles.flatMap((relativePath) => {
    const source = readTextFile(relativePath);

    return forbiddenChecks.flatMap(({ message, pattern }) => {
      return pattern.test(source) ? [`${relativePath} ${message}`] : [];
    });
  });
};

const checkStyleRuntimeBoundaries = () => {
  const mainPath = "src/main.tsx";
  const indexPath = "src/index.html";
  const nonceHelperPath = "src/infrastructure/browser/getCspNonce.ts";
  const packageJsonPath = "package.json";
  const mainSource = readTextFile(mainPath);
  const indexHtml = readTextFile(indexPath);
  const packageJson = readTextFile(packageJsonPath);

  const nonceHelperFailures =
    existsSync(resolve(repoRoot, nonceHelperPath)) === true
      ? [
          `${nonceHelperPath} must be removed once the legacy style bootstrap is gone.`,
        ]
      : [];

  return forbidTextFragments(mainPath, mainSource, [
    "@emotion/cache",
    "@emotion/react",
    "createCache",
    "CacheProvider",
    "getCspNonce",
  ])
    .concat(
      forbidTextFragments(indexPath, indexHtml, [
        'name="csp-nonce"',
        "__TAURI_STYLE_NONCE__",
      ]),
    )
    .concat(
      forbidTextFragments(packageJsonPath, packageJson, [
        '"@emotion/cache"',
        '"@emotion/react"',
      ]),
    )
    .concat(nonceHelperFailures);
};

const checkTauriStartupLazyBoundaries = () => {
  const boundaryPaths = [
    "src/presentation/components/screenMode/logic/useScreenModeProjectActions.ts",
    "src/presentation/components/spriteMode/logic/spriteModeProjectActions.ts",
  ];

  return boundaryPaths.flatMap((relativePath) => {
    const source = readTextFile(relativePath);
    const failures = [];

    if (source.includes('import useImportImage from "') === true) {
      failures.push(
        `${relativePath} must lazy-load useImportImage so zod stays out of the startup chunk.`,
      );
    }

    if (
      source.includes(
        'import("../../../../infrastructure/browser/useImportImage")',
      ) === false
    ) {
      failures.push(
        `${relativePath} must dynamically import useImportImage from the interaction handler path.`,
      );
    }

    return failures;
  });
};

const checkApplicationJsonBoundaries = () => {
  const sourceFiles = listTypeScriptSourceFiles();
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
  checkTauriSecurityConfiguration(),
  checkDangerousApiLinting(),
  checkInlineStyleAttributeBoundaries(),
  checkStyleRuntimeBoundaries(),
  checkTauriStartupLazyBoundaries(),
  checkApplicationJsonBoundaries(),
  checkCveAuditIntegration(),
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
