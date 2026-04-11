import { describe, expect, it } from "vitest";
import {
  selectCharacterEditorModeValue,
  type CharacterEditorMode,
} from "./characterEditorMode";

describe("selectCharacterEditorModeValue", () => {
  it("returns the compose value in compose mode", () => {
    const editorMode: CharacterEditorMode = "compose";

    expect(
      selectCharacterEditorModeValue(editorMode, {
        compose: "compose-layout",
        decompose: "decompose-layout",
      }),
    ).toBe("compose-layout");
  });

  it("returns the decompose value in decompose mode", () => {
    const editorMode: CharacterEditorMode = "decompose";

    expect(
      selectCharacterEditorModeValue(editorMode, {
        compose: "compose-layout",
        decompose: "decompose-layout",
      }),
    ).toBe("decompose-layout");
  });
});
