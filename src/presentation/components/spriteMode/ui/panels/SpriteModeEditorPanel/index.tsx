import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import React from "react";
import { useSpriteModeProjectSpriteSize } from "../../core/SpriteModeStateProvider";
import { SpriteModeEditorSelectionFields } from "../../forms/SpriteModeEditorSelectionFields";

/**
 * スプライト番号とパレットを切り替える編集サイドパネルです。
 * 現在操作中の対象を明示し、キャンバス編集前の基本設定をまとめて扱えるようにします。
 */
export const SpriteModeEditorPanel: React.FC = () => {
  const spriteSize = useSpriteModeProjectSpriteSize();

  return (
    <Stack
      component={Paper}
      variant="outlined"
      spacing="0.875rem"
      p="1.125rem"
      role="region"
      aria-label="スプライト編集パネル"
      minHeight={0}
    >
      <Stack position="relative" zIndex={1} spacing="0.3125rem" useFlexGap>
        <Typography component="h2" variant="h2" color="text.primary">
          スプライト編集
        </Typography>
      </Stack>

      <Box
        flex={1}
        minHeight={0}
        overflow="auto"
        mr={-2.25}
        pr={2.25}
        style={{ scrollbarGutter: "stable" }}
      >
        <Stack spacing={2} useFlexGap>
          <SpriteModeEditorSelectionFields />

          <Chip
            color="primary"
            variant="outlined"
            label={
              spriteSize.projectSpriteSize === 8
                ? "Project Sprite Size 8x8"
                : "Project Sprite Size 8x16"
            }
          />
        </Stack>
      </Box>
    </Stack>
  );
};
