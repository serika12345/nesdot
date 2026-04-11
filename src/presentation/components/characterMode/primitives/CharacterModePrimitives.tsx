import {
  Box,
  ButtonBase,
  Grid as MaterialGrid,
  Stack,
  type BoxProps,
  type GridProps,
  type GridSize,
  type StackProps,
} from "@mui/material";
import React from "react";
import {
  ActionMenu,
  ActionMenuButton,
  CanvasViewport,
} from "../../../App.styles";
import {
  CHARACTER_DECOMPOSITION_CANVAS_CLASS_NAME,
  CHARACTER_DECOMPOSITION_TOOL_CARD_CLASS_NAME,
  CHARACTER_EDITOR_CARD_CLASS_NAME,
  CHARACTER_EMPTY_TILE_PREVIEW_CLASS_NAME,
  CHARACTER_FLOATING_LIBRARY_PREVIEW_CLASS_NAME,
  CHARACTER_PIXEL_PREVIEW_CELL_CLASS_NAME,
  CHARACTER_PORTAL_OVERLAY_CLASS_NAME,
  CHARACTER_POSITIONED_ACTION_MENU_BUTTON_CLASS_NAME,
  CHARACTER_POSITIONED_ACTION_MENU_CLASS_NAME,
  CHARACTER_REGION_OVERLAY_BUTTON_CLASS_NAME,
  CHARACTER_STAGE_CANVAS_CLASS_NAME,
  CHARACTER_STAGE_DRAG_PREVIEW_CLASS_NAME,
  CHARACTER_STAGE_SURFACE_CLASS_NAME,
  CHARACTER_STAGE_VIEWPORT_CLASS_NAME,
  CHARACTER_VIEWPORT_CENTER_WRAP_CLASS_NAME,
  mergeClassNames,
} from "../../../styleClassNames";

export type DecompositionTool = "pen" | "eraser" | "region";

type CharacterStageViewportProps = React.ComponentProps<
  typeof CanvasViewport
> & {
  dragging?: boolean;
};

type DecompositionCanvasElementProps = React.ComponentProps<"canvas"> & {
  cursorStyle: string;
};

type StageDragPreviewProps = React.ComponentProps<"div"> & {
  previewLeft: number;
  previewTop: number;
};

type RegionOverlayButtonProps = React.ComponentProps<typeof ButtonBase> & {
  issueState?: boolean;
  regionHeightPx: number;
  regionLeft: number;
  regionScale: number;
  regionTop: number;
  selectedState?: boolean;
  toolMode: DecompositionTool;
};

type FloatingLibraryPreviewProps = React.ComponentProps<"div"> & {
  dragClientX: number;
  dragClientY: number;
};

type PositionedActionMenuProps = React.ComponentProps<typeof ActionMenu> & {
  menuLeft: number;
  menuTop: number;
  menuWidth: number;
  ready: boolean;
};

type PositionedActionMenuButtonProps = React.ComponentProps<
  typeof ActionMenuButton
> & {
  danger?: boolean;
};

type EmptyTilePreviewProps = React.ComponentProps<"div"> & {
  previewHeight: number;
  previewWidth: number;
};

type PixelPreviewCellProps = React.ComponentProps<"div"> & {
  colorHex: string;
  pixelSize: number;
};

type StageSurfaceProps = React.ComponentProps<"div"> & {
  activeDrop?: boolean;
  stageHeightPx: number;
  stageScale: number;
  stageWidthPx: number;
};

type StageSurfaceStyle = React.CSSProperties & {
  "--stage-cell-size": string;
  "--stage-grid-size": string;
  "--stage-height-px": string;
  "--stage-mid-x": string;
  "--stage-mid-y": string;
  "--stage-width-px": string;
};

const toBooleanDataValue = (value?: boolean): "true" | "false" =>
  value === true ? "true" : "false";

const createStackLayout = (
  displayName: string,
  defaultProps: StackProps,
  Root: typeof Stack = Stack,
) => {
  void displayName;
  const LayoutComponent = React.forwardRef<HTMLDivElement, StackProps>(
    function LayoutComponent({ className, ...props }, ref) {
      const mergedClassName = mergeClassNames(
        typeof defaultProps.className === "string"
          ? defaultProps.className
          : false,
        typeof className === "string" ? className : false,
      );

      if (mergedClassName === "") {
        return <Root ref={ref} useFlexGap {...defaultProps} {...props} />;
      }

      return (
        <Root
          ref={ref}
          useFlexGap
          {...defaultProps}
          {...props}
          className={mergedClassName}
        />
      );
    },
  );

  return LayoutComponent;
};

type UniformGridLayoutProps = Omit<
  GridProps,
  "columns" | "container" | "size" | "spacing"
>;

const createUniformGridLayout = (
  displayName: string,
  columns: number,
  itemSize: GridSize,
  spacing: number,
) => {
  void displayName;
  const LayoutComponent = React.forwardRef<
    HTMLDivElement,
    UniformGridLayoutProps
  >(function LayoutComponent({ children, ...props }, ref) {
    const childrenArray = React.Children.toArray(children);

    return (
      <MaterialGrid
        ref={ref}
        container
        columns={columns}
        spacing={spacing}
        {...props}
      >
        {childrenArray.map((child, index) => (
          <MaterialGrid key={`grid-item-${index}`} size={itemSize}>
            {child}
          </MaterialGrid>
        ))}
      </MaterialGrid>
    );
  });

  return LayoutComponent;
};

const FullWidthBox = React.forwardRef<HTMLDivElement, BoxProps>(
  function FullWidthBox(props, ref) {
    return <Box ref={ref} width="100%" minWidth={0} {...props} />;
  },
);

export const StageInputContainer = React.forwardRef<HTMLDivElement, BoxProps>(
  function StageInputContainer(props, ref) {
    return (
      <FullWidthBox ref={ref} width={{ xs: "100%", sm: "7.5rem" }} {...props} />
    );
  },
);

export const PaletteControlContainer = React.forwardRef<
  HTMLDivElement,
  BoxProps
>(function PaletteControlContainer(props, ref) {
  return <FullWidthBox ref={ref} flex="1 1 10rem" {...props} />;
});

type CharacterComposeWorkspaceGridProps = StackProps;

export const CharacterComposeWorkspaceGrid = React.forwardRef<
  HTMLDivElement,
  CharacterComposeWorkspaceGridProps
>(function CharacterComposeWorkspaceGrid({ children, ...props }, ref) {
  const childrenArray = React.Children.toArray(children);
  const sidebar = childrenArray[0];
  const stage = childrenArray[1];

  return (
    <Stack ref={ref} minHeight={0} spacing="1rem" overflow="auto" {...props}>
      <Stack
        useFlexGap
        width="100%"
        minHeight={0}
        flex="1 1 0"
        direction={{ xs: "column", lg: "row" }}
        spacing={2}
      >
        <FullWidthBox
          minHeight={0}
          height="100%"
          flexBasis={{ lg: "17.5rem" }}
          maxWidth={{ lg: "17.5rem" }}
          flexShrink={{ lg: 0 }}
          display="flex"
        >
          {sidebar}
        </FullWidthBox>
        <Box
          width="100%"
          minWidth={0}
          minHeight={0}
          flex="1 1 0"
          height={{ lg: "100%" }}
          display="flex"
        >
          {stage}
        </Box>
      </Stack>
    </Stack>
  );
});

export const PreviewHeaderLayout = createStackLayout("PreviewHeaderLayout", {
  direction: { xs: "column", md: "row" },
  spacing: "0.75rem",
  alignItems: "center",
});

export const PreviewControlsRow = createStackLayout("PreviewControlsRow", {
  direction: "row",
  flexWrap: "wrap",
  spacing: "0.625rem",
  alignItems: "center",
  justifyContent: { xs: "start", md: "stretch" },
});

export const DecompositionToolGrid = createStackLayout(
  "DecompositionToolGrid",
  {
    direction: "row",
    flexWrap: "wrap",
    spacing: "0.625rem",
    alignItems: "center",
  },
);

export const CharacterWorkspaceRoot = createStackLayout(
  "CharacterWorkspaceRoot",
  {
    minHeight: 0,
    spacing: "1rem",
  },
);

const EditorCard = createStackLayout("EditorCard", {
  component: "div",
  className: CHARACTER_EDITOR_CARD_CLASS_NAME,
  minHeight: 0,
  spacing: "0.875rem",
  p: "1rem",
});

export const StageEditorCard = React.forwardRef<HTMLDivElement, StackProps>(
  function StageEditorCard(props, ref) {
    return <EditorCard ref={ref} {...props} />;
  },
);

export const DecompositionToolCard = createStackLayout(
  "DecompositionToolCard",
  {
    component: "div",
    className: CHARACTER_DECOMPOSITION_TOOL_CARD_CLASS_NAME,
    spacing: "0.75rem",
    p: "0.75rem",
  },
);

export const PaletteControlRow = createStackLayout("PaletteControlRow", {
  direction: "row",
  flexWrap: "wrap",
  spacing: "0.625rem",
  alignItems: "center",
});

export const PaletteSlotGrid = createUniformGridLayout(
  "PaletteSlotGrid",
  3,
  1,
  1,
);

export const CharacterStageViewport = React.forwardRef<
  HTMLDivElement,
  CharacterStageViewportProps
>(function CharacterStageViewport({ dragging, className, ...props }, ref) {
  return (
    <CanvasViewport
      ref={ref}
      data-dragging-state={toBooleanDataValue(dragging)}
      className={mergeClassNames(
        CHARACTER_STAGE_VIEWPORT_CLASS_NAME,
        typeof className === "string" ? className : false,
      )}
      flex="1 1 0"
      minHeight={0}
      minWidth={0}
      p="1.5rem"
      borderRadius={0}
      {...props}
    />
  );
});

export const ViewportCenterWrap = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(function ViewportCenterWrap({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      {...props}
      className={mergeClassNames(
        CHARACTER_VIEWPORT_CENTER_WRAP_CLASS_NAME,
        typeof className === "string" ? className : false,
      )}
    />
  );
});

export const ComposeCanvasMount = React.memo(function ComposeCanvasMount({
  onCanvasRef,
}: {
  onCanvasRef: (element: HTMLCanvasElement | null) => void;
}) {
  return (
    <canvas
      ref={onCanvasRef}
      aria-hidden="true"
      className={CHARACTER_STAGE_CANVAS_CLASS_NAME}
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
      ref={ref}
      {...props}
      className={mergeClassNames(
        CHARACTER_STAGE_CANVAS_CLASS_NAME,
        CHARACTER_DECOMPOSITION_CANVAS_CLASS_NAME,
        typeof className === "string" ? className : false,
      )}
      style={{ ...style, cursor: cursorStyle }}
    />
  );
});

export const StageDragPreview = React.forwardRef<
  HTMLDivElement,
  StageDragPreviewProps
>(function StageDragPreview({ previewLeft, previewTop, style, ...props }, ref) {
  return (
    <div
      ref={ref}
      {...props}
      className={mergeClassNames(
        CHARACTER_STAGE_DRAG_PREVIEW_CLASS_NAME,
        typeof props.className === "string" ? props.className : false,
      )}
      style={{ ...style, left: previewLeft, top: previewTop }}
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
    <ButtonBase
      ref={ref}
      {...props}
      data-issue-state={toBooleanDataValue(issueState)}
      data-selected-state={toBooleanDataValue(selectedState)}
      data-tool-mode={toolMode}
      className={mergeClassNames(
        CHARACTER_REGION_OVERLAY_BUTTON_CLASS_NAME,
        typeof className === "string" ? className : false,
      )}
      style={{
        ...style,
        left: regionLeft,
        top: regionTop,
        width: 8 * regionScale,
        height: regionHeightPx,
      }}
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
      ref={ref}
      {...props}
      className={mergeClassNames(
        CHARACTER_FLOATING_LIBRARY_PREVIEW_CLASS_NAME,
        typeof className === "string" ? className : false,
      )}
      style={{ ...style, left: dragClientX + 18, top: dragClientY + 18 }}
    />
  );
});

export const PortalOverlay = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(function PortalOverlay({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      {...props}
      className={mergeClassNames(
        CHARACTER_PORTAL_OVERLAY_CLASS_NAME,
        typeof className === "string" ? className : false,
      )}
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
    <ActionMenu
      ref={ref}
      {...props}
      data-ready={toBooleanDataValue(ready)}
      className={mergeClassNames(
        CHARACTER_POSITIONED_ACTION_MENU_CLASS_NAME,
        typeof className === "string" ? className : false,
      )}
      style={{ ...style, left: menuLeft, top: menuTop, width: menuWidth }}
    />
  );
});

export const PositionedActionMenuButton = React.forwardRef<
  HTMLButtonElement,
  PositionedActionMenuButtonProps
>(function PositionedActionMenuButton({ className, danger, ...props }, ref) {
  return (
    <ActionMenuButton
      ref={ref}
      {...props}
      data-danger={toBooleanDataValue(danger)}
      className={mergeClassNames(
        CHARACTER_POSITIONED_ACTION_MENU_BUTTON_CLASS_NAME,
        typeof className === "string" ? className : false,
      )}
    />
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
      ref={ref}
      {...props}
      className={mergeClassNames(
        CHARACTER_EMPTY_TILE_PREVIEW_CLASS_NAME,
        typeof className === "string" ? className : false,
      )}
      style={{ ...style, width: previewWidth, height: previewHeight }}
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
      ref={ref}
      {...props}
      className={mergeClassNames(
        CHARACTER_PIXEL_PREVIEW_CELL_CLASS_NAME,
        typeof className === "string" ? className : false,
      )}
      style={{
        ...style,
        width: pixelSize,
        height: pixelSize,
        backgroundColor: colorHex,
      }}
    />
  );
});

export const StageSurface = React.forwardRef<HTMLDivElement, StageSurfaceProps>(
  function StageSurface(
    {
      activeDrop,
      className,
      stageHeightPx,
      stageScale,
      stageWidthPx,
      style,
      ...props
    },
    ref,
  ) {
    const stageSurfaceStyle: StageSurfaceStyle = {
      ...style,
      width: stageWidthPx,
      height: stageHeightPx,
      minWidth: stageWidthPx,
      minHeight: stageHeightPx,
      "--stage-cell-size": `${stageScale}px`,
      "--stage-grid-size": `${stageScale * 8}px`,
      "--stage-height-px": `${stageHeightPx}px`,
      "--stage-width-px": `${stageWidthPx}px`,
      "--stage-mid-x": `${Math.floor(stageWidthPx / 2)}px`,
      "--stage-mid-y": `${Math.floor(stageHeightPx / 2)}px`,
    };

    return (
      <div
        ref={ref}
        {...props}
        data-active-drop={toBooleanDataValue(activeDrop)}
        className={mergeClassNames(
          CHARACTER_STAGE_SURFACE_CLASS_NAME,
          typeof className === "string" ? className : false,
        )}
        style={stageSurfaceStyle}
      />
    );
  },
);
