import {
  ButtonBase,
  Container,
  Grid as MaterialGrid,
  Stack,
  type ContainerProps,
  type GridProps,
  type GridSize,
  type StackProps,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import React from "react";
import { ActionMenu, ActionMenuButton, CanvasViewport } from "../../App.styles";

export type DecompositionTool = "pen" | "eraser" | "region";

const editorCardStyles = {
  position: "relative",
  zIndex: 1,
  borderRadius: "1.375rem",
  background: "rgba(248, 250, 252, 0.84)",
  border: "0.0625rem solid rgba(148, 163, 184, 0.16)",
  boxShadow: "inset 0 0.0625rem 0 rgba(255, 255, 255, 0.72)",
} satisfies React.CSSProperties;

const shouldForwardStageProp = (prop: PropertyKey): boolean =>
  prop !== "activeDrop" &&
  prop !== "stageWidthPx" &&
  prop !== "stageHeightPx" &&
  prop !== "stageScale";

const createShouldForwardProp = (
  blockedProps: ReadonlyArray<string>,
): ((prop: PropertyKey) => boolean) => {
  return (prop: PropertyKey): boolean =>
    typeof prop !== "string" || blockedProps.includes(prop) === false;
};

const shouldForwardPixelPreviewSizeProp = createShouldForwardProp([
  "previewWidth",
  "previewHeight",
  "pixelSize",
  "colorHex",
]);

const shouldForwardMenuPositionProp = createShouldForwardProp([
  "menuTop",
  "menuLeft",
  "menuWidth",
  "ready",
  "danger",
]);

const shouldForwardLibraryStateProp = createShouldForwardProp([
  "dragging",
  "draggableState",
  "previewLeft",
  "previewTop",
  "dragClientX",
  "dragClientY",
]);

const shouldForwardRegionStateProp = createShouldForwardProp([
  "selectedState",
  "issueState",
  "regionLeft",
  "regionTop",
  "regionHeightPx",
  "regionScale",
  "toolMode",
]);

const shouldForwardCanvasCursorProp = createShouldForwardProp(["cursorStyle"]);

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

const BareContainer = React.forwardRef<HTMLDivElement, ContainerProps>(
  function BareContainer(props, ref) {
    return <Container ref={ref} disableGutters maxWidth={false} {...props} />;
  },
);

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

const FullWidthContainer = styled(BareContainer)({
  width: "100%",
  minWidth: 0,
});

const WorkspaceStageContainer = styled(FullWidthContainer)({
  display: "flex",
  minHeight: 0,
  height: "100%",
});

const ComposeSidebarContainer = styled(FullWidthContainer)(({ theme }) => ({
  display: "flex",
  minHeight: 0,
  height: "100%",
  [theme.breakpoints.up("lg")]: {
    width: "17.5rem",
    flexShrink: 0,
  },
}));

const DecomposeSidebarContainer = styled(FullWidthContainer)(({ theme }) => ({
  [theme.breakpoints.up("xl")]: {
    width: "17.5rem",
    flexShrink: 0,
  },
}));

const DecompositionInspectorContainer = styled(FullWidthContainer)(
  ({ theme }) => ({
    [theme.breakpoints.up("xl")]: {
      width: "20rem",
      flexShrink: 0,
    },
  }),
);

export const StageInputContainer = styled(FullWidthContainer)(({ theme }) => ({
  [theme.breakpoints.up("sm")]: {
    width: "7.5rem",
  },
}));

export const PaletteControlContainer = styled(FullWidthContainer)({
  flex: "1 1 10rem",
});

const WorkspaceColumnsGrid = styled(MaterialGrid)({
  width: "100%",
  minHeight: 0,
  flex: "1 1 0",
});

const ComposeSidebarGridItem = styled(MaterialGrid)(({ theme }) => ({
  width: "100%",
  minHeight: 0,
  [theme.breakpoints.up("lg")]: {
    flexBasis: "17.5rem",
    maxWidth: "17.5rem",
    height: "100%",
  },
}));

const DecomposeSidebarGridItem = styled(MaterialGrid)(({ theme }) => ({
  width: "100%",
  [theme.breakpoints.up("xl")]: {
    flexBasis: "17.5rem",
    maxWidth: "17.5rem",
  },
}));

const DecompositionInspectorGridItem = styled(MaterialGrid)(({ theme }) => ({
  width: "100%",
  [theme.breakpoints.up("xl")]: {
    flexBasis: "20rem",
    maxWidth: "20rem",
  },
}));

const WorkspaceStageGridItem = styled(MaterialGrid)(({ theme }) => ({
  width: "100%",
  minWidth: 0,
  flex: "1 1 0",
  minHeight: 0,
  [theme.breakpoints.up("lg")]: {
    height: "100%",
  },
}));

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
      <WorkspaceColumnsGrid container spacing={2}>
        <ComposeSidebarGridItem size={12}>
          <ComposeSidebarContainer>{sidebar}</ComposeSidebarContainer>
        </ComposeSidebarGridItem>
        <WorkspaceStageGridItem size={12}>
          <WorkspaceStageContainer>{stage}</WorkspaceStageContainer>
        </WorkspaceStageGridItem>
      </WorkspaceColumnsGrid>
    </Stack>
  );
});

type CharacterDecomposeWorkspaceGridProps = StackProps;

export const CharacterDecomposeWorkspaceGrid = React.forwardRef<
  HTMLDivElement,
  CharacterDecomposeWorkspaceGridProps
>(function CharacterDecomposeWorkspaceGrid({ children, ...props }, ref) {
  const childrenArray = React.Children.toArray(children);
  const sidebar = childrenArray[0];
  const stage = childrenArray[1];
  const decompositionInspector = childrenArray[2];

  return (
    <Stack ref={ref} spacing="1rem" minHeight={0} overflow="auto" {...props}>
      <WorkspaceColumnsGrid container spacing={2}>
        <DecomposeSidebarGridItem size={12}>
          <DecomposeSidebarContainer>{sidebar}</DecomposeSidebarContainer>
        </DecomposeSidebarGridItem>
        <WorkspaceStageGridItem size={12}>
          <WorkspaceStageContainer>{stage}</WorkspaceStageContainer>
        </WorkspaceStageGridItem>
        <DecompositionInspectorGridItem size={12}>
          <DecompositionInspectorContainer>
            {decompositionInspector}
          </DecompositionInspectorContainer>
        </DecompositionInspectorGridItem>
      </WorkspaceColumnsGrid>
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

type CharacterStageViewportProps = React.ComponentProps<
  typeof CanvasViewport
> & {
  dragging?: boolean;
};

const CharacterStageViewportRoot = styled(CanvasViewport, {
  shouldForwardProp: createShouldForwardProp(["dragging"]),
})<{ dragging?: boolean }>(({ dragging }) => ({
  cursor: dragging === true ? "grabbing" : "default",
}));

export const CharacterStageViewport = React.forwardRef<
  HTMLDivElement,
  CharacterStageViewportProps
>(function CharacterStageViewport({ dragging, ...props }, ref) {
  return (
    <CharacterStageViewportRoot
      ref={ref}
      dragging={dragging === true}
      minHeight={0}
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

export const DecompositionCanvasElement = styled(StageCanvasElement, {
  shouldForwardProp: shouldForwardCanvasCursorProp,
})<{ cursorStyle: string }>(({ cursorStyle }) => ({
  imageRendering: "pixelated",
  cursor: cursorStyle,
}));

export const StageDragPreview = styled("div", {
  shouldForwardProp: shouldForwardLibraryStateProp,
})<{ previewLeft: number; previewTop: number }>(
  ({ previewLeft, previewTop }) => ({
    position: "absolute",
    left: previewLeft,
    top: previewTop,
    opacity: 0.6,
    pointerEvents: "none",
    outline: "0.125rem dashed rgba(15, 118, 110, 0.72)",
    borderRadius: "0.5rem",
    boxShadow: "0 0 0 0.375rem rgba(15, 118, 110, 0.12)",
    background: "rgba(255, 255, 255, 0.72)",
    padding: "0.125rem",
  }),
);

export const RegionOverlayButton = styled(ButtonBase, {
  shouldForwardProp: shouldForwardRegionStateProp,
})<{
  selectedState?: boolean;
  issueState?: boolean;
  regionLeft: number;
  regionTop: number;
  regionHeightPx: number;
  regionScale: number;
  toolMode: DecompositionTool;
}>(
  ({
    selectedState,
    issueState,
    regionLeft,
    regionTop,
    regionHeightPx,
    regionScale,
    toolMode,
  }) => ({
    position: "absolute",
    left: regionLeft,
    top: regionTop,
    width: 8 * regionScale,
    height: regionHeightPx,
    padding: "0.375rem",
    border:
      issueState === true
        ? "0.125rem solid rgba(190, 24, 93, 0.92)"
        : "0.125rem solid rgba(15, 118, 110, 0.92)",
    background:
      issueState === true
        ? "rgba(255, 241, 242, 0.18)"
        : "rgba(240, 253, 250, 0.18)",
    boxShadow:
      selectedState === true
        ? "0 0 0 0.375rem rgba(15, 118, 110, 0.12)"
        : "none",
    cursor: toolMode === "region" ? "grab" : "default",
    pointerEvents: toolMode === "region" ? "auto" : "none",
  }),
);

export const FloatingLibraryPreview = styled("div", {
  shouldForwardProp: shouldForwardLibraryStateProp,
})<{ dragClientX: number; dragClientY: number }>(
  ({ dragClientX, dragClientY }) => ({
    position: "fixed",
    left: dragClientX + 18,
    top: dragClientY + 18,
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
  }),
);

export const PortalOverlay = styled("div")({
  position: "fixed",
  inset: 0,
  zIndex: 320,
});

export const PositionedActionMenu = styled(ActionMenu, {
  shouldForwardProp: shouldForwardMenuPositionProp,
})<{
  menuTop: number;
  menuLeft: number;
  menuWidth: number;
  ready: boolean;
}>(({ menuTop, menuLeft, menuWidth, ready }) => ({
  top: menuTop,
  left: menuLeft,
  width: menuWidth,
  visibility: ready === true ? "visible" : "hidden",
}));

export const PositionedActionMenuButton = styled(ActionMenuButton, {
  shouldForwardProp: shouldForwardMenuPositionProp,
})<{ danger?: boolean }>(({ danger }) => ({
  color: danger === true ? "rgb(190, 24, 93)" : "var(--ink-strong)",
  background:
    danger === true ? "rgba(255, 241, 242, 0.96)" : "rgba(248, 250, 252, 0.96)",
}));

export const EmptyTilePreview = styled("div", {
  shouldForwardProp: shouldForwardPixelPreviewSizeProp,
})<{ previewWidth: number; previewHeight: number }>(
  ({ previewWidth, previewHeight }) => ({
    width: previewWidth,
    height: previewHeight,
    borderRadius: "0.5rem",
    background:
      "linear-gradient(180deg, rgba(15, 23, 42, 0.08), rgba(15, 23, 42, 0.02))",
    border: "0.0625rem dashed rgba(148, 163, 184, 0.34)",
  }),
);

export const PixelPreviewCell = styled("div", {
  shouldForwardProp: shouldForwardPixelPreviewSizeProp,
})<{ pixelSize: number; colorHex: string }>(({ pixelSize, colorHex }) => ({
  width: pixelSize,
  height: pixelSize,
  backgroundColor: colorHex,
}));

export const StageSurface = styled("div", {
  shouldForwardProp: shouldForwardStageProp,
})<{
  activeDrop?: boolean;
  stageWidthPx: number;
  stageHeightPx: number;
  stageScale: number;
}>(({ activeDrop, stageWidthPx, stageHeightPx, stageScale }) => ({
  position: "relative",
  width: stageWidthPx,
  height: stageHeightPx,
  minWidth: stageWidthPx,
  minHeight: stageHeightPx,
  overflow: "hidden",
  border:
    activeDrop === true
      ? "0.0625rem solid rgba(45, 212, 191, 0.72)"
      : "0.0625rem solid rgba(148, 163, 184, 0.22)",
  background:
    "linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(241, 245, 249, 0.98))",
  boxShadow:
    "0 1.75rem 3.75rem rgba(15, 23, 42, 0.22), inset 0 0.0625rem 0 rgba(255, 255, 255, 0.92)",
  transform: activeDrop === true ? "scale(1.01)" : "none",
  transition:
    "transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease",
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
      `${stageScale}px ${stageScale}px`,
      `${stageScale}px ${stageScale}px`,
      `${stageScale * 8}px ${stageScale * 8}px`,
      `${stageScale * 8}px ${stageScale * 8}px`,
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
    backgroundSize: `0.0625rem ${stageHeightPx}px, ${stageWidthPx}px 0.0625rem`,
    backgroundPosition: `${Math.floor(stageWidthPx / 2)}px 0, 0 ${Math.floor(stageHeightPx / 2)}px`,
    backgroundRepeat: "no-repeat",
    pointerEvents: "none",
  },
}));
