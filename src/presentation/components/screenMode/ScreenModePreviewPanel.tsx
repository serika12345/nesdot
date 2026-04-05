import React from "react";
import * as O from "fp-ts/Option";
import {
  Badge,
  DetailKey,
  DetailRow,
  DetailValue,
  Panel,
  PanelHeader,
  PanelHeaderRow,
  PanelTitle,
  ToolButton,
} from "../../App.styles";
import { ProjectActions } from "../common/ProjectActions";
import { ScreenCanvas } from "../common/ScreenCanvas";
import type { ScreenModeController } from "./hooks/useScreenModeController";
import {
  PreviewCanvasWrap,
  PreviewViewport,
  WarningList,
  ZoomControlsRow,
} from "./ScreenModeLayoutPrimitives";

interface ScreenModePreviewPanelProps {
  controller: ScreenModeController;
}

/**
 * 画面プレビューとズーム、書き出し導線をまとめるパネルです。
 */
export const ScreenModePreviewPanel: React.FC<ScreenModePreviewPanelProps> = ({
  controller,
}) => {
  const {
    screenZoomLevel,
    viewportPanState,
    scanReport,
    projectActions,
    setViewportRef,
    handleImport,
    handleZoomOut,
    handleZoomIn,
    handleViewportWheel,
    handleViewportPointerDown,
    handleViewportPointerMove,
    handleViewportPointerEnd,
  } = controller;

  return (
    <Panel flex={1} minHeight={0}>
      <PanelHeader>
        <PanelHeaderRow>
          <PanelTitle>画面プレビュー</PanelTitle>
          <ProjectActions actions={projectActions} onImport={handleImport} />
        </PanelHeaderRow>

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
        </ZoomControlsRow>
      </PanelHeader>

      <PreviewViewport
        ref={setViewportRef}
        aria-label="画面プレビューキャンバスビュー"
        onWheel={handleViewportWheel}
        onPointerDown={handleViewportPointerDown}
        onPointerMove={handleViewportPointerMove}
        onPointerUp={handleViewportPointerEnd}
        onPointerCancel={handleViewportPointerEnd}
        onMouseDown={(event: React.MouseEvent<HTMLDivElement>) => {
          if (event.button === 1) {
            event.preventDefault();
          }
        }}
        active={O.isSome(viewportPanState)}
      >
        <PreviewCanvasWrap>
          <ScreenCanvas
            ariaLabel="画面プレビューキャンバス"
            scale={screenZoomLevel}
            showGrid={true}
          />
        </PreviewCanvasWrap>
      </PreviewViewport>

      {scanReport.ok === false && (
        <WarningList>
          {scanReport.errors.map((error) => (
            <DetailRow key={error}>
              <DetailKey>警告</DetailKey>
              <DetailValue>{error}</DetailValue>
            </DetailRow>
          ))}
        </WarningList>
      )}
    </Panel>
  );
};
