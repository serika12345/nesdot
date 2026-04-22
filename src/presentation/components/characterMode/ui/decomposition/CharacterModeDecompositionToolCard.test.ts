import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockedHooks = vi.hoisted(() => {
  return {
    useCharacterModeDecompositionPalette: vi.fn(),
    useCharacterModeDecompositionTool: vi.fn(),
  };
});

vi.mock("../../logic/characterModeDecompositionState", () => {
  return {
    useCharacterModeDecompositionPalette:
      mockedHooks.useCharacterModeDecompositionPalette,
    useCharacterModeDecompositionTool:
      mockedHooks.useCharacterModeDecompositionTool,
  };
});

import { CharacterModeDecompositionToolCard } from "./CharacterModeDecompositionToolCard";

describe("CharacterModeDecompositionToolCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockedHooks.useCharacterModeDecompositionTool.mockReturnValue({
      decompositionTool: "region",
      handleDecompositionToolChange: vi.fn(),
      projectSpriteSize: 8,
    });
    mockedHooks.useCharacterModeDecompositionPalette.mockReturnValue({
      decompositionColorIndex: 1,
      decompositionPaletteIndex: 0,
      handleDecompositionColorSlotSelect: vi.fn(),
      handleDecompositionPaletteSelect: vi.fn(),
      spritePalettes: [[0, 1, 2, 3]],
    });
  });

  it("renders decomposition controls without legacy wrapper tokens", () => {
    const markup = renderToStaticMarkup(
      React.createElement(CharacterModeDecompositionToolCard),
    );

    expect(markup).toContain("分解ツール");
    expect(markup).toContain("分解ツール 切り取り");
    expect(markup).toContain("分解描画パレット");
    expect(markup).toContain('data-tone="accent"');
    expect(markup).toContain('data-variant="solid"');
    expect(markup).not.toContain("MuiPaper-outlined");
    expect(markup).not.toContain("app-panel");
    expect(markup).not.toContain("app-tool-button");
    expect(markup).not.toContain("app-badge");
    expect(markup).not.toContain("app-field-label");
    expect(markup).not.toContain("character-decomposition-palette-slot-button");
    expect(markup).not.toMatch(/data-active=/);
  });
});
