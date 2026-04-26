import { describe, expect, it } from "vitest";
import { resolveBgModePaintColorIndex } from "./bgModeWorkspaceEditingState";

describe("useBgModeTileEditorState", () => {
  it("uses the selected bg slot for the pen tool", () => {
    expect(resolveBgModePaintColorIndex("pen", 3)).toBe(3);
  });

  it("falls back to slot 0 for the eraser tool", () => {
    expect(resolveBgModePaintColorIndex("eraser", 3)).toBe(0);
  });
});
