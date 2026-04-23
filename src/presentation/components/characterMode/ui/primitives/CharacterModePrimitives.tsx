import { Button } from "@radix-ui/themes";
import React from "react";
import { mergeClassNames } from "../../../../styleClassNames";
import { CharacterModeEditorCard } from "../editor/CharacterModeEditorCard";
import {
  createCharacterStageViewportStyle,
  createDecompositionCanvasStyle,
  createEmptyTilePreviewStyle,
  createFloatingLibraryPreviewStyle,
  createPixelPreviewCellStyle,
  createPortalOverlayStyle,
  createPositionedActionMenuStyle,
  createRegionOverlayButtonStyle,
  createStageDragPreviewStyle,
  createStageSurfaceStyle,
} from "./CharacterModePrimitivesStyle";
import styles from "./CharacterModePrimitives.module.css";

export type DecompositionTool = "pen" | "eraser" | "region";

type CharacterStageViewportProps = React.HTMLAttributes<HTMLDivElement> & {
  readonly dragging?: boolean;
};

type DecompositionCanvasElementProps = React.ComponentProps<"canvas"> & {
  readonly cursorStyle: string;
};

type StageDragPreviewProps = React.ComponentProps<"div"> & {
  readonly previewLeft: number;
  readonly previewTop: number;
};

type RegionOverlayButtonProps = React.ComponentProps<"button"> & {
  readonly issueState?: boolean;
  readonly regionHeightPx: number;
  readonly regionLeft: number;
  readonly regionScale: number;
  readonly regionTop: number;
  readonly selectedState?: boolean;
  readonly toolMode: DecompositionTool;
};

type FloatingLibraryPreviewProps = React.ComponentProps<"div"> & {
  readonly dragClientX: number;
  readonly dragClientY: number;
};

type PositionedActionMenuProps = React.HTMLAttributes<HTMLDivElement> & {
  readonly menuLeft: number;
  readonly menuTop: number;
  readonly menuWidth: number;
  readonly ready: boolean;
};

type PositionedActionMenuButtonProps = React.ComponentProps<typeof Button> & {
  readonly danger?: boolean;
};

type EmptyTilePreviewProps = React.ComponentProps<"div"> & {
  readonly previewHeight: number;
  readonly previewWidth: number;
};

type PixelPreviewCellProps = React.ComponentProps<"div"> & {
  readonly colorHex: string;
  readonly pixelSize: number;
};

type StageSurfaceProps = React.ComponentProps<"div"> & {
  readonly activeDrop?: boolean;
  readonly stageHeightPx: number;
  readonly stageScale: number;
  readonly stageWidthPx: number;
};

const toBooleanDataValue = (value?: boolean): "true" | "false" =>
  value === true ? "true" : "false";

const createLayout = (
  baseClassName: string,
): React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>
> => {
  return React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    function LayoutComponent({ className, ...props }, ref) {
      return (
        <div
          {...props}
          ref={ref}
          className={mergeClassNames(baseClassName, className ?? false)}
        />
      );
    },
  );
};

export const StageInputContainer = createLayout(
  styles.stageInputContainer ?? "",
);

export const PaletteControlContainer = createLayout(
  styles.paletteControlContainer ?? "",
);

export const CharacterComposeWorkspaceGrid = createLayout(
  styles.characterWorkspaceRoot ?? "",
);

export const PreviewHeaderLayout = createLayout(
  styles.previewHeaderLayout ?? "",
);

export const PreviewControlsRow = createLayout(styles.previewControlsRow ?? "");

export const DecompositionToolGrid = createLayout(
  styles.decompositionToolGrid ?? "",
);

export const CharacterWorkspaceRoot = createLayout(
  styles.characterWorkspaceRoot ?? "",
);

export const StageEditorCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function StageEditorCard({ className, ...props }, ref) {
  return (
    <CharacterModeEditorCard
      {...props}
      ref={ref}
      className={mergeClassNames(
        styles.stageEditorCard ?? "",
        className ?? false,
      )}
    />
  );
});

export const PaletteControlRow = createLayout(styles.paletteControlRow ?? "");

export const PaletteSlotGrid = createLayout(styles.paletteSlotGrid ?? "");

export const SidebarToggleGrid = createLayout(styles.sidebarToggleGrid ?? "");

export const CharacterLibraryGrid = createLayout(
  styles.characterLibraryGrid ?? "",
);

export const SelectedRegionFieldGrid = createLayout(
  styles.selectedRegionFieldGrid ?? "",
);

export const CharacterStageViewport = React.forwardRef<
  HTMLDivElement,
  CharacterStageViewportProps
>(function CharacterStageViewport(
  { dragging, className, style, ...props },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      className={mergeClassNames(
        styles.characterStageViewport ?? "",
        className ?? false,
      )}
      data-dragging-state={toBooleanDataValue(dragging)}
      style={createCharacterStageViewportStyle(style ?? {}, dragging === true)}
    />
  );
});

export const ViewportCenterWrap = createLayout(styles.viewportCenterWrap ?? "");

export const ComposeCanvasMount = React.memo(function ComposeCanvasMount({
  onCanvasRef,
}: {
  readonly onCanvasRef: (element: HTMLCanvasElement | null) => void;
}) {
  return (
    <canvas
      ref={onCanvasRef}
      aria-hidden="true"
      className={styles.composeCanvasMount}
    />
  );
});

export const DecompositionCanvasElement = React.forwardRef<
  HTMLCanvasElement,
  DecompositionCanvasElementProps
>(function DecompositionCanvasElement(
  { className, cursorStyle, style, ...props },
  ref,
) {
  return (
    <canvas
      {...props}
      ref={ref}
      className={mergeClassNames(
        styles.decompositionCanvasElement ?? "",
        className ?? false,
      )}
      style={createDecompositionCanvasStyle(style ?? {}, cursorStyle)}
    />
  );
});

export const StageDragPreview = React.forwardRef<
  HTMLDivElement,
  StageDragPreviewProps
>(function StageDragPreview({ previewLeft, previewTop, style, ...props }, ref) {
  return (
    <div
      {...props}
      ref={ref}
      style={createStageDragPreviewStyle(style ?? {}, previewLeft, previewTop)}
    />
  );
});

export const RegionOverlayButton = React.forwardRef<
  HTMLButtonElement,
  RegionOverlayButtonProps
>(function RegionOverlayButton(
  {
    issueState,
    regionHeightPx,
    regionLeft,
    regionScale,
    regionTop,
    selectedState,
    style,
    toolMode,
    className,
    ...props
  },
  ref,
) {
  return (
    <button
      {...props}
      ref={ref}
      className={mergeClassNames(styles.resetButton ?? "", className ?? false)}
      data-issue-state={toBooleanDataValue(issueState)}
      data-selected-state={toBooleanDataValue(selectedState)}
      data-tool-mode={toolMode}
      type={props.type ?? "button"}
      style={createRegionOverlayButtonStyle(
        style ?? {},
        regionLeft,
        regionTop,
        regionScale,
        regionHeightPx,
        issueState === true,
        selectedState === true,
        toolMode,
      )}
    />
  );
});

export const FloatingLibraryPreview = React.forwardRef<
  HTMLDivElement,
  FloatingLibraryPreviewProps
>(function FloatingLibraryPreview(
  { className, dragClientX, dragClientY, style, ...props },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      className={className}
      style={createFloatingLibraryPreviewStyle(
        style ?? {},
        dragClientX,
        dragClientY,
      )}
    />
  );
});

export const PortalOverlay = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(function PortalOverlay({ className, style, ...props }, ref) {
  return (
    <div
      {...props}
      ref={ref}
      className={mergeClassNames(
        styles.portalOverlay ?? "",
        className ?? false,
      )}
      style={createPortalOverlayStyle(style ?? {})}
    />
  );
});

export const PositionedActionMenu = React.forwardRef<
  HTMLDivElement,
  PositionedActionMenuProps
>(function PositionedActionMenu(
  { className, menuLeft, menuTop, menuWidth, ready, style, ...props },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      className={mergeClassNames(
        styles.positionedActionMenu ?? "",
        className ?? false,
      )}
      data-ready={toBooleanDataValue(ready)}
      style={createPositionedActionMenuStyle(
        style ?? {},
        menuLeft,
        menuTop,
        menuWidth,
        ready,
      )}
    />
  );
});

export const PositionedActionMenuButton = React.forwardRef<
  HTMLButtonElement,
  PositionedActionMenuButtonProps
>(function PositionedActionMenuButton({ danger, ...props }, ref) {
  return (
    <Button
      {...props}
      ref={ref}
      color={danger === true ? "red" : "gray"}
      size="1"
      style={{ width: "100%" }}
      variant="surface"
    >
      {props.children}
    </Button>
  );
});

export const EmptyTilePreview = React.forwardRef<
  HTMLDivElement,
  EmptyTilePreviewProps
>(function EmptyTilePreview(
  { className, previewHeight, previewWidth, style, ...props },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      className={className}
      style={createEmptyTilePreviewStyle(
        style ?? {},
        previewWidth,
        previewHeight,
      )}
    />
  );
});

export const PixelPreviewCell = React.forwardRef<
  HTMLDivElement,
  PixelPreviewCellProps
>(function PixelPreviewCell(
  { className, colorHex, pixelSize, style, ...props },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      className={className}
      style={createPixelPreviewCellStyle(style ?? {}, pixelSize, colorHex)}
    />
  );
});

export const StageSurface = React.forwardRef<HTMLDivElement, StageSurfaceProps>(
  function StageSurface(
    {
      activeDrop,
      children,
      className,
      stageHeightPx,
      stageScale,
      stageWidthPx,
      style,
      ...props
    },
    ref,
  ) {
    return (
      <div
        {...props}
        ref={ref}
        data-active-drop={toBooleanDataValue(activeDrop)}
        className={mergeClassNames(
          styles.characterStageSurface ?? "",
          className ?? false,
        )}
        style={createStageSurfaceStyle(
          style ?? {},
          stageWidthPx,
          stageHeightPx,
          stageScale,
        )}
      >
        {children}
      </div>
    );
  },
);
