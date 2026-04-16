import * as O from "fp-ts/Option";
import React from "react";
import { type FileMenuState } from "../../../../common/logic/state/fileMenuState";
import { CharacterModeScreen } from "../CharacterModeScreen";
import {
  CharacterModeStateProvider,
  useCharacterModeProjectActions,
} from "../CharacterModeStateProvider";

interface CharacterModeProps {
  render: (params: {
    fileMenuState: FileMenuState;
    panel: React.ReactNode;
  }) => React.ReactNode;
}

const CharacterModeContent: React.FC<CharacterModeProps> = ({ render }) => {
  const { projectActions } = useCharacterModeProjectActions();
  const fileMenuState = React.useMemo<FileMenuState>(
    () => ({
      shareActions: projectActions,
      restoreAction: O.none,
    }),
    [projectActions],
  );

  return render({
    fileMenuState,
    panel: <CharacterModeScreen />,
  });
};

/**
 * キャラクター編集モード全体の UI を描画します。
 * 状態 provider と画面 shell の接続だけを担当します。
 */
const CharacterModeComponent: React.FC<CharacterModeProps> = ({ render }) => {
  return (
    <CharacterModeStateProvider>
      <CharacterModeContent render={render} />
    </CharacterModeStateProvider>
  );
};

export const CharacterMode = React.memo(CharacterModeComponent);
