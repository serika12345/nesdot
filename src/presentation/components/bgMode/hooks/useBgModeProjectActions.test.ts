import { describe, expect, it, vi } from "vitest";
import {
  getHexArrayForBackgroundTile,
  useProjectState,
  type PaletteIndex,
  type ProjectStoreState,
} from "../../../../application/state/projectStore";
import { createDefaultProjectState } from "../../../../domain/project/project";
import {
  createEmptyBackgroundTile,
  type BackgroundTile,
} from "../../../../domain/project/projectV2";
import { createBgModeProjectActions } from "./useBgModeProjectActions";

const setBackgroundTilePixel = (
  tile: BackgroundTile,
  y: number,
  x: number,
  value: 0 | 1 | 2 | 3,
): BackgroundTile => ({
  ...tile,
  pixels: tile.pixels.map((row, rowIndex) =>
    rowIndex === y
      ? row.map((pixel, columnIndex) => (columnIndex === x ? value : pixel))
      : row,
  ),
});

const createProjectStateWithBackgroundPalette = (
  universalBackgroundColor: ProjectStoreState["nes"]["universalBackgroundColor"],
  paletteIndex: PaletteIndex,
  palette: [number, number, number, number],
): ProjectStoreState => {
  const baseState = createDefaultProjectState();
  const backgroundPalettes: ProjectStoreState["nes"]["backgroundPalettes"] = [
    paletteIndex === 0 ? palette : baseState.nes.backgroundPalettes[0],
    paletteIndex === 1 ? palette : baseState.nes.backgroundPalettes[1],
    paletteIndex === 2 ? palette : baseState.nes.backgroundPalettes[2],
    paletteIndex === 3 ? palette : baseState.nes.backgroundPalettes[3],
  ];

  return {
    ...baseState,
    nes: {
      ...baseState.nes,
      universalBackgroundColor,
      backgroundPalettes,
    },
  };
};

describe("createBgModeProjectActions", () => {
  it("reads the latest selected tile and palette state when an action runs", () => {
    const initialProjectState = createProjectStateWithBackgroundPalette(
      45,
      0,
      [45, 1, 21, 34],
    );
    const nextProjectState = createProjectStateWithBackgroundPalette(
      13,
      2,
      [13, 2, 22, 35],
    );
    const initialTile = setBackgroundTilePixel(
      createEmptyBackgroundTile(),
      0,
      0,
      1,
    );
    const nextTile = setBackgroundTilePixel(
      setBackgroundTilePixel(createEmptyBackgroundTile(), 0, 0, 3),
      0,
      1,
      2,
    );
    const getSelectedTile = vi.fn(() => initialTile);
    const getSelectedTileIndex = vi.fn(() => 5);
    const getActivePaletteIndex = vi.fn<() => PaletteIndex>(() => 0);

    useProjectState.setState(initialProjectState);

    const exportChr = vi.fn();
    const exportPng = vi.fn();
    const exportSvgSimple = vi.fn();

    const projectActions = createBgModeProjectActions({
      exportChr,
      exportPng,
      exportSvgSimple,
      getActivePaletteIndex,
      getSelectedTile,
      getSelectedTileIndex,
    });

    useProjectState.setState(nextProjectState);
    getSelectedTile.mockImplementation(() => nextTile);
    getSelectedTileIndex.mockImplementation(() => 23);
    getActivePaletteIndex.mockImplementation(() => 2);

    const [shareExportChr, shareExportPng, shareExportSvg] = projectActions;

    expect(shareExportChr?.id).toBe("share-export-chr");
    expect(shareExportPng?.id).toBe("share-export-png");
    expect(shareExportSvg?.id).toBe("share-export-svg");

    shareExportChr?.onSelect();
    shareExportPng?.onSelect();
    shareExportSvg?.onSelect();

    expect(exportChr).toHaveBeenCalledWith(
      {
        width: 8,
        height: 8,
        paletteIndex: 2,
        pixels: nextTile.pixels.map((row) => row.map((pixel) => pixel)),
      },
      2,
      "bg_tile_023.chr",
    );
    expect(exportPng).toHaveBeenCalledWith(
      getHexArrayForBackgroundTile(nextTile, 2),
      "bg_tile_023.png",
    );
    expect(exportSvgSimple).toHaveBeenCalledWith(
      getHexArrayForBackgroundTile(nextTile, 2),
      8,
      "bg_tile_023.svg",
    );
  });
});
