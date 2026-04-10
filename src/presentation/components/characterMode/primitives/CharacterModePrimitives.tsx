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
import { styled } from "@mui/material/styles";
import React from "react";
import {
  ActionMenu,
  ActionMenuButton,
  CanvasViewport,
} from "../../../App.styles";

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

const editorCardStyles = {
  position: "relative",
  zIndex: 1,
  borderRadius: "1.375rem",
  background: "rgba(248, 250, 252, 0.84)",
  border: "0.0625rem solid rgba(148, 163, 184, 0.16)",
  boxShadow: "inset 0 0.0625rem 0 rgba(255, 255, 255, 0.72)",
} satisfies React.CSSProperties;

const toBooleanDataValue = (value?: boolean): "true" | "false" =>
  value === true ? "true" : "false";

const createStackLayout = (
  displayName: string,
  defaultProps: StackProps,
  Root: typeof Stack = Stack,
) => {
  void displayName;
  const LayoutComponent = React.forwardRef<HTMLDivElement, StackProps>(
    function LayoutComponent(props, ref) {
      return <Root ref={ref} useFlexGap {...defaultProps} {...props} />;
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

const EditorCardRoot = styled("div")(editorCardStyles);

const EditorCard = createStackLayout("EditorCard", {
  component: EditorCardRoot,
  minHeight: 0,
  spacing: "0.875rem",
  p: "1rem",
});

export const StageEditorCard = React.forwardRef<HTMLDivElement, StackProps>(
  function StageEditorCard(props, ref) {
    return <EditorCard ref={ref} {...props} />;
  },
);

const DecompositionToolCardRoot = styled("div")({
  borderRadius: "1.125rem",
  background:
    "linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(241, 245, 249, 0.9))",
  border: "0.0625rem solid rgba(148, 163, 184, 0.18)",
});

export const DecompositionToolCard = createStackLayout(
  "DecompositionToolCard",
  {
    component: DecompositionToolCardRoot,
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

const CharacterStageViewportRoot = styled(CanvasViewport)({
  "&[data-dragging-state='false']": {
    cursor: "default",
  },
  "&[data-dragging-state='true']": {
    cursor: "grabbing",
  },
});

export const CharacterStageViewport = React.forwardRef<
  HTMLDivElement,
  CharacterStageViewportProps
>(function CharacterStageViewport({ dragging, ...props }, ref) {
  return (
    <CharacterStageViewportRoot
      ref={ref}
      data-dragging-state={toBooleanDataValue(dragging)}
      flex="1 1 0"
      minHeight={0}
      minWidth={0}
      p="1.5rem"
      borderRadius={0}
      {...props}
    />
  );
});

export const ViewportCenterWrap = styled("div")({
  display: "grid",
  placeItems: "center",
  width: "max-content",
  height: "max-content",
  minWidth: "100%",
  minHeight: "100%",
});

const StageCanvasElement = styled("canvas")({
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
});

export const ComposeCanvasMount = React.memo(function ComposeCanvasMount({
  onCanvasRef,
}: {
  onCanvasRef: (element: HTMLCanvasElement | null) => void;
}) {
  return <StageCanvasElement ref={onCanvasRef} aria-hidden="true" />;
});

const DecompositionCanvasElementRoot = styled(StageCanvasElement)({
  imageRendering: "pixelated",
});

export const DecompositionCanvasElement = React.forwardRef<
  HTMLCanvasElement,
  DecompositionCanvasElementProps
>(function DecompositionCanvasElement({ cursorStyle, style, ...props }, ref) {
  return (
    <DecompositionCanvasElementRoot
      ref={ref}
      {...props}
      style={{ ...style, cursor: cursorStyle }}
    />
  );
});

const StageDragPreviewRoot = styled("div")({
  position: "absolute",
  opacity: 0.6,
  pointerEvents: "none",
  outline: "0.125rem dashed rgba(15, 118, 110, 0.72)",
  borderRadius: "0.5rem",
  boxShadow: "0 0 0 0.375rem rgba(15, 118, 110, 0.12)",
  background: "rgba(255, 255, 255, 0.72)",
  padding: "0.125rem",
});

export const StageDragPreview = React.forwardRef<
  HTMLDivElement,
  StageDragPreviewProps
>(function StageDragPreview({ previewLeft, previewTop, style, ...props }, ref) {
  return (
    <StageDragPreviewRoot
      ref={ref}
      {...props}
      style={{ ...style, left: previewLeft, top: previewTop }}
    />
  );
});

const RegionOverlayButtonRoot = styled(ButtonBase)({
  position: "absolute",
  padding: "0.375rem",
  "&[data-issue-state='false']": {
    border: "0.125rem solid rgba(15, 118, 110, 0.92)",
    background: "rgba(240, 253, 250, 0.18)",
  },
  "&[data-issue-state='true']": {
    border: "0.125rem solid rgba(190, 24, 93, 0.92)",
    background: "rgba(255, 241, 242, 0.18)",
  },
  "&[data-selected-state='false']": {
    boxShadow: "none",
  },
  "&[data-selected-state='true']": {
    boxShadow: "0 0 0 0.375rem rgba(190, 24, 93, 0.12)",
  },
  "&[data-tool-mode='eraser'], &[data-tool-mode='pen']": {
    cursor: "default",
    pointerEvents: "none",
  },
  "&[data-tool-mode='region']": {
    cursor: "grab",
    pointerEvents: "auto",
  },
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
    ...props
  },
  ref,
) {
  return (
    <RegionOverlayButtonRoot
      ref={ref}
      {...props}
      data-issue-state={toBooleanDataValue(issueState)}
      data-selected-state={toBooleanDataValue(selectedState)}
      data-tool-mode={toolMode}
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

const FloatingLibraryPreviewRoot = styled("div")({
  position: "fixed",
  zIndex: 200,
  pointerEvents: "none",
  width: "4rem",
  minHeight: "4rem",
  padding: "0.625rem",
  borderRadius: "1.125rem",
  background:
    "linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(241, 245, 249, 0.92))",
  border: "0.0625rem solid rgba(148, 163, 184, 0.18)",
  boxShadow: "0 1.125rem 2.125rem rgba(15, 23, 42, 0.18)",
  opacity: 0.92,
});

export const FloatingLibraryPreview = React.forwardRef<
  HTMLDivElement,
  FloatingLibraryPreviewProps
>(function FloatingLibraryPreview(
  { dragClientX, dragClientY, style, ...props },
  ref,
) {
  return (
    <FloatingLibraryPreviewRoot
      ref={ref}
      {...props}
      style={{ ...style, left: dragClientX + 18, top: dragClientY + 18 }}
    />
  );
});

export const PortalOverlay = styled("div")({
  position: "fixed",
  inset: 0,
  zIndex: 320,
});

const PositionedActionMenuRoot = styled(ActionMenu)({
  "&[data-ready='false']": {
    visibility: "hidden",
  },
  "&[data-ready='true']": {
    visibility: "visible",
  },
});

export const PositionedActionMenu = React.forwardRef<
  HTMLDivElement,
  PositionedActionMenuProps
>(function PositionedActionMenu(
  { menuLeft, menuTop, menuWidth, ready, style, ...props },
  ref,
) {
  return (
    <PositionedActionMenuRoot
      ref={ref}
      {...props}
      data-ready={toBooleanDataValue(ready)}
      style={{ ...style, left: menuLeft, top: menuTop, width: menuWidth }}
    />
  );
});

const PositionedActionMenuButtonRoot = styled(ActionMenuButton)({
  "&[data-danger='false']": {
    color: "var(--ink-strong)",
    background: "rgba(248, 250, 252, 0.96)",
  },
  "&[data-danger='true']": {
    color: "rgb(190, 24, 93)",
    background: "rgba(255, 241, 242, 0.96)",
  },
});

export const PositionedActionMenuButton = React.forwardRef<
  HTMLButtonElement,
  PositionedActionMenuButtonProps
>(function PositionedActionMenuButton({ danger, ...props }, ref) {
  return (
    <PositionedActionMenuButtonRoot
      ref={ref}
      {...props}
      data-danger={toBooleanDataValue(danger)}
    />
  );
});

const EmptyTilePreviewRoot = styled("div")({
  borderRadius: "0.5rem",
  background:
    "linear-gradient(180deg, rgba(15, 23, 42, 0.08), rgba(15, 23, 42, 0.02))",
  border: "0.0625rem dashed rgba(148, 163, 184, 0.34)",
});

export const EmptyTilePreview = React.forwardRef<
  HTMLDivElement,
  EmptyTilePreviewProps
>(function EmptyTilePreview(
  { previewHeight, previewWidth, style, ...props },
  ref,
) {
  return (
    <EmptyTilePreviewRoot
      ref={ref}
      {...props}
      style={{ ...style, width: previewWidth, height: previewHeight }}
    />
  );
});

const PixelPreviewCellRoot = styled("div")({
  flexShrink: 0,
});

export const PixelPreviewCell = React.forwardRef<
  HTMLDivElement,
  PixelPreviewCellProps
>(function PixelPreviewCell({ colorHex, pixelSize, style, ...props }, ref) {
  return (
    <PixelPreviewCellRoot
      ref={ref}
      {...props}
      style={{
        ...style,
        width: pixelSize,
        height: pixelSize,
        backgroundColor: colorHex,
      }}
    />
  );
});

const StageSurfaceRoot = styled("div")({
  position: "relative",
  overflow: "hidden",
  background:
    "linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(241, 245, 249, 0.98))",
  boxShadow:
    "0 1.75rem 3.75rem rgba(15, 23, 42, 0.22), inset 0 0.0625rem 0 rgba(255, 255, 255, 0.92)",
  transition:
    "transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease",
  "&[data-active-drop='false']": {
    border: "0.0625rem solid rgba(148, 163, 184, 0.22)",
    transform: "none",
  },
  "&[data-active-drop='true']": {
    border: "0.0625rem solid rgba(45, 212, 191, 0.72)",
    transform: "scale(1.01)",
  },
  "&:focus-visible": {
    outline: "0.125rem solid rgba(15, 118, 110, 0.92)",
    outlineOffset: "0.25rem",
  },
  "&::before": {
    content: '""',
    position: "absolute",
    inset: 0,
    backgroundImage: [
      "linear-gradient(rgba(148, 163, 184, 0.18) 0.0625rem, transparent 0.0625rem)",
      "linear-gradient(90deg, rgba(148, 163, 184, 0.18) 0.0625rem, transparent 0.0625rem)",
      "linear-gradient(rgba(148, 163, 184, 0.15) 0.0625rem, transparent 0.0625rem)",
      "linear-gradient(90deg, rgba(148, 163, 184, 0.15) 0.0625rem, transparent 0.0625rem)",
    ].join(", "),
    backgroundSize: [
      "var(--stage-cell-size) var(--stage-cell-size)",
      "var(--stage-cell-size) var(--stage-cell-size)",
      "var(--stage-grid-size) var(--stage-grid-size)",
      "var(--stage-grid-size) var(--stage-grid-size)",
    ].join(", "),
    opacity: 0.95,
    pointerEvents: "none",
  },
  "&::after": {
    content: '""',
    position: "absolute",
    inset: 0,
    backgroundImage: [
      "linear-gradient(rgba(15, 118, 110, 0.12), rgba(15, 118, 110, 0.12))",
      "linear-gradient(90deg, rgba(15, 118, 110, 0.12), rgba(15, 118, 110, 0.12))",
    ].join(", "),
    backgroundSize:
      "0.0625rem var(--stage-height-px), var(--stage-width-px) 0.0625rem",
    backgroundPosition: "var(--stage-mid-x) 0, 0 var(--stage-mid-y)",
    backgroundRepeat: "no-repeat",
    pointerEvents: "none",
  },
});

export const StageSurface = React.forwardRef<HTMLDivElement, StageSurfaceProps>(
  function StageSurface(
    { activeDrop, stageHeightPx, stageScale, stageWidthPx, style, ...props },
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
      <StageSurfaceRoot
        ref={ref}
        {...props}
        data-active-drop={toBooleanDataValue(activeDrop)}
        style={stageSurfaceStyle}
      />
    );
  },
);
