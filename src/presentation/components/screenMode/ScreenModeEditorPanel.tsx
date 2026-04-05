import React from "react";
import {
  Panel,
  PanelHeader,
  PanelTitle,
  ScrollArea,
} from "../../App.styles";
import type { ScreenModeController } from "./hooks/useScreenModeController";
import { ScreenModeCharacterPanel } from "./ScreenModeCharacterPanel";
import { ScreenModeGroupMovePanel } from "./ScreenModeGroupMovePanel";
import { ScreenModeEditorContent } from "./ScreenModeLayoutPrimitives";
import { ScreenModeSelectedSpritePanel } from "./ScreenModeSelectedSpritePanel";
import { ScreenModeSpritePlacementPanel } from "./ScreenModeSpritePlacementPanel";
import { ScreenModeSummaryPanel } from "./ScreenModeSummaryPanel";

interface ScreenModeEditorPanelProps {
  controller: ScreenModeController;
}

/**
 * スクリーン配置の編集サイドをまとめる単一スクロール領域です。
 * 各編集セクションは意味ごとの子コンポーネントへ委譲し、スクロール責務だけをこの親に集約します。
 */
export const ScreenModeEditorPanel: React.FC<ScreenModeEditorPanelProps> = ({
  controller,
}) => {
  return (
    <Panel
      width={{ lg: "20rem", xl: "22.5rem" }}
      flexShrink={0}
      minHeight={0}
    >
      <PanelHeader>
        <PanelTitle>スクリーン配置</PanelTitle>
      </PanelHeader>

      <ScrollArea
        flex={1}
        minHeight={0}
        role="region"
        aria-label="スクリーン配置編集パネル"
      >
        <ScreenModeEditorContent>
          <ScreenModeSummaryPanel
            spritesOnScreenCount={controller.spritesOnScreen.length}
            screenWidth={controller.screen.width}
            screenHeight={controller.screen.height}
            hasConstraintViolation={controller.scanReport.ok === false}
          />
          <ScreenModeCharacterPanel controller={controller} />
          <ScreenModeSpritePlacementPanel controller={controller} />
          <ScreenModeSelectedSpritePanel controller={controller} />
          <ScreenModeGroupMovePanel controller={controller} />
        </ScreenModeEditorContent>
      </ScrollArea>
    </Panel>
  );
};
