import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import React from "react";
import {
  APP_PANEL_CLASS_NAME,
  APP_PANEL_TITLE_CLASS_NAME,
  APP_SCROLL_AREA_CLASS_NAME,
} from "../../../../../styleClassNames";
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
      component="div"
      className={APP_PANEL_CLASS_NAME}
      spacing="0.875rem"
      p="1.125rem"
      role="region"
      aria-label="スプライト編集パネル"
      minHeight={0}
    >
      <Stack position="relative" zIndex={1} spacing="0.3125rem" useFlexGap>
        <Box component="h2" className={APP_PANEL_TITLE_CLASS_NAME} m={0}>
          スプライト編集
        </Box>
      </Stack>

      <Box
        className={APP_SCROLL_AREA_CLASS_NAME}
        flex={1}
        minHeight={0}
        overflow="auto"
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
