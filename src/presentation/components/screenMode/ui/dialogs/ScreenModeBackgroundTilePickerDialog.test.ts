import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

interface MockProjectState {
  nes: {
    backgroundPalettes: ReadonlyArray<
      readonly [number, number, number, number]
    >;
    chrBytes: Uint8Array;
    universalBackgroundColor: number;
  };
}

type MockUseProjectState = <T>(selector: (state: MockProjectState) => T) => T;
type PickerMode = "bgTile" | "bgPalette";

const mockedProjectState = vi.hoisted(() => {
  return {
    useProjectState: vi.fn<MockUseProjectState>(),
  };
});

vi.mock("../../../../../../application/state/projectStore", () => {
  return {
    useProjectState: mockedProjectState.useProjectState,
  };
});

vi.mock("../../../../../../domain/nes/backgroundEditing", () => {
  return {
    decodeBackgroundTileAtIndex: () =>
      E.right({
        paletteIndex: 0,
        pixels: [[0]],
      }),
  };
});

vi.mock("@mui/material/Dialog", () => {
  return {
    default: ({ children }: { children: React.ReactNode }) =>
      React.createElement("div", {}, children),
  };
});

vi.mock("@mui/material/DialogActions", () => {
  return {
    default: ({ children }: { children: React.ReactNode }) =>
      React.createElement("div", {}, children),
  };
});

vi.mock("@mui/material/DialogContent", () => {
  return {
    default: ({ children }: { children: React.ReactNode }) =>
      React.createElement("div", {}, children),
  };
});

vi.mock("@mui/material/DialogTitle", () => {
  return {
    default: ({ children }: { children: React.ReactNode }) =>
      React.createElement("div", {}, children),
  };
});

vi.mock("../../../../common/ui/preview/BackgroundTilePreview", () => {
  return {
    BackgroundTilePreview: () => React.createElement("div", {}, "preview"),
  };
});

import { ScreenModeBackgroundTilePickerDialog } from "./ScreenModeBackgroundTilePickerDialog";

describe("ScreenModeBackgroundTilePickerDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockedProjectState.useProjectState.mockImplementation((selector) =>
      selector({
        nes: {
          backgroundPalettes: [
            [0, 1, 2, 3],
            [0, 1, 2, 3],
            [0, 1, 2, 3],
            [0, 1, 2, 3],
          ],
          chrBytes: new Uint8Array(),
          universalBackgroundColor: 0,
        },
      }),
    );
  });

  it("renders the tile picker flow without legacy tab buttons", () => {
    const pickerMode: O.Option<PickerMode> = O.some("bgTile");

    const markup = renderToStaticMarkup(
      React.createElement(ScreenModeBackgroundTilePickerDialog, {
        activePaletteIndex: 0,
        pickerMode,
        onClose: vi.fn(),
        onPaletteSelect: vi.fn(),
        onTileSelect: vi.fn(),
      }),
    );

    expect(markup).toContain("BGタイル追加");
    expect(markup).toContain("BGタイルプレビュー 0");
    expect(markup).not.toContain("BG属性");
    expect(markup).not.toContain("BGパレット変更");
    expect(markup).not.toContain("app-tool-button");
    expect(markup).not.toMatch(/data-active=/);
    expect(markup).not.toMatch(/data-tone=/);
  });

  it("renders the palette picker flow from the dedicated BG palette button", () => {
    const pickerMode: O.Option<PickerMode> = O.some("bgPalette");

    const markup = renderToStaticMarkup(
      React.createElement(ScreenModeBackgroundTilePickerDialog, {
        activePaletteIndex: 0,
        pickerMode,
        onClose: vi.fn(),
        onPaletteSelect: vi.fn(),
        onTileSelect: vi.fn(),
      }),
    );

    expect(markup).toContain("BGパレット変更");
    expect(markup).toContain("BGパレット 0");
    expect(markup).toContain("変更する");
    expect(markup).not.toContain("BG属性");
    expect(markup).not.toContain("app-tool-button");
    expect(markup).not.toMatch(/data-active=/);
    expect(markup).not.toMatch(/data-tone=/);
  });
});
