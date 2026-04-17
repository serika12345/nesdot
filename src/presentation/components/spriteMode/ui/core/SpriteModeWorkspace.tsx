import Stack from "@mui/material/Stack";
import React from "react";

interface SpriteModeWorkspaceProps {
  canvasPanel: React.ReactNode;
  editorPanel: React.ReactNode;
}

/**
 * spriteMode の 2 ペインレイアウトだけを担当します。
 */
export const SpriteModeWorkspace: React.FC<SpriteModeWorkspaceProps> = ({
  canvasPanel,
  editorPanel,
}) => {
  return (
    <Stack
      useFlexGap
      direction={{ xs: "column", lg: "row" }}
      spacing="1rem"
      minHeight={0}
      flex={1}
      height="100%"
    >
      {editorPanel}
      {canvasPanel}
    </Stack>
  );
};
