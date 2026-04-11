import React from "react";
import { type FileMenuState } from "../../../../common/logic/state/fileMenuState";
import { CharacterModeScreen } from "../CharacterModeScreen";
import { CharacterModeStateProvider } from "../CharacterModeStateProvider";

interface CharacterModeProps {
  onFileMenuStateChange: (fileMenuState: FileMenuState) => void;
}

/**
 * キャラクター編集モード全体の UI を描画します。
 * 状態 provider と画面 shell の接続だけを担当します。
 */
const CharacterModeComponent: React.FC<CharacterModeProps> = ({
  onFileMenuStateChange,
}) => {
  return (
    <CharacterModeStateProvider>
      <CharacterModeScreen onFileMenuStateChange={onFileMenuStateChange} />
    </CharacterModeStateProvider>
  );
};

export const CharacterMode = React.memo(CharacterModeComponent);
