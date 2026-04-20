import Box, { type BoxProps } from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import MaterialGrid, {
  type GridProps,
  type GridSize,
} from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack, { type StackProps } from "@mui/material/Stack";
import React from "react";
import { mergeClassNames } from "../../../../styleClassNames";
import {
  characterStageCanvasStyle,
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

type CharacterStageViewportProps = BoxProps & {
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

type PositionedActionMenuProps = StackProps & {
  menuLeft: number;
  menuTop: number;
  menuWidth: number;
  ready: boolean;
};

type PositionedActionMenuButtonProps = React.ComponentProps<typeof Button> & {
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

type UniformGridLayoutProps = Omit<
  GridProps,
  "columns" | "container" | "size" | "spacing"
>;

type GridContainerLayoutProps = Omit<GridProps, "container" | "size">;

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

const createUniformGridLayout = (
  displayName: string,
  columns: GridProps["columns"],
  itemSize: GridSize,
  spacing: GridProps["spacing"],
  defaultProps: UniformGridLayoutProps = {},
) => {
  void displayName;
  const LayoutComponent = React.forwardRef<
    HTMLDivElement,
    UniformGridLayoutProps
  >(function LayoutComponent({ children, className, ...props }, ref) {
    const childrenArray = React.Children.toArray(children);
    const mergedClassName = mergeClassNames(
      typeof defaultProps.className === "string"
        ? defaultProps.className
        : false,
      typeof className === "string" ? className : false,
    );

    if (mergedClassName === "") {
      return (
        <MaterialGrid
          ref={ref}
          container
          columns={columns}
          spacing={spacing}
          {...defaultProps}
          {...props}
        >
          {childrenArray.map((child, index) => (
            <MaterialGrid key={`grid-item-${index}`} size={itemSize}>
              {child}
            </MaterialGrid>
          ))}
        </MaterialGrid>
      );
    }

    return (
      <MaterialGrid
        ref={ref}
        container
        columns={columns}
        spacing={spacing}
        {...defaultProps}
        {...props}
        className={mergedClassName}
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

const createGridContainerLayout = (
  displayName: string,
  defaultProps: GridContainerLayoutProps,
) => {
  void displayName;

  return React.forwardRef<HTMLDivElement, GridContainerLayoutProps>(
    function LayoutComponent({ className, ...props }, ref) {
      const mergedClassName = mergeClassNames(
        typeof defaultProps.className === "string"
          ? defaultProps.className
          : false,
        typeof className === "string" ? className : false,
      );

      if (mergedClassName === "") {
        return (
          <MaterialGrid ref={ref} container {...defaultProps} {...props} />
        );
      }

      return (
        <MaterialGrid
          ref={ref}
          container
          {...defaultProps}
          {...props}
          className={mergedClassName}
        />
      );
    },
  );
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

const EditorCard = React.forwardRef<HTMLDivElement, StackProps<typeof Paper>>(
  function EditorCard(props, ref) {
    return (
      <Stack
        ref={ref}
        component={Paper}
        variant="outlined"
        minHeight={0}
        spacing="0.875rem"
        p="1rem"
        useFlexGap
        {...props}
      />
    );
  },
);

export const StageEditorCard = React.forwardRef<
  HTMLDivElement,
  StackProps<typeof Paper>
>(function StageEditorCard(props, ref) {
  return <EditorCard ref={ref} {...props} />;
});

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

export const SidebarToggleGrid = createUniformGridLayout(
  "SidebarToggleGrid",
  2,
  1,
  0.75,
  {
    width: "10.5rem",
  },
);

export const CharacterLibraryGrid = createUniformGridLayout(
  "CharacterLibraryGrid",
  2,
  1,
  2.5,
);

export const SelectedRegionFieldGrid = createUniformGridLayout(
  "SelectedRegionFieldGrid",
  2,
  1,
  3,
);

export const CharacterStageViewport = React.forwardRef<
  HTMLDivElement,
  CharacterStageViewportProps
>(function CharacterStageViewport({ dragging, className, ...props }, ref) {
  const { component, style, ...forwardedProps } = props;

  void component;

  return (
    <Box
      ref={ref}
      {...forwardedProps}
      component={Paper}
      variant="outlined"
      data-dragging-state={toBooleanDataValue(dragging)}
      className={mergeClassNames(
        typeof className === "string" ? className : false,
      )}
      flex="1 1 0"
      minHeight={0}
      minWidth={0}
      overflow="auto"
      position="relative"
      zIndex={1}
      p="1.5rem"
      borderRadius={0}
      style={createCharacterStageViewportStyle(style ?? {}, dragging === true)}
    />
  );
});

export const ViewportCenterWrap = createGridContainerLayout(
  "ViewportCenterWrap",
  {
    wrap: "nowrap",
    justifyContent: "center",
    alignItems: "center",
    width: "max-content",
    height: "max-content",
    minWidth: "100%",
    minHeight: "100%",
  },
);

export const ComposeCanvasMount = React.memo(function ComposeCanvasMount({
  onCanvasRef,
}: {
  onCanvasRef: (element: HTMLCanvasElement | null) => void;
}) {
  return (
    <canvas
      ref={onCanvasRef}
      aria-hidden="true"
      style={characterStageCanvasStyle}
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
        typeof className === "string" ? className : false,
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
      ref={ref}
      {...props}
      className={mergeClassNames(
        typeof props.className === "string" ? props.className : false,
      )}
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
    <ButtonBase
      ref={ref}
      {...props}
      data-issue-state={toBooleanDataValue(issueState)}
      data-selected-state={toBooleanDataValue(selectedState)}
      data-tool-mode={toolMode}
      className={mergeClassNames(
        typeof className === "string" ? className : false,
      )}
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
      ref={ref}
      {...props}
      className={mergeClassNames(
        typeof className === "string" ? className : false,
      )}
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
      ref={ref}
      {...props}
      className={mergeClassNames(
        typeof className === "string" ? className : false,
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
    <Stack
      ref={ref}
      component="div"
      useFlexGap
      {...props}
      data-ready={toBooleanDataValue(ready)}
      className={mergeClassNames(
        typeof className === "string" ? className : false,
      )}
      minWidth="13.75rem"
      maxWidth="min(20rem, calc(100vw - 2rem))"
      spacing="0.375rem"
      p="0.625rem"
      zIndex={9999}
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
>(function PositionedActionMenuButton({ className, danger, ...props }, ref) {
  return (
    <Button
      ref={ref}
      {...props}
      className={className}
      color={danger === true ? "error" : "inherit"}
      fullWidth
      size="small"
      variant={danger === true ? "contained" : "outlined"}
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
        typeof className === "string" ? className : false,
      )}
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
      ref={ref}
      {...props}
      className={mergeClassNames(
        typeof className === "string" ? className : false,
      )}
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
        ref={ref}
        {...props}
        data-active-drop={toBooleanDataValue(activeDrop)}
        className={mergeClassNames(
          styles.characterStageSurface ?? false,
          typeof className === "string" ? className : false,
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
