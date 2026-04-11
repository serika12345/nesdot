import * as O from "fp-ts/Option";
import React from "react";
import { CanvasViewport, Panel } from "../../../../../App.styles";
import {
  emptyFileMenuState,
  type FileMenuState,
} from "../../../../common/logic/state/fileMenuState";
import { SpriteModeCanvasSurface } from "../../canvas/SpriteModeCanvasSurface";
import { SpriteModePaletteSlots } from "../../forms/SpriteModePaletteSlots";
import {
  useSpriteModePaletteSlots,
  useSpriteModeProjectActions,
} from "../../core/SpriteModeStateProvider";
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
    <Panel
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

      <CanvasViewport flex={1} minHeight={0}>
        <SpriteModeToolOverlay />
        <SpriteModeCanvasSurface />
      </CanvasViewport>
    </Panel>
  );
};
