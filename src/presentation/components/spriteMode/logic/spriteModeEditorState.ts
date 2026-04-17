import * as O from "fp-ts/Option";
import { useCallback } from "react";
import {
  type PaletteIndex,
  type ProjectSpriteSize,
  type ProjectStoreState,
  useProjectState,
} from "../../../../application/state/projectStore";
import { useWorkbenchState } from "../../../../application/state/workbenchStore";
import { getArrayItem } from "../../../../shared/arrayAccess";
import {
  useSpriteModeActiveTile,
  useSpriteModeTileChangeAction,
} from "./spriteModeShared";

const toPaletteIndex = (index: number): PaletteIndex | false => {
  if (index === 0 || index === 1 || index === 2 || index === 3) {
    return index;
  }

  return false;
};

export interface SpriteModeSelectionFieldsState {
  activePalette: PaletteIndex;
  activeSprite: number;
  handlePaletteChange: (index: string) => void;
  handleSpriteChange: (index: string) => void;
  palettes: ProjectStoreState["nes"]["spritePalettes"];
}

export interface SpriteModeEditorPanelState {
  projectSpriteSize: ProjectSpriteSize;
  selectionFields: SpriteModeSelectionFieldsState;
}

/**
 * `spriteMode` の編集サイドバーが必要とする状態だけをまとめます。
 */
export const useSpriteModeEditorPanelState = (): SpriteModeEditorPanelState => {
  const activePalette = useWorkbenchState(
    (state) => state.spriteMode.activePalette,
  );
  const activeSprite = useWorkbenchState(
    (state) => state.spriteMode.activeSprite,
  );
  const setActivePalette = useWorkbenchState(
    (state) => state.setSpriteModeActivePalette,
  );
  const setActiveSprite = useWorkbenchState(
    (state) => state.setSpriteModeActiveSprite,
  );
  const palettes = useProjectState((state) => state.nes.spritePalettes);
  const sprites = useProjectState((state) => state.sprites);
  const projectSpriteSize = useProjectState((state) => state.spriteSize);
  const activeTile = useSpriteModeActiveTile();
  const handleTileChange = useSpriteModeTileChangeAction();

  const handleSpriteChange = useCallback(
    (index: string): void => {
      const nextIndex = Number.parseInt(index, 10);
      if (nextIndex < 0 || nextIndex >= 64 || Number.isNaN(nextIndex)) {
        return;
      }

      setActiveSprite(nextIndex);
      const targetSpriteOption = getArrayItem(sprites, nextIndex);
      if (O.isNone(targetSpriteOption)) {
        return;
      }

      setActivePalette(targetSpriteOption.value.paletteIndex);
    },
    [setActivePalette, setActiveSprite, sprites],
  );

  const handlePaletteChange = useCallback(
    (index: string): void => {
      const nextIndex = Number.parseInt(index, 10);
      const paletteIndex = toPaletteIndex(nextIndex);
      if (paletteIndex === false) {
        return;
      }

      setActivePalette(paletteIndex);
      handleTileChange({ ...activeTile, paletteIndex }, activeSprite);
    },
    [activeSprite, activeTile, handleTileChange, setActivePalette],
  );

  return {
    projectSpriteSize,
    selectionFields: {
      activePalette,
      activeSprite,
      handlePaletteChange,
      handleSpriteChange,
      palettes,
    },
  };
};
