import * as O from "fp-ts/Option";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockedHooks = vi.hoisted(() => {
  return {
    useCharacterModeDecompositionOverview: vi.fn(),
    useCharacterModeSelectedRegion: vi.fn(),
  };
});

vi.mock("../../logic/characterModeDecompositionState", () => {
  return {
    useCharacterModeDecompositionOverview:
      mockedHooks.useCharacterModeDecompositionOverview,
    useCharacterModeSelectedRegion: mockedHooks.useCharacterModeSelectedRegion,
  };
});

vi.mock("./preview/CharacterModeTilePreview", () => {
  return {
    CharacterModeTilePreview: () => React.createElement("div", {}, "preview"),
  };
});

vi.mock("../../../logic/decomposition/decompositionRegionRules", () => {
  return {
    getIssueLabel: () => "palette mismatch",
    getRegionStatusLabel: () => "valid",
  };
});

import { CharacterModeSelectedRegionCard } from "./CharacterModeSelectedRegionCard";

describe("CharacterModeSelectedRegionCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockedHooks.useCharacterModeDecompositionOverview.mockReturnValue({
      activeSet: O.some({ id: "set-1", name: "set", sprites: [] }),
      decompositionAnalysis: {
        availableEmptySlotCount: 1,
        canApply: true,
        regions: [
          {
            issues: [],
            matchedSpriteIndex: O.none,
            paletteIndex: O.some(0),
            region: {
              id: "region-1",
              x: 3,
              y: 5,
            },
            resolution: { kind: "planned", plannedSpriteIndex: 0 },
            tile: O.none,
          },
        ],
        requiredNewSpriteCount: 1,
        reusableSpriteCount: 0,
        spriteSize: 8,
      },
      decompositionInvalidRegionCount: 0,
      decompositionValidRegionCount: 1,
      handleApplyDecomposition: vi.fn(() => true),
    });
    mockedHooks.useCharacterModeSelectedRegion.mockReturnValue({
      handleRemoveSelectedRegion: vi.fn(),
      selectedRegionAnalysis: O.some({
        issues: [],
        matchedSpriteIndex: O.none,
        paletteIndex: O.some(0),
        region: {
          id: "region-1",
          x: 3,
          y: 5,
        },
        resolution: { kind: "planned", plannedSpriteIndex: 0 },
        tile: O.none,
      }),
      selectedRegionId: O.some("region-1"),
    });
  });

  it("renders the selected-region inspector without legacy wrapper tokens", () => {
    const markup = renderToStaticMarkup(
      React.createElement(CharacterModeSelectedRegionCard),
    );

    expect(markup).toContain("選択中の領域");
    expect(markup).toContain("分解して現在のセットへ反映");
    expect(markup).toContain("valid");
    expect(markup).toContain("MuiPaper-outlined");
    expect(markup).not.toContain("app-panel");
    expect(markup).not.toContain("app-field-label");
    expect(markup).not.toContain("app-badge");
    expect(markup).not.toContain("app-tool-button");
    expect(markup).not.toContain("character-mode-editor-card");
    expect(markup).not.toContain(
      "character-selected-region-preview-surface-root",
    );
    expect(markup).not.toMatch(/data-tone=/);
    expect(markup).not.toMatch(/data-active=/);
  });
});
