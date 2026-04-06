import React from "react";
import {
  Panel,
  PanelHeader,
  PanelHeaderRow,
  PanelTitle,
} from "../../App.styles";
import { ProjectActions } from "../common/ProjectActions";
import { CharacterModeDecompositionRegionMenu } from "./CharacterModeDecompositionRegionMenu";
import { CharacterWorkspaceRoot } from "./CharacterModeLayoutPrimitives";
import { CharacterModeSetHeader } from "./CharacterModeSetHeader";
import { CharacterModeSpriteMenu } from "./CharacterModeSpriteMenu";
import {
  useCharacterModeProjectActions,
  useCharacterModeWorkspaceEvents,
} from "./CharacterModeStateProvider";
import { CharacterModeWorkspace } from "./CharacterModeWorkspace";

/**
 * キャラクター編集画面の shell を描画します。
 * ヘッダー、ワークスペース、コンテキストメニューの配置だけを担当します。
 */
export const CharacterModeScreen: React.FC = () => {
  const { projectActions } = useCharacterModeProjectActions();
  const workspaceEvents = useCharacterModeWorkspaceEvents();

  return (
    <Panel flex={1} minHeight={0} height="100%">
      <PanelHeader>
        <PanelHeaderRow>
          <PanelTitle>キャラクター編集</PanelTitle>
          <ProjectActions actions={projectActions} />
        </PanelHeaderRow>
      </PanelHeader>

      <CharacterWorkspaceRoot
        flex={1}
        onPointerDownCapture={workspaceEvents.handleWorkspacePointerDownCapture}
        onPointerMoveCapture={workspaceEvents.handleWorkspacePointerMove}
        onPointerUpCapture={workspaceEvents.handleWorkspacePointerEnd}
        onPointerCancelCapture={workspaceEvents.handleWorkspacePointerEnd}
      >
        <CharacterModeSetHeader />
        <CharacterModeWorkspace />
        <CharacterModeSpriteMenu />
        <CharacterModeDecompositionRegionMenu />
      </CharacterWorkspaceRoot>
    </Panel>
  );
};
