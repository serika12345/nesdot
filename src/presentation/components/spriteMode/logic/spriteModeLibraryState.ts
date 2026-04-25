import * as O from "fp-ts/Option";
import { useCallback } from "react";
import {
  type ProjectSpriteSize,
  type ProjectState,
  useProjectState,
} from "../../../../application/state/projectStore";
import { useWorkbenchState } from "../../../../application/state/workbenchStore";
import { getArrayItem } from "../../../../shared/arrayAccess";

export interface SpriteModeLibraryPanelState {
  activeSprite: number;
  handleSpriteSelect: (spriteIndex: number) => void;
  projectSpriteSize: ProjectSpriteSize;
  spritePalettes: ProjectState["nes"]["spritePalettes"];
  sprites: ProjectState["sprites"];
}

/**
 * `spriteMode` の左ペインに必要なスプライトライブラリ状態をまとめます。
 */
export const useSpriteModeLibraryPanelState =
  (): SpriteModeLibraryPanelState => {
    const activeSprite = useWorkbenchState(
      (state) => state.spriteMode.activeSprite,
    );
    const setActivePalette = useWorkbenchState(
      (state) => state.setSpriteModeActivePalette,
    );
    const setActiveSprite = useWorkbenchState(
      (state) => state.setSpriteModeActiveSprite,
    );
    const projectSpriteSize = useProjectState((state) => state.spriteSize);
    const spritePalettes = useProjectState((state) => state.nes.spritePalettes);
    const sprites = useProjectState((state) => state.sprites);

    const handleSpriteSelect = useCallback(
      (spriteIndex: number): void => {
        const spriteOption = getArrayItem(sprites, spriteIndex);

        if (O.isNone(spriteOption)) {
          return;
        }

        setActiveSprite(spriteIndex);
        setActivePalette(spriteOption.value.paletteIndex);
      },
      [setActivePalette, setActiveSprite, sprites],
    );

    return {
      activeSprite,
      handleSpriteSelect,
      projectSpriteSize,
      spritePalettes,
      sprites,
    };
  };
