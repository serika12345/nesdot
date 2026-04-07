const SEMVER_PATTERN = /^(\d+)\.(\d+)\.(\d+)$/u;

const toNonNegativeInteger = (value, label) => {
  const parsed = Number.parseInt(value, 10);
  const isFiniteNumber = Number.isFinite(parsed);
  const isNonNegative = parsed >= 0;

  if (isFiniteNumber !== true || isNonNegative !== true) {
    throw new Error(`Invalid ${label} value: ${value}`);
  }

  return parsed;
};

export const parseSemver = (version) => {
  const match = version.match(SEMVER_PATTERN);

  if (match === null) {
    throw new Error(`Invalid semver version: ${version}`);
  }

  const [, majorRaw, minorRaw, patchRaw] = match;

  return {
    major: toNonNegativeInteger(majorRaw, "major"),
    minor: toNonNegativeInteger(minorRaw, "minor"),
    patch: toNonNegativeInteger(patchRaw, "patch"),
  };
};

export const bumpSemver = (currentVersion, part = "patch") => {
  const parsed = parseSemver(currentVersion);

  if (part === "patch") {
    return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
  }

  if (part === "minor") {
    return `${parsed.major}.${parsed.minor + 1}.0`;
  }

  if (part === "major") {
    return `${parsed.major + 1}.0.0`;
  }

  throw new Error(`Invalid bump part: ${part}`);
};
