import Stack from "@mui/material/Stack";
import React from "react";

interface BgModeWorkspaceProps {
  editorPanel: React.ReactNode;
  libraryPanel: React.ReactNode;
}

/**
 * bgMode の 2 ペインレイアウトだけを担当します。
 */
export const BgModeWorkspace: React.FC<BgModeWorkspaceProps> = ({
  editorPanel,
  libraryPanel,
}) => {
  return (
    <Stack
      useFlexGap
      direction={{ xs: "column", lg: "row" }}
      spacing="1rem"
      minHeight={0}
      flex={1}
      height="100%"
      role="region"
      aria-label="BG編集ワークスペース"
    >
      {libraryPanel}
      {editorPanel}
    </Stack>
  );
};
