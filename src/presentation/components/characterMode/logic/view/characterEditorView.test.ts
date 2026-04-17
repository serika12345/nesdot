import { describe, expect, it } from "vitest";
import {
  resolveCharacterEditorView,
  type CharacterEditorView,
} from "./characterEditorView";

describe("resolveCharacterEditorView", () => {
  it("returns create when there are no sets", () => {
    expect(resolveCharacterEditorView("edit", 0)).toBe("create");
  });

  it("keeps requested create when sets exist", () => {
    expect(resolveCharacterEditorView("create", 3)).toBe("create");
  });

  it("keeps requested edit when sets exist", () => {
    const requested: CharacterEditorView = "edit";
    expect(resolveCharacterEditorView(requested, 1)).toBe("edit");
  });
});
