import React from "react";
import {
  Panel,
  PanelHeader,
  PanelTitle,
  ScrollArea,
} from "../../App.styles";
import type { ScreenModeState } from "./hooks/useScreenModeState";
import { ScreenModeCharacterPanel } from "./ScreenModeCharacterPanel";
import { ScreenModeGroupMovePanel } from "./ScreenModeGroupMovePanel";
import { ScreenModeEditorContent } from "./ScreenModeLayoutPrimitives";
import { ScreenModeSelectedSpritePanel } from "./ScreenModeSelectedSpritePanel";
import { ScreenModeSpritePlacementPanel } from "./ScreenModeSpritePlacementPanel";
import { ScreenModeSummaryPanel } from "./ScreenModeSummaryPanel";

interface ScreenModeEditorPanelProps {
  screenMode: ScreenModeState;
}

/**
 * スクリーン配置の編集サイドをまとめる単一スクロール領域です。
 * 各編集セクションは意味ごとの子コンポーネントへ委譲し、スクロール責務だけをこの親に集約します。
 */
export const ScreenModeEditorPanel: React.FC<ScreenModeEditorPanelProps> = ({
  screenMode,
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
            spritesOnScreenCount={screenMode.spritesOnScreen.length}
            screenWidth={screenMode.screen.width}
            screenHeight={screenMode.screen.height}
            hasConstraintViolation={screenMode.scanReport.ok === false}
          />
          <ScreenModeCharacterPanel screenMode={screenMode} />
          <ScreenModeSpritePlacementPanel screenMode={screenMode} />
          <ScreenModeSelectedSpritePanel screenMode={screenMode} />
          <ScreenModeGroupMovePanel screenMode={screenMode} />
        </ScreenModeEditorContent>
      </ScrollArea>
    </Panel>
  );
};
