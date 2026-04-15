import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  APP_FIELD_LABEL_CLASS_NAME,
  BADGE_CLASS_NAME,
  TOOL_BUTTON_CLASS_NAME,
} from "../../../../styleClassNames";

const mockedHooks = vi.hoisted(() => {
  return {
    useCharacterModeDecompositionPalette: vi.fn(),
    useCharacterModeDecompositionTool: vi.fn(),
  };
});

vi.mock("../core/CharacterModeStateProvider", () => {
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
    expect(markup).not.toContain(TOOL_BUTTON_CLASS_NAME);
    expect(markup).not.toContain(BADGE_CLASS_NAME);
    expect(markup).not.toContain(APP_FIELD_LABEL_CLASS_NAME);
    expect(markup).not.toMatch(/data-active=/);
    expect(markup).not.toMatch(/data-tone=/);
  });
});
