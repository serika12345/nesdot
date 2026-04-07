import * as O from "fp-ts/Option";
import React from "react";
import {
  Badge,
  DetailKey,
  DetailRow,
  DetailValue,
  Panel,
  Spacer,
  ToolButton,
} from "../../../App.styles";
import {
  emptyFileMenuState,
  type FileMenuState,
} from "../../common/state/fileMenuState";
import type { ScreenModeState } from "../hooks/useScreenModeState";
import {
  WarningList,
  ZoomControlsRow,
} from "../primitives/ScreenModePrimitives";
import { ScreenModeGestureWorkspace } from "./ScreenModeGestureWorkspace";

interface ScreenModeWorkspacePanelProps {
  screenMode: ScreenModeState;
  onFileMenuStateChange: (fileMenuState: FileMenuState) => void;
}

/**
 * スクリーン配置モードのワークスペース全体を描画します。
 * ファイルメニュー状態連携と上部操作列のオーケストレーションを担当します。
 */
export const ScreenModeWorkspacePanel: React.FC<
  ScreenModeWorkspacePanelProps
> = ({ screenMode, onFileMenuStateChange }) => {
  const [isSpriteOutlineVisible, setIsSpriteOutlineVisible] =
    React.useState(true);
  const [isSpriteIndexVisible, setIsSpriteIndexVisible] = React.useState(false);

  const {
    projectActions,
    handleImport,
    screenZoomLevel,
    screen,
    scanReport,
    gestureSelectedSpriteCount,
    handleZoomOut,
    handleZoomIn,
    handleWorkspacePointerDownCapture,
    handleWorkspacePointerMoveCapture,
    handleWorkspacePointerEndCapture,
  } = screenMode;

  const fileMenuState = React.useMemo<FileMenuState>(
    () => ({
      shareActions: projectActions,
      restoreAction: O.some({
        label: "復元",
        onSelect: handleImport,
      }),
    }),
    [handleImport, projectActions],
  );

  React.useEffect(() => {
    onFileMenuStateChange(fileMenuState);
  }, [fileMenuState, onFileMenuStateChange]);

  React.useEffect(() => {
    return () => {
      onFileMenuStateChange(emptyFileMenuState);
    };
  }, [onFileMenuStateChange]);

  const handleWorkspaceContextMenuCapture = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.preventDefault();
    },
    [],
  );

  return (
    <Panel
      flex={1}
      minHeight={0}
      role="region"
      aria-label="スクリーン配置ジェスチャーワークスペース"
      onContextMenuCapture={handleWorkspaceContextMenuCapture}
      onPointerDownCapture={handleWorkspacePointerDownCapture}
      onPointerMoveCapture={handleWorkspacePointerMoveCapture}
      onPointerUpCapture={handleWorkspacePointerEndCapture}
      onPointerCancelCapture={handleWorkspacePointerEndCapture}
    >
      <ZoomControlsRow>
        <Badge tone="neutral">{`${screenZoomLevel}x`}</Badge>
        <ToolButton
          type="button"
          aria-label="画面ズーム縮小"
          onClick={handleZoomOut}
        >
          -
        </ToolButton>
        <ToolButton
          type="button"
          aria-label="画面ズーム拡大"
          onClick={handleZoomIn}
        >
          +
        </ToolButton>
        <Badge tone="neutral">{`${screen.sprites.length} sprites`}</Badge>
        <Badge tone="accent">{`${gestureSelectedSpriteCount} selected`}</Badge>
        <Spacer />
        <ToolButton
          type="button"
          active={isSpriteOutlineVisible}
          aria-label="スプライト外枠表示切り替え"
          onClick={() =>
            setIsSpriteOutlineVisible((previous) => previous === false)
          }
        >
          外枠
        </ToolButton>
        <ToolButton
          type="button"
          active={isSpriteIndexVisible}
          aria-label="スプライト番号表示切り替え"
          onClick={() =>
            setIsSpriteIndexVisible((previous) => previous === false)
          }
        >
          #表示
        </ToolButton>
      </ZoomControlsRow>

      <ScreenModeGestureWorkspace
        screenMode={screenMode}
        isSpriteOutlineVisible={isSpriteOutlineVisible}
        isSpriteIndexVisible={isSpriteIndexVisible}
      />

      {scanReport.ok === false ? (
        <WarningList>
          {scanReport.errors.map((error) => (
            <DetailRow key={error}>
              <DetailKey>警告</DetailKey>
              <DetailValue>{error}</DetailValue>
            </DetailRow>
          ))}
        </WarningList>
      ) : (
        <></>
      )}
    </Panel>
  );
};
