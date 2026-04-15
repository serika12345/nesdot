import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import * as O from "fp-ts/Option";
import React from "react";
import {
  APP_CANVAS_VIEWPORT_CLASS_NAME,
  APP_PANEL_CLASS_NAME,
} from "../../../../../styleClassNames";
import {
  emptyFileMenuState,
  type FileMenuState,
} from "../../../../common/logic/state/fileMenuState";
import { SpriteModeCanvasSurface } from "../../canvas/SpriteModeCanvasSurface";
import {
  useSpriteModePaletteSlots,
  useSpriteModeProjectActions,
} from "../../core/SpriteModeStateProvider";
import { SpriteModePaletteSlots } from "../../forms/SpriteModePaletteSlots";
import { SpriteModeToolOverlay } from "../../overlay/SpriteModeToolOverlay";

interface SpriteModeCanvasPanelProps {
  onFileMenuStateChange: (fileMenuState: FileMenuState) => void;
}

/**
 * スプライト編集の右ペインです。
 * 色スロット、ツール、canvas を 1 つの編集面としてまとめます。
 */
export const SpriteModeCanvasPanel: React.FC<SpriteModeCanvasPanelProps> = ({
  onFileMenuStateChange,
}) => {
  const projectActions = useSpriteModeProjectActions();
  const paletteSlots = useSpriteModePaletteSlots();

  const fileMenuState = React.useMemo<FileMenuState>(
    () => ({
      shareActions: projectActions.projectActions,
      restoreAction: O.some({
        label: "復元",
        onSelect: projectActions.handleImport,
      }),
    }),
    [projectActions.handleImport, projectActions.projectActions],
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
    <Stack
      component="div"
      className={APP_PANEL_CLASS_NAME}
      spacing="0.875rem"
      p="1.125rem"
      role="region"
      aria-label="スプライトキャンバスパネル"
      flex={1}
      minHeight={0}
    >
      <SpriteModePaletteSlots
        activePalette={paletteSlots.activePalette}
        activeSlot={paletteSlots.activeSlot}
        palettes={paletteSlots.palettes}
        onPaletteClick={paletteSlots.handlePaletteClick}
      />

      <Box
        className={APP_CANVAS_VIEWPORT_CLASS_NAME}
        flex={1}
        minHeight={0}
        overflow="auto"
        p="1.125rem"
      >
        <SpriteModeToolOverlay />
        <SpriteModeCanvasSurface />
      </Box>
    </Stack>
  );
};
