import { describe, expect, test } from "vitest";

import {
  extractLinuxBuildInputPackageNames,
  normalizeNixLicenseMetadata,
  systemLibraryLicenseStatus,
} from "../../scripts/system-library-policy.mjs";

describe("extractLinuxBuildInputPackageNames", () => {
  test("reads the linuxBuildInputs list from flake text", () => {
    const flakeText = `
        linuxBuildInputs = with pkgs; [
          glib
          gtk3
          webkitgtk_4_1
        ];
    `;

    expect(extractLinuxBuildInputPackageNames(flakeText)).toStrictEqual([
      "glib",
      "gtk3",
      "webkitgtk_4_1",
    ]);
  });

  test("throws when the linuxBuildInputs block cannot be found", () => {
    expect(() => {
      return extractLinuxBuildInputPackageNames("let nothing = [];\n");
    }).toThrow(/linuxBuildInputs/u);
  });
});

describe("normalizeNixLicenseMetadata", () => {
  test("normalizes a single Nix license object", () => {
    expect(
      normalizeNixLicenseMetadata({
        spdxId: "LGPL-2.1-or-later",
      }),
    ).toStrictEqual(["LGPL-2.1-or-later"]);
  });

  test("normalizes arrays of Nix license objects", () => {
    expect(
      normalizeNixLicenseMetadata([
        {
          spdxId: "LGPL-3.0-or-later",
        },
        {
          spdxId: "LGPL-2.1-or-later",
        },
      ]),
    ).toStrictEqual(["LGPL-3.0-or-later", "LGPL-2.1-or-later"]);
  });
});

describe("systemLibraryLicenseStatus", () => {
  test("treats reviewed weak copyleft system libraries as report-only", () => {
    expect(
      systemLibraryLicenseStatus(["LGPL-2.1-or-later", "LGPL-3.0-or-later"]),
    ).toBe("reviewed");
  });

  test("treats strong copyleft system libraries as disallowed", () => {
    expect(systemLibraryLicenseStatus(["GPL-3.0-only"])).toBe("disallowed");
  });

  test("treats permissive system libraries as allowed", () => {
    expect(systemLibraryLicenseStatus(["Apache-2.0", "BSD-2-Clause"])).toBe(
      "allowed",
    );
  });
});
