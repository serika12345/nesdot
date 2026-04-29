import { describe, expect, it } from "vitest";
import { createDefaultProjectState } from "./project";
import { ProjectStateSchema } from "./projectSchema";

describe("ProjectStateSchema", () => {
  it("accepts the normalized project shape", () => {
    const result = ProjectStateSchema.safeParse(createDefaultProjectState());

    expect(result.success).toBe(true);
  });

  it("rejects screen background palette arrays with an invalid cell count", () => {
    const state = createDefaultProjectState();
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

    const result = ProjectStateSchema.safeParse(invalidState);

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
