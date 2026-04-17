import Box from "@mui/material/Box";
import React from "react";
import { CharacterComposeWorkspaceGrid } from "../primitives/CharacterModePrimitives";
import {
  workspaceLockMessageStyle,
  workspaceLockOverlayStyle,
} from "./CharacterModeWorkspaceStyle";

interface CharacterModeWorkspaceProps {
  isWorkspaceLocked: boolean;
  sidebarContent: React.ReactNode;
  workspaceContent: React.ReactNode;
}

/**
 * CharacterMode のワークスペースレイアウトとロックオーバーレイだけを担当します。
 */
export const CharacterModeWorkspace: React.FC<CharacterModeWorkspaceProps> = ({
  isWorkspaceLocked,
  sidebarContent,
  workspaceContent,
}) => {
  return (
    <Box
      position="relative"
      minHeight={0}
      minWidth={0}
      flex="1 1 0"
      display="flex"
    >
      <CharacterComposeWorkspaceGrid
        aria-label="キャラクター編集ワークスペース"
        aria-disabled={isWorkspaceLocked}
        flex={1}
      >
        {sidebarContent}
        {workspaceContent}
      </CharacterComposeWorkspaceGrid>

      {isWorkspaceLocked === true ? (
        <Box
          aria-label="キャラクター編集ロックオーバーレイ"
          position="absolute"
          top={0}
          right={0}
          bottom={0}
          left={0}
          zIndex={14}
          display="flex"
          alignItems="center"
          justifyContent="center"
          borderRadius="1.25rem"
          border="0.0625rem solid rgba(148, 163, 184, 0.26)"
          bgcolor="rgba(248, 250, 252, 0.76)"
          style={workspaceLockOverlayStyle}
        >
          <Box component="div" style={workspaceLockMessageStyle}>
            セットを作成すると編集できます
          </Box>
        </Box>
      ) : (
        <></>
      )}
    </Box>
  );
};
