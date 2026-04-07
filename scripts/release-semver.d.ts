export type SemverBumpPart = "patch" | "minor" | "major";

export interface Semver {
  major: number;
  minor: number;
  patch: number;
}

export function parseSemver(version: string): Semver;

export function bumpSemver(
  currentVersion: string,
  part?: SemverBumpPart,
): string;
