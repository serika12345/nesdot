export type SemverBumpPart = "patch" | "minor" | "major";

export function bumpSemver(
  currentVersion: string,
  part?: SemverBumpPart,
): string;
