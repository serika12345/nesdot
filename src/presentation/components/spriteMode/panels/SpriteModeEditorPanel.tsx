import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import React from "react";
import {
  Panel,
  PanelHeader,
  PanelTitle,
  ScrollArea,
} from "../../../App.styles";
import { useSpriteModeProjectSpriteSize } from "../core/SpriteModeStateProvider";
import { SpriteModeEditorSelectionFields } from "../forms/SpriteModeEditorSelectionFields";

/**
 * スプライト番号とパレットを切り替える編集サイドパネルです。
 * 現在操作中の対象を明示し、キャンバス編集前の基本設定をまとめて扱えるようにします。
 */
export const SpriteModeEditorPanel: React.FC = () => {
  const spriteSize = useSpriteModeProjectSpriteSize();

  return (
    <Panel role="region" aria-label="スプライト編集パネル" minHeight={0}>
      <PanelHeader>
        <PanelTitle>スプライト編集</PanelTitle>
      </PanelHeader>

      <Stack component={ScrollArea} spacing={2} flex={1} minHeight={0}>
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
    </Panel>
  );
};
