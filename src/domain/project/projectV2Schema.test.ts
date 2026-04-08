import { describe, expect, it } from "vitest";
import { createDefaultProjectStateV2 } from "./projectV2";
import { ProjectStateV2Schema } from "./projectV2Schema";

describe("ProjectStateV2Schema", () => {
  it("accepts the normalized v2 project shape", () => {
    const result = ProjectStateV2Schema.safeParse(
      createDefaultProjectStateV2(),
    );

    expect(result.success).toBe(true);
  });

  it("rejects screen background palette arrays with an invalid cell count", () => {
    const state = createDefaultProjectStateV2();
    const invalidState = {
      ...state,
      screen: {
        ...state.screen,
        background: {
          ...state.screen.background,
          paletteIndices: state.screen.background.paletteIndices.slice(1),
        },
      },
    };

    const result = ProjectStateV2Schema.safeParse(invalidState);

    expect(result.success).toBe(false);
    if (result.success === true) {
      return;
    }

    expect(
      result.error.issues.some(
        (issue) => issue.path.join(".") === "screen.background.paletteIndices",
      ),
    ).toBe(true);
  });
});
