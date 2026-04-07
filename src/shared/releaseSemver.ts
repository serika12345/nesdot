import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";

const SEMVER_PATTERN = /^(\d+)\.(\d+)\.(\d+)$/u;

export type SemverBumpPart = "patch" | "minor" | "major";

export interface Semver {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
}

const toNonNegativeInteger = (
  value: string,
  label: string,
): E.Either<string, number> => {
  const parsed = Number.parseInt(value, 10);
  const isFiniteNumber = Number.isFinite(parsed);
  const isNonNegative = parsed >= 0;

  if (isFiniteNumber === true && isNonNegative === true) {
    return E.right(parsed);
  }

  return E.left(`Invalid ${label} value: ${value}`);
};

const parseSegment = (
  match: ReadonlyArray<string>,
  index: number,
  label: string,
): E.Either<string, number> => {
  return pipe(
    O.fromNullable(match[index]),
    E.fromOption(() => `Missing ${label} value in semver version`),
    E.chain((value) => toNonNegativeInteger(value, label)),
  );
};

export const parseSemver = (version: string): E.Either<string, Semver> => {
  return pipe(
    O.fromNullable(version.match(SEMVER_PATTERN)),
    E.fromOption(() => `Invalid semver version: ${version}`),
    E.bindTo("match"),
    E.bind("major", ({ match }) => parseSegment(match, 1, "major")),
    E.bind("minor", ({ match }) => parseSegment(match, 2, "minor")),
    E.bind("patch", ({ match }) => parseSegment(match, 3, "patch")),
    E.map(({ major, minor, patch }) => ({
      major,
      minor,
      patch,
    })),
  );
};

export const bumpSemver = (
  currentVersion: string,
  part: SemverBumpPart = "patch",
): E.Either<string, string> => {
  return pipe(
    parseSemver(currentVersion),
    E.map((parsed) => {
      if (part === "patch") {
        return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
      }

      if (part === "minor") {
        return `${parsed.major}.${parsed.minor + 1}.0`;
      }

      return `${parsed.major + 1}.0.0`;
    }),
  );
};
