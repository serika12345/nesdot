import * as O from "fp-ts/Option";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockedHooks = vi.hoisted(() => {
  return {
    useCharacterModeEditorModeSetting: vi.fn(),
    useCharacterModeSetSelection: vi.fn(),
    useCharacterModeSpriteSize: vi.fn(),
  };
});

vi.mock("../../logic/characterModeEditorState", () => {
  return {
    useCharacterModeEditorModeSetting:
      mockedHooks.useCharacterModeEditorModeSetting,
    useCharacterModeSetSelection: mockedHooks.useCharacterModeSetSelection,
    useCharacterModeSpriteSize: mockedHooks.useCharacterModeSpriteSize,
  };
});

import { CharacterModeSidebarEditorModeCard } from "./CharacterModeSidebarEditorModeCard";
import { CharacterModeSidebarSpriteSizeCard } from "./CharacterModeSidebarSpriteSizeCard";

describe("CharacterMode sidebar cards", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockedHooks.useCharacterModeEditorModeSetting.mockReturnValue({
      editorMode: "compose",
      handleEditorModeChange: vi.fn(),
    });
    mockedHooks.useCharacterModeSetSelection.mockReturnValue({
      characterSets: [],
      handleDeleteSet: vi.fn(),
      handleSelectSet: vi.fn(),
      selectedCharacterId: O.some("set-1"),
    });
    mockedHooks.useCharacterModeSpriteSize.mockReturnValue({
      handleProjectSpriteSizeChange: vi.fn(),
      projectSpriteSize: 8,
      projectSpriteSizeLocked: false,
    });
  });

  it("renders editor mode actions without ToolButton wrapper attributes", () => {
    const markup = renderToStaticMarkup(
      React.createElement(CharacterModeSidebarEditorModeCard),
    );

    expect(markup).toContain("編集モード 合成");
    expect(markup).toContain("編集モード 分解");
    expect(markup).not.toContain("app-tool-button");
    expect(markup).toContain("rt-variant-solid");
    expect(markup).toContain("rt-variant-outline");
  });

  it("renders sprite size actions without ToolButton wrapper attributes", () => {
    const markup = renderToStaticMarkup(
      React.createElement(CharacterModeSidebarSpriteSizeCard),
    );

    expect(markup).toContain("プロジェクトスプライトサイズ 8x8");
    expect(markup).toContain("プロジェクトスプライトサイズ 8x16");
    expect(markup).not.toContain("app-tool-button");
    expect(markup).toContain("rt-variant-solid");
    expect(markup).toContain("rt-variant-outline");
  });
});
