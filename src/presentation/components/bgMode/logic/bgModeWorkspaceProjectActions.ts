import {
  getHexArrayForBackgroundTile,
  type PaletteIndex,
  type SpriteTile,
} from "../../../../application/state/projectStore";
import { type BackgroundTile } from "../../../../domain/project/projectV2";
import { type FileShareAction } from "../../common/logic/state/fileMenuState";

const formatTileNumber = (tileIndex: number): string =>
  String(tileIndex).padStart(3, "0");

const createBackgroundTileSprite = (
  tile: BackgroundTile,
  paletteIndex: PaletteIndex,
): SpriteTile => ({
  width: 8,
  height: 8,
  paletteIndex,
  pixels: tile.pixels.map((row) => row.map((pixel) => pixel)),
});

const createBgTileFileName = (tileIndex: number, extension: string): string =>
  `bg_tile_${formatTileNumber(tileIndex)}.${extension}`;

interface CreateBgModeWorkspaceProjectActionsDependencies {
  exportChr: (
    tile: SpriteTile,
    paletteIndex: PaletteIndex,
    fileName?: string,
  ) => void;
  exportPng: (hexArray: string[][], fileName?: string) => void;
  exportSvgSimple: (
    hexArray: string[][],
    scale?: number,
    fileName?: string,
  ) => void;
  getActivePaletteIndex: () => PaletteIndex;
  getSelectedTile: () => BackgroundTile;
  getSelectedTileIndex: () => number;
}

export const createBgModeWorkspaceProjectActions = ({
  exportChr,
  exportPng,
  exportSvgSimple,
  getActivePaletteIndex,
  getSelectedTile,
  getSelectedTileIndex,
}: CreateBgModeWorkspaceProjectActionsDependencies): ReadonlyArray<FileShareAction> => [
  {
    id: "share-export-chr",
    label: "CHRエクスポート",
    onSelect: () => {
      const activePaletteIndex = getActivePaletteIndex();
      const selectedTileIndex = getSelectedTileIndex();

      exportChr(
        createBackgroundTileSprite(getSelectedTile(), activePaletteIndex),
        activePaletteIndex,
        createBgTileFileName(selectedTileIndex, "chr"),
      );
    },
  },
  {
    id: "share-export-png",
    label: "PNGエクスポート",
    onSelect: () => {
      const activePaletteIndex = getActivePaletteIndex();
      const selectedTileIndex = getSelectedTileIndex();

      exportPng(
        getHexArrayForBackgroundTile(getSelectedTile(), activePaletteIndex),
        createBgTileFileName(selectedTileIndex, "png"),
      );
    },
  },
  {
    id: "share-export-svg",
    label: "SVGエクスポート",
    onSelect: () => {
      const activePaletteIndex = getActivePaletteIndex();
      const selectedTileIndex = getSelectedTileIndex();

      exportSvgSimple(
        getHexArrayForBackgroundTile(getSelectedTile(), activePaletteIndex),
        8,
        createBgTileFileName(selectedTileIndex, "svg"),
      );
    },
  },
];
