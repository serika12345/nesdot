import { Stack } from "@mui/material";
import { styled } from "@mui/material/styles";
import * as O from "fp-ts/Option";
import React from "react";
import { Panel } from "../../../App.styles";
import {
  emptyFileMenuState,
  type FileMenuState,
} from "../../common/state/fileMenuState";
import { CharacterModeDecompositionRegionMenu } from "../decomposition/CharacterModeDecompositionRegionMenu";
import { CharacterWorkspaceRoot } from "../primitives/CharacterModePrimitives";
import { CharacterModeSetDraftFields } from "../set/CharacterModeSetDraftFields";
import { CharacterModeSetSelectionFields } from "../set/CharacterModeSetSelectionFields";
import { CharacterModeSidebarEditorModeCard } from "../sidebar/CharacterModeSidebarEditorModeCard";
import { CharacterModeSidebarSpriteSizeCard } from "../sidebar/CharacterModeSidebarSpriteSizeCard";
import { CharacterModeSpriteMenu } from "../menu/CharacterModeSpriteMenu";
import {
  useCharacterModeProjectActions,
  useCharacterModeWorkspaceEvents,
} from "./CharacterModeStateProvider";
import { CharacterModeWorkspace } from "./CharacterModeWorkspace";

const ControlRow = styled(Stack)(({ theme }) => ({
  width: "100%",
  minWidth: 0,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(1),
  flexWrap: "wrap",
}));

const PrimaryActionGroup = styled(Stack)(({ theme }) => ({
  minWidth: 0,
  flexDirection: "row",
  alignItems: "center",
  gap: theme.spacing(1),
  flexWrap: "wrap",
}));

const SetActionGroup = styled(Stack)(({ theme }) => ({
  minWidth: 0,
  flex: "1 1 24rem",
  flexDirection: "row",
  alignItems: "flex-end",
  justifyContent: "flex-end",
  gap: theme.spacing(1),
}));

interface CharacterModeScreenProps {
  onFileMenuStateChange: (fileMenuState: FileMenuState) => void;
}

/**
 * キャラクター編集画面の shell を描画します。
 * 操作列、ワークスペース、コンテキストメニューの配置だけを担当します。
 */
export const CharacterModeScreen: React.FC<CharacterModeScreenProps> = ({
  onFileMenuStateChange,
}) => {
  const { projectActions } = useCharacterModeProjectActions();
  const workspaceEvents = useCharacterModeWorkspaceEvents();

  const fileMenuState = React.useMemo<FileMenuState>(
    () => ({
      shareActions: projectActions,
      restoreAction: O.none,
    }),
    [projectActions],
  );

  React.useEffect(() => {
    onFileMenuStateChange(fileMenuState);
  }, [fileMenuState, onFileMenuStateChange]);

  React.useEffect(() => {
    return () => {
      onFileMenuStateChange(emptyFileMenuState);
    };
  }, [onFileMenuStateChange]);

  return (
    <Panel flex={1} minHeight={0} height="100%">
      <CharacterWorkspaceRoot
        flex={1}
        onPointerDownCapture={workspaceEvents.handleWorkspacePointerDownCapture}
        onPointerMoveCapture={workspaceEvents.handleWorkspacePointerMove}
        onPointerUpCapture={workspaceEvents.handleWorkspacePointerEnd}
        onPointerCancelCapture={workspaceEvents.handleWorkspacePointerEnd}
      >
        <ControlRow>
          <PrimaryActionGroup>
            <CharacterModeSidebarEditorModeCard />
            <CharacterModeSidebarSpriteSizeCard />
            <CharacterModeSetDraftFields />
          </PrimaryActionGroup>
          <SetActionGroup>
            <CharacterModeSetSelectionFields />
          </SetActionGroup>
        </ControlRow>
        <CharacterModeWorkspace />
        <CharacterModeSpriteMenu />
        <CharacterModeDecompositionRegionMenu />
      </CharacterWorkspaceRoot>
    </Panel>
  );
};
