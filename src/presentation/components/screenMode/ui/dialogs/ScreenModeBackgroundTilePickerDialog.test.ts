import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { type NesBackgroundPalettes } from "../../../../../domain/nes/nesProject";
import { createEmptyBackgroundTile } from "../../../../../domain/project/projectV2";

type PickerMode = "bgTile" | "bgPalette";

vi.mock("../../../../common/ui/preview/BackgroundTilePreview", () => {
  return {
    BackgroundTilePreview: () => React.createElement("div", {}, "preview"),
  };
});

import { ScreenModeBackgroundTilePickerDialog } from "./ScreenModeBackgroundTilePickerDialog";

const backgroundPalettes: NesBackgroundPalettes = [
  [0, 1, 2, 3],
  [0, 1, 2, 3],
  [0, 1, 2, 3],
  [0, 1, 2, 3],
];

describe("ScreenModeBackgroundTilePickerDialog", () => {
  it("renders the tile picker flow without legacy tab buttons", () => {
    const pickerMode: PickerMode = "bgTile";

    const markup = renderToStaticMarkup(
      React.createElement(ScreenModeBackgroundTilePickerDialog, {
        actions: {
          onApplyPaletteSelection: vi.fn(),
          onClose: vi.fn(),
          onPaletteSelect: vi.fn(),
          onTileSelect: vi.fn(),
        },
        dialog: {
          activePaletteIndex: 0,
          isOpen: true,
          pendingPaletteIndex: 0,
          pickerMode,
        },
        preview: {
          backgroundPalettes,
          universalBackgroundColor: 0,
          visibleBackgroundTiles: [createEmptyBackgroundTile()],
        },
      }),
    );

    expect(markup).toContain("BGタイル追加");
    expect(markup).toContain("BGタイルプレビュー 0");
    expect(markup).not.toContain("BG属性");
    expect(markup).not.toContain("BGパレット変更");
    expect(markup).not.toContain("app-tool-button");
    expect(markup).toContain("rt-variant-outline");
  });

  it("renders the palette picker flow from the dedicated BG palette button", () => {
    const pickerMode: PickerMode = "bgPalette";

    const markup = renderToStaticMarkup(
      React.createElement(ScreenModeBackgroundTilePickerDialog, {
        actions: {
          onApplyPaletteSelection: vi.fn(),
          onClose: vi.fn(),
          onPaletteSelect: vi.fn(),
          onTileSelect: vi.fn(),
        },
        dialog: {
          activePaletteIndex: 0,
          isOpen: true,
          pendingPaletteIndex: 0,
          pickerMode,
        },
        preview: {
          backgroundPalettes,
          universalBackgroundColor: 0,
          visibleBackgroundTiles: [createEmptyBackgroundTile()],
        },
      }),
    );

    expect(markup).toContain("BGパレット変更");
    expect(markup).toContain("BGパレット 0");
    expect(markup).toContain("変更する");
    expect(markup).not.toContain("BG属性");
    expect(markup).not.toContain("app-tool-button");
    expect(markup).toContain("rt-variant-solid");
  });
});
