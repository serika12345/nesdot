import { Stack } from "@mui/material";
import React from "react";
import {
  CanvasViewport,
  Panel,
  PanelHeader,
  PanelHeaderRow,
  PanelTitle,
} from "../../App.styles";
import { ProjectActions } from "../common/ProjectActions";
import { SpriteModeCanvasSurface } from "./SpriteModeCanvasSurface";
import { SpriteModePaletteSlots } from "./SpriteModePaletteSlots";
import {
  useSpriteModePaletteSlots,
  useSpriteModeProjectActions,
} from "./SpriteModeStateProvider";
import { SpriteModeToolOverlay } from "./SpriteModeToolOverlay";

/**
 * スプライト編集の右ペインです。
 * 共有操作、色スロット、ツール、canvas を 1 つの編集面としてまとめます。
 */
export const SpriteModeCanvasPanel: React.FC = () => {
  const projectActions = useSpriteModeProjectActions();
  const paletteSlots = useSpriteModePaletteSlots();

  return (
    <Panel
      role="region"
      aria-label="スプライトキャンバスパネル"
      flex={1}
      minHeight={0}
    >
      <PanelHeader>
        <PanelHeaderRow>
          <PanelTitle>スプライトキャンバス</PanelTitle>
          <Stack direction="row" spacing={1} useFlexGap alignItems="center">
            <ProjectActions
              actions={projectActions.projectActions}
              onImport={projectActions.handleImport}
            />
          </Stack>
        </PanelHeaderRow>
      </PanelHeader>

      <SpriteModePaletteSlots
        activePalette={paletteSlots.activePalette}
        activeSlot={paletteSlots.activeSlot}
        palettes={paletteSlots.palettes}
        onPaletteClick={paletteSlots.handlePaletteClick}
      />

      <CanvasViewport flex={1} minHeight={0}>
        <SpriteModeToolOverlay />
        <SpriteModeCanvasSurface />
      </CanvasViewport>
    </Panel>
  );
};
