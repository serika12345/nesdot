import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import {
  getHexArrayForSpriteTile,
  type PaletteIndex,
  type ProjectSpriteSize,
  type ProjectStoreState,
  type SpriteTile,
} from "../../../../application/state/projectStore";
import { makeTile } from "../../../../domain/tiles/utils";
import { getArrayItem } from "../../../../shared/arrayAccess";
import { type FileShareAction } from "../../common/logic/state/fileMenuState";

function makeEmptyTile(
  height: ProjectSpriteSize,
  paletteIndex: PaletteIndex,
): SpriteTile {
  return makeTile(height, paletteIndex, 0);
}

export const resolveSpriteModeTile = (
  spriteSize: ProjectSpriteSize,
  sprites: ReadonlyArray<SpriteTile>,
  activeSprite: number,
  activePalette: PaletteIndex,
): SpriteTile =>
  pipe(
    getArrayItem(sprites, activeSprite),
    O.getOrElse(() => makeEmptyTile(spriteSize, activePalette)),
  );

interface CreateSpriteModeProjectActionsDependencies {
  exportChr: (tile: SpriteTile, paletteIndex: PaletteIndex) => void;
  exportPng: (hexArray: string[][]) => void;
  exportSvgSimple: (hexArray: string[][]) => void;
  exportJSON: (projectState: ProjectStoreState) => void;
  getActivePalette: () => PaletteIndex;
  getActiveSprite: () => number;
  getProjectState: () => ProjectStoreState;
}

export const createSpriteModeProjectActions = ({
  exportChr,
  exportPng,
  exportSvgSimple,
  exportJSON,
  getActivePalette,
  getActiveSprite,
  getProjectState,
}: CreateSpriteModeProjectActionsDependencies): ReadonlyArray<FileShareAction> => [
  {
    id: "share-export-chr",
    label: "CHRエクスポート",
    onSelect: () => {
      const activePalette = getActivePalette();
      const activeSprite = getActiveSprite();
      const projectState = getProjectState();
      const tile = resolveSpriteModeTile(
        projectState.spriteSize,
        projectState.sprites,
        activeSprite,
        activePalette,
      );

      exportChr(tile, activePalette);
    },
  },
  {
    id: "share-export-png",
    label: "PNGエクスポート",
    onSelect: () => {
      const activePalette = getActivePalette();
      const activeSprite = getActiveSprite();
      const projectState = getProjectState();
      const tile = resolveSpriteModeTile(
        projectState.spriteSize,
        projectState.sprites,
        activeSprite,
        activePalette,
      );

      exportPng(getHexArrayForSpriteTile(tile));
    },
  },
  {
    id: "share-export-svg",
    label: "SVGエクスポート",
    onSelect: () => {
      const activePalette = getActivePalette();
      const activeSprite = getActiveSprite();
      const projectState = getProjectState();
      const tile = resolveSpriteModeTile(
        projectState.spriteSize,
        projectState.sprites,
        activeSprite,
        activePalette,
      );

      exportSvgSimple(getHexArrayForSpriteTile(tile));
    },
  },
  {
    id: "share-save-project",
    label: "保存",
    onSelect: () => {
      exportJSON(getProjectState());
    },
  },
];
