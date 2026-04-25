import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React from "react";
import { ScreenCanvas } from "../../../common/ui/canvas/ScreenCanvas";
import { type ScreenModeProjectStateResult } from "../../logic/useScreenModeProjectState";
import { type ScreenModeStagePresentationState } from "../../logic/useScreenModeStageState";
import { type ScreenModeViewportStateResult } from "../../logic/useScreenModeViewportState";
import {
  PreviewCanvasWrap,
  PreviewViewport,
} from "../primitives/ScreenModePrimitives";
import {
  createSpriteOutlineStyle,
  createStageMarqueeStyle,
  createStageSurfaceStyle,
} from "./ScreenModeGestureWorkspaceStyle";
import { type ScreenModeStageViewportUiState } from "./ScreenModeGestureWorkspaceTypes";
import styles from "./ScreenModeStageViewport.module.css";

interface ScreenModeStageViewportProps {
  screen: ScreenModeProjectStateResult["screen"];
  stageState: ScreenModeStagePresentationState;
  stageUiState: ScreenModeStageViewportUiState;
  viewportState: ScreenModeViewportStateResult;
}

export const ScreenModeStageViewport: React.FC<
  ScreenModeStageViewportProps
> = ({ screen, stageState, stageUiState, viewportState }) => {
  const ignoreBackgroundEditing = React.useCallback((): void => {}, []);
  const stageWidth = screen.width * viewportState.screenZoomLevel;
  const stageHeight = screen.height * viewportState.screenZoomLevel;

  const resolveBackgroundStagePosition = React.useCallback(
    (
      event: React.PointerEvent<HTMLDivElement>,
    ): O.Option<{ x: number; y: number }> => {
      const rect = event.currentTarget.getBoundingClientRect();
      const relativeX = event.clientX - rect.left;
      const relativeY = event.clientY - rect.top;
      const isWithinStage =
        relativeX >= 0 &&
        relativeY >= 0 &&
        relativeX < rect.width &&
        relativeY < rect.height;

      if (isWithinStage === false) {
        return O.none;
      }

      const stageX = Math.floor(relativeX / viewportState.screenZoomLevel);
      const stageY = Math.floor(relativeY / viewportState.screenZoomLevel);

      return O.some({
        x: Math.min(Math.floor(stageX / 8) * 8, screen.width - 8),
        y: Math.min(Math.floor(stageY / 8) * 8, screen.height - 8),
      });
    },
    [screen.height, screen.width, viewportState.screenZoomLevel],
  );

  const handleStagePointerDownWithBackgroundEditing = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (O.isNone(stageUiState.backgroundEditing)) {
        stageState.handlePointerDown(event);
        return;
      }

      if (event.button === 1) {
        return;
      }

      event.currentTarget.focus();
      event.preventDefault();

      pipe(
        resolveBackgroundStagePosition(event),
        O.map((position) => {
          pipe(
            stageUiState.backgroundEditing,
            O.match(ignoreBackgroundEditing, (backgroundEditing) => {
              backgroundEditing.onPointerDown(position, event.button);
            }),
          );
        }),
      );
    },
    [
      ignoreBackgroundEditing,
      resolveBackgroundStagePosition,
      stageState,
      stageUiState.backgroundEditing,
    ],
  );

  const handleStagePointerMoveWithBackgroundEditing = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (O.isNone(stageUiState.backgroundEditing)) {
        stageState.handlePointerMove(event);
        return;
      }

      pipe(
        resolveBackgroundStagePosition(event),
        O.map((position) => {
          pipe(
            stageUiState.backgroundEditing,
            O.match(ignoreBackgroundEditing, (backgroundEditing) => {
              backgroundEditing.onPointerMove(position, event.buttons);
            }),
          );
        }),
      );
    },
    [
      ignoreBackgroundEditing,
      resolveBackgroundStagePosition,
      stageState,
      stageUiState.backgroundEditing,
    ],
  );

  const handleStagePointerEndWithBackgroundEditing = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (O.isNone(stageUiState.backgroundEditing)) {
        stageState.handlePointerEnd(event);
        return;
      }

      pipe(
        stageUiState.backgroundEditing,
        O.match(ignoreBackgroundEditing, (backgroundEditing) => {
          backgroundEditing.onPointerUp();
        }),
      );
    },
    [ignoreBackgroundEditing, stageState, stageUiState.backgroundEditing],
  );

  const handleStageClick = React.useMemo(
    () =>
      pipe(
        stageUiState.backgroundEditing,
        O.match(
          () => ignoreBackgroundEditing,
          (backgroundEditing) => backgroundEditing.onClick,
        ),
      ),
    [ignoreBackgroundEditing, stageUiState.backgroundEditing],
  );

  const handleStageContextMenuWithBackgroundEditing = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (O.isNone(stageUiState.backgroundEditing)) {
        stageState.handleContextMenu(event);
        return;
      }

      event.preventDefault();
    },
    [stageState, stageUiState.backgroundEditing],
  );

  return (
    <div className={styles.root}>
      <PreviewViewport
        ref={viewportState.setViewportRef}
        aria-label="画面プレビューキャンバスビュー"
        onWheel={viewportState.handleViewportWheel}
        onPointerDown={viewportState.handleViewportPointerDown}
        onPointerMove={viewportState.handleViewportPointerMove}
        onPointerUp={viewportState.handleViewportPointerEnd}
        onPointerCancel={viewportState.handleViewportPointerEnd}
        onMouseDown={(event: React.MouseEvent<HTMLDivElement>) => {
          if (event.button === 1) {
            event.preventDefault();
          }
        }}
        active={O.isSome(viewportState.viewportPanState)}
      >
        <PreviewCanvasWrap>
          <div
            ref={stageState.setStageRef}
            aria-label="スクリーン配置ステージ"
            tabIndex={0}
            onContextMenu={handleStageContextMenuWithBackgroundEditing}
            onKeyDown={stageUiState.handleKeyDown}
            onPointerDown={handleStagePointerDownWithBackgroundEditing}
            onPointerMove={handleStagePointerMoveWithBackgroundEditing}
            onPointerUp={handleStagePointerEndWithBackgroundEditing}
            onPointerCancel={handleStagePointerEndWithBackgroundEditing}
            onClick={handleStageClick}
            data-stage-sprite-count={screen.sprites.length}
            data-selected-sprite-count={stageState.selectedSpriteCount}
            data-stage-sprite-layout={stageState.spriteLayout}
            style={createStageSurfaceStyle(
              stageWidth,
              stageHeight,
              stageState.isDragging,
            )}
          >
            <ScreenCanvas
              ariaLabel="画面プレビューキャンバス"
              scale={viewportState.screenZoomLevel}
              showGrid={true}
            />

            <div aria-hidden="true" className={styles.interactionLayer}>
              {screen.sprites.map((sprite, index) => (
                <div
                  key={`screen-stage-sprite-outline-${index}`}
                  data-stage-sprite-outline="true"
                  style={createSpriteOutlineStyle(
                    sprite.x,
                    sprite.y,
                    sprite.width,
                    sprite.height,
                    viewportState.screenZoomLevel,
                    stageUiState.displayState.isSpriteOutlineVisible,
                    stageState.selectedSpriteIndices.has(index),
                  )}
                >
                  {stageUiState.displayState.isSpriteIndexVisible === true ? (
                    <span className={styles.spriteIndex}>{`#${index}`}</span>
                  ) : (
                    <></>
                  )}
                </div>
              ))}

              {pipe(
                stageState.marqueeRect,
                O.match(
                  () => <></>,
                  (rect) => (
                    <div
                      style={createStageMarqueeStyle(
                        rect.x,
                        rect.y,
                        rect.width,
                        rect.height,
                        viewportState.screenZoomLevel,
                      )}
                    />
                  ),
                ),
              )}
            </div>

            {pipe(
              stageUiState.backgroundEditing,
              O.match(
                () => <></>,
                (backgroundEditing) => backgroundEditing.overlay,
              ),
            )}
          </div>
        </PreviewCanvasWrap>
      </PreviewViewport>
    </div>
  );
};
