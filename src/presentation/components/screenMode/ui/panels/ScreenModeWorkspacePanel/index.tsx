import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React from "react";
import { useProjectState } from "../../../../../../application/state/projectStore";
import { decodeBackgroundTileAtIndex } from "../../../../../../domain/nes/backgroundEditing";
import { createEmptyBackgroundTile } from "../../../../../../domain/project/projectV2";
import {
  Badge,
  DetailKey,
  DetailRow,
  DetailValue,
  Panel,
  Spacer,
  ToolButton,
} from "../../../../../App.styles";
import {
  emptyFileMenuState,
  type FileMenuState,
} from "../../../../common/logic/state/fileMenuState";
import { ScreenModeBackgroundTilePickerDialog } from "../../dialogs/ScreenModeBackgroundTilePickerDialog";
import type { ScreenModeState } from "../../../logic/hooks/useScreenModeState";
import { ScreenModeBackgroundPlacementMockOverlay } from "../../overlays/ScreenModeBackgroundPlacementMockOverlay";
import {
  WarningList,
  WorkspaceHeaderActionCluster,
  ZoomControlsRow,
} from "../../primitives/ScreenModePrimitives";
import { ScreenModeGestureWorkspace } from "../ScreenModeGestureWorkspace";
import { useScreenModeWorkspaceBackgroundEditingState } from "../../../logic/panels/ScreenModeWorkspacePanel/backgroundEditingState";

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
  const nes = useProjectState((state) => state.nes);
  const [isSpriteOutlineVisible, setIsSpriteOutlineVisible] =
    React.useState(true);
  const [isSpriteIndexVisible, setIsSpriteIndexVisible] = React.useState(false);
  const backgroundEditingState = useScreenModeWorkspaceBackgroundEditingState();

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

  const grabbedBackgroundTile = React.useMemo(() => {
    if (O.isNone(backgroundEditingState.grabbedTileIndex)) {
      return O.none;
    }

    const decodedTile = decodeBackgroundTileAtIndex(
      nes.chrBytes,
      backgroundEditingState.grabbedTileIndex.value,
    );

    return O.some(
      E.isRight(decodedTile) ? decodedTile.right : createEmptyBackgroundTile(),
    );
  }, [backgroundEditingState.grabbedTileIndex, nes.chrBytes]);

  const grabbedTilePreview =
    backgroundEditingState.editingTarget === "bgTile" &&
    O.isSome(grabbedBackgroundTile)
      ? O.some(grabbedBackgroundTile.value)
      : O.none;

  const backgroundPlacementMockOverlay = pipe(
    backgroundEditingState.cursorOverlay,
    O.match(
      () => <></>,
      (overlayState) =>
        O.isSome(grabbedTilePreview) ? (
          <ScreenModeBackgroundPlacementMockOverlay
            placement={overlayState}
            preview={{
              kind: "tile",
              palette:
                nes.backgroundPalettes[
                  backgroundEditingState.activePaletteIndex
                ],
              tile: grabbedTilePreview.value,
              universalBackgroundColor: nes.universalBackgroundColor,
            }}
            screenZoomLevel={screenZoomLevel}
          />
        ) : (
          <ScreenModeBackgroundPlacementMockOverlay
            placement={overlayState}
            preview={{ kind: "none" }}
            screenZoomLevel={screenZoomLevel}
          />
        ),
    ),
  );
  const backgroundEditingProps =
    backgroundEditingState.editingTarget !== "sprite"
      ? {
          backgroundEditing: {
            overlay: backgroundPlacementMockOverlay,
            onClick: backgroundEditingState.handleStageClick,
            onPointerDown: backgroundEditingState.handleStagePointerDown,
            onPointerMove: backgroundEditingState.handleStagePointerMove,
            onPointerUp: backgroundEditingState.handleStagePointerUp,
          },
        }
      : {};

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
        <WorkspaceHeaderActionCluster>
          <ToolButton
            type="button"
            aria-label="BGタイル追加"
            onClick={backgroundEditingState.openTilePicker}
          >
            BGタイル追加
          </ToolButton>
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
        </WorkspaceHeaderActionCluster>
      </ZoomControlsRow>

      <ScreenModeGestureWorkspace
        screenMode={screenMode}
        isSpriteOutlineVisible={isSpriteOutlineVisible}
        isSpriteIndexVisible={isSpriteIndexVisible}
        {...backgroundEditingProps}
      />

      <ScreenModeBackgroundTilePickerDialog
        activePaletteIndex={backgroundEditingState.activePaletteIndex}
        open={backgroundEditingState.isTilePickerOpen}
        onClose={backgroundEditingState.closeTilePicker}
        onPaletteSelect={backgroundEditingState.handleBackgroundPaletteSelect}
        onTileSelect={backgroundEditingState.handleBackgroundTileSelect}
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
