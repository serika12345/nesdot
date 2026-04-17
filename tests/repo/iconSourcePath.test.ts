import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

const readIconSyncScript = (): string => {
  return readFileSync(
    new URL("../../scripts/sync-icons.sh", import.meta.url),
    "utf8",
  );
};

describe("icon source path", () => {
  test("reads the source svg from src/assets", () => {
    const iconSyncScript = readIconSyncScript();

    expect(iconSyncScript).toContain(
      'SOURCE_ICON="$ROOT_DIR/src/assets/nesdot.svg"',
    );
  });
});
