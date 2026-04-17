import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockedHooks = vi.hoisted(() => {
  return {
    useCharacterModeSpriteLibrary: vi.fn(),
  };
});

vi.mock("../../logic/characterModeEditorState", () => {
  return {
    useCharacterModeSpriteLibrary: mockedHooks.useCharacterModeSpriteLibrary,
  };
});

vi.mock("./preview/CharacterModeTilePreview", () => {
  return {
    CharacterModeTilePreview: () => React.createElement("div", {}, "preview"),
  };
});

import { CharacterModeSidebarLibrary } from "./CharacterModeSidebarLibrary";

describe("CharacterModeSidebarLibrary", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockedHooks.useCharacterModeSpriteLibrary.mockReturnValue({
      draggingSpriteIndex: -1,
      isLibraryDraggable: true,
      spritePalettes: [
        [0, 1, 2, 3],
        [0, 1, 2, 3],
        [0, 1, 2, 3],
        [0, 1, 2, 3],
      ],
      sprites: [
        {
          height: 8,
          paletteIndex: 0,
          pixels: [[0]],
          width: 8,
        },
      ],
    });
  });

  it("renders the library without legacy field or badge wrappers", () => {
    const markup = renderToStaticMarkup(
      React.createElement(CharacterModeSidebarLibrary, {
        handleLibraryPointerDown: vi.fn(),
      }),
    );

    expect(markup).toContain("スプライトライブラリ");
    expect(markup).toContain("スプライトライブラリを閉じる");
    expect(markup).toContain("8×8");
    expect(markup).toContain("MuiPaper-outlined");
    expect(markup).not.toContain("app-panel");
    expect(markup).not.toContain("app-field-label");
    expect(markup).not.toContain("app-badge");
    expect(markup).not.toContain("character-mode-editor-card");
    expect(markup).not.toContain("character-library-sprite-button");
    expect(markup).not.toContain("character-library-sprite-title");
    expect(markup).not.toContain("character-library-sprite-preview-frame");
    expect(markup).not.toContain("character-library-interaction-root");
    expect(markup).not.toMatch(/data-tone=/);
  });
});
