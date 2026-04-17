import { z } from "zod";

const LinuxBuildInputsSchema = z.array(z.string()).min(1);

const NixLicenseObjectSchema = z.object({
  fullName: z.string().nullable().optional(),
  shortName: z.string().nullable().optional(),
  spdxId: z.string().nullable().optional(),
});

const NixLicenseMetadataSchema = z.union([
  NixLicenseObjectSchema,
  z.array(NixLicenseObjectSchema),
  z.string(),
  z.array(z.string()),
]);

const reviewedSystemLibraries = [
  {
    expectedLicenseIds: ["LGPL-2.1-or-later"],
    packageName: "glib",
  },
  {
    expectedLicenseIds: ["LGPL-2.1-or-later"],
    packageName: "glib-networking",
  },
  {
    expectedLicenseIds: ["LGPL-2.0-or-later"],
    packageName: "gtk3",
  },
  {
    expectedLicenseIds: ["LGPL-2.1-or-later", "LGPL-3.0-or-later"],
    packageName: "libayatana-appindicator",
  },
  {
    expectedLicenseIds: ["LGPL-2.0-or-later"],
    packageName: "librsvg",
  },
  {
    expectedLicenseIds: ["LGPL-2.0-or-later"],
    packageName: "libsoup_3",
  },
  {
    expectedLicenseIds: ["Apache-2.0"],
    packageName: "openssl",
  },
  {
    expectedLicenseIds: ["BSD-2-Clause"],
    packageName: "webkitgtk_4_1",
  },
];

const linuxBuildInputsPattern =
  /linuxBuildInputs\s*=\s*with pkgs;\s*\[(?<entries>[\s\S]*?)\n\s*\];/u;

const stripLineComment = (line) => {
  return line.replace(/#.*$/u, "").trim();
};

const normalizeLicenseId = (licenseId) => {
  return licenseId.trim();
};

const isStrongCopyleftLicense = (licenseId) => {
  const normalizedLicenseId = licenseId.toUpperCase();

  return (
    normalizedLicenseId.includes("AGPL") ||
    (normalizedLicenseId.includes("GPL") &&
      normalizedLicenseId.includes("LGPL") === false)
  );
};

const isWeakCopyleftLicense = (licenseId) => {
  const normalizedLicenseId = licenseId.toUpperCase();

  return (
    normalizedLicenseId.includes("LGPL") ||
    normalizedLicenseId.startsWith("MPL-")
  );
};

const licenseIdFromMetadataEntry = (entry) => {
  return typeof entry === "string"
    ? normalizeLicenseId(entry)
    : normalizeLicenseId(
        entry.spdxId ?? entry.fullName ?? entry.shortName ?? "",
      );
};

export const extractLinuxBuildInputPackageNames = (flakeText) => {
  const matchedBlock = flakeText.match(linuxBuildInputsPattern);

  if (matchedBlock?.groups?.entries === undefined) {
    throw new Error("Could not find linuxBuildInputs in flake.nix.");
  }

  return LinuxBuildInputsSchema.parse(
    matchedBlock.groups.entries
      .split("\n")
      .map(stripLineComment)
      .filter((line) => line.length > 0),
  );
};

export const normalizeNixLicenseMetadata = (metadata) => {
  const parsedMetadata = NixLicenseMetadataSchema.parse(metadata);
  const rawLicenseIds = Array.isArray(parsedMetadata)
    ? parsedMetadata.map(licenseIdFromMetadataEntry)
    : [licenseIdFromMetadataEntry(parsedMetadata)];
  const normalizedLicenseIds = rawLicenseIds.filter(
    (licenseId) => licenseId.length > 0,
  );

  if (normalizedLicenseIds.length === 0) {
    throw new Error("Nix license metadata did not provide an SPDX identifier.");
  }

  return normalizedLicenseIds;
};

export const normalizeLicenseIdList = (licenseIds) => {
  return licenseIds.map(normalizeLicenseId).toSorted();
};

export const systemLibraryLicenseStatus = (licenseIds) => {
  return licenseIds.some(isStrongCopyleftLicense)
    ? "disallowed"
    : licenseIds.some(isWeakCopyleftLicense)
      ? "reviewed"
      : "allowed";
};

export const reviewedSystemLibraryPolicy = reviewedSystemLibraries;
