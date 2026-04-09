import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, test } from "vitest";

const projectRoot = fileURLToPath(new URL("../..", import.meta.url));
const buildTestTimeoutMs = 15_000;

type BuildArtifacts = Readonly<{
  indexHtml: string;
  manifest: string;
}>;

const withoutInheritedBasePath = (
  environment: NodeJS.ProcessEnv,
): NodeJS.ProcessEnv => {
  return Object.fromEntries(
    Object.entries(environment).filter(([key]) => key !== "VITE_BASE_PATH"),
  );
};

const buildArtifacts = (
  environmentOverrides: Readonly<Record<string, string>>,
  inheritedEnvironment: NodeJS.ProcessEnv = process.env,
): BuildArtifacts => {
  const outputDirectory = mkdtempSync(
    path.join(tmpdir(), "nesdot-vite-build-artifacts-"),
  );
  const buildEnvironment = {
    ...withoutInheritedBasePath(inheritedEnvironment),
    ...environmentOverrides,
  };

  try {
    execFileSync(
      "pnpm",
      ["exec", "vite", "build", "--outDir", outputDirectory, "--emptyOutDir"],
      {
        cwd: projectRoot,
        env: buildEnvironment,
        stdio: "pipe",
      },
    );

    return {
      indexHtml: readFileSync(path.join(outputDirectory, "index.html"), "utf8"),
      manifest: readFileSync(
        path.join(outputDirectory, "manifest.webmanifest"),
        "utf8",
      ),
    };
  } finally {
    rmSync(outputDirectory, { recursive: true, force: true });
  }
};

describe("vite build artifact paths", () => {
  test(
    "ignores inherited VITE_BASE_PATH when GitHub Actions metadata is present without an explicit base",
    () => {
      const artifacts = buildArtifacts(
        {
          GITHUB_ACTIONS: "true",
          GITHUB_REPOSITORY: "paseri3739/nesdot",
        },
        {
          ...process.env,
          VITE_BASE_PATH: "/nesdot/",
        },
      );

      expect(artifacts.indexHtml).toContain('href="/manifest.webmanifest"');
      expect(artifacts.indexHtml).toContain('href="/favicon.svg"');
      expect(artifacts.indexHtml).toMatch(/src="\/assets\/index-[^"]+\.js"/u);
      expect(artifacts.indexHtml).not.toContain("registerSW.js");
      expect(artifacts.indexHtml).not.toContain("/nesdot/");
      expect(artifacts.manifest).toContain('"start_url":"/"');
      expect(artifacts.manifest).toContain('"scope":"/"');
    },
    buildTestTimeoutMs,
  );

  test(
    "rewrites built asset paths only when the pages base path is explicitly configured",
    () => {
      const artifacts = buildArtifacts({
        VITE_BASE_PATH: "/nesdot/",
        GITHUB_ACTIONS: "true",
        GITHUB_REPOSITORY: "paseri3739/nesdot",
      });

      expect(artifacts.indexHtml).toContain(
        'href="/nesdot/manifest.webmanifest"',
      );
      expect(artifacts.indexHtml).toContain('href="/nesdot/favicon.svg"');
      expect(artifacts.indexHtml).toMatch(
        /src="\/nesdot\/assets\/index-[^"]+\.js"/u,
      );
      expect(artifacts.indexHtml).not.toContain("registerSW.js");
      expect(artifacts.manifest).toContain('"start_url":"/nesdot/"');
      expect(artifacts.manifest).toContain('"scope":"/nesdot/"');
    },
    buildTestTimeoutMs,
  );
});
