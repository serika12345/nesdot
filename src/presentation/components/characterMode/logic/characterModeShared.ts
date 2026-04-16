import { useMemo } from "react";
import { useCharacterState } from "../../../../application/state/characterStore";
import { useProjectState } from "../../../../application/state/projectStore";
import { type CharacterDecompositionAnalysis } from "../../../../domain/characters/characterDecomposition";
import { type CharacterSet } from "../../../../domain/characters/characterSet";
import {
  selectActiveSet,
  selectDecompositionAnalysis,
} from "./characterModeSelectors";
import { useCharacterModeDecompositionStore } from "./characterModeDecompositionStore";
import { useCharacterModeProjectStore } from "./characterModeProjectStore";

export const useActiveSet = (): import("fp-ts/Option").Option<CharacterSet> => {
  const characterSets = useCharacterState((s) => s.characterSets);
  const selectedCharacterId = useCharacterState((s) => s.selectedCharacterId);

  return useMemo(
    () => selectActiveSet(characterSets, selectedCharacterId),
    [characterSets, selectedCharacterId],
  );
};

export const useDecompositionAnalysisDerived =
  (): CharacterDecompositionAnalysis => {
    const editorMode = useCharacterModeProjectStore((s) => s.editorMode);
    const decompositionCanvas = useCharacterModeDecompositionStore(
      (s) => s.decompositionCanvas,
    );
    const decompositionRegions = useCharacterModeDecompositionStore(
      (s) => s.decompositionRegions,
    );
    const sprites = useProjectState((s) => s.sprites);
    const projectSpriteSize = useProjectState((s) => s.spriteSize);

    return useMemo(
      () =>
        selectDecompositionAnalysis(
          editorMode,
          decompositionCanvas,
          decompositionRegions,
          projectSpriteSize,
          sprites,
        ),
      [
        decompositionCanvas,
        decompositionRegions,
        editorMode,
        projectSpriteSize,
        sprites,
      ],
    );
  };
