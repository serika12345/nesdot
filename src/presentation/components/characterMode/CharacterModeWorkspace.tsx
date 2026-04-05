import React from "react";
import { CharacterModeComposeWorkspace } from "./CharacterModeComposeWorkspace";
import { CharacterModeDecomposeWorkspace } from "./CharacterModeDecomposeWorkspace";
import { useCharacterModeEditorModeValue } from "./CharacterModeStateProvider";
import { selectCharacterEditorModeValue } from "./view/characterEditorMode";

/**
 * 現在の編集モードに応じてワークスペース本体を切り替えます。
 */
export const CharacterModeWorkspace: React.FC = () => {
  const { editorMode } = useCharacterModeEditorModeValue();

  return selectCharacterEditorModeValue(editorMode, {
    compose: <CharacterModeComposeWorkspace />,
    decompose: <CharacterModeDecomposeWorkspace />,
  });
};
