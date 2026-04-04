import {
  ButtonBase,
  Container,
  Grid as MaterialGrid,
  NativeSelect,
  OutlinedInput,
  Stack,
  type ContainerProps,
  type GridProps,
  type GridSize,
  type StackProps,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  Canvas as FabricCanvas,
  FabricImage,
  type CanvasEvents,
  type FabricObject,
} from "fabric";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useCharacterState } from "../../application/state/characterStore";
import {
  PaletteIndex,
  ProjectSpriteSize,
  useProjectState,
  type SpriteTile,
} from "../../application/state/projectStore";
import {
  analyzeCharacterDecomposition,
  applyCharacterDecomposition,
  CharacterDecompositionAnalysis,
  CharacterDecompositionCanvas,
  CharacterDecompositionIssue,
  CharacterDecompositionPixel,
  CharacterDecompositionRegion,
} from "../../domain/characters/characterDecomposition";
import {
  buildCharacterPreviewHexGrid,
  CharacterSet,
  CharacterSprite,
} from "../../domain/characters/characterSet";
import { type NesSpritePalettes } from "../../domain/nes/nesProject";
import { nesIndexToCssHex } from "../../domain/nes/palette";
import { renderSpriteTileToHexArray } from "../../domain/nes/rendering";
import { createEmptySpriteTile } from "../../domain/project/project";
import { mergeScreenIntoNesOam } from "../../domain/screen/oamSync";
import useExportImage from "../../infrastructure/browser/useExportImage";
import {
  ActionMenu,
  ActionMenuButton,
  Badge,
  CanvasViewport,
  DetailList,
  DetailRow,
  Field,
  FieldLabel,
  Panel,
  PanelHeader,
  PanelHeaderRow,
  PanelTitle,
  ScrollArea,
  ToolButton,
} from "../App.styles";
import {
  ensureSelectedCharacterSpriteIndex,
  getCharacterLayerEntriesBackToFront,
  getNextCharacterSpriteLayer,
  nudgeCharacterSprite,
  resolveCharacterStagePoint,
  resolveCharacterStageScale,
  resolveSelectionAfterSpriteRemoval,
  shiftCharacterSpriteLayer,
} from "./characterEditorModel";
import { SlotButton, SlotGroup, SlotLabel } from "./PalettePicker.styles";
import { ProjectActions } from "./ProjectActions";

const PREVIEW_TRANSPARENT_HEX = "#00000000";
const STAGE_WIDTH = 16;
const STAGE_HEIGHT = 16;
const STAGE_MIN_WIDTH = 16;
const STAGE_MAX_WIDTH = 1024;
const STAGE_MIN_HEIGHT = 16;
const STAGE_MAX_HEIGHT = 960;
const STAGE_MIN_ZOOM_LEVEL = 1;
const STAGE_MAX_ZOOM_LEVEL = 6;
const STAGE_DEFAULT_ZOOM_LEVEL = 2;
const STAGE_CONTEXT_MENU_WIDTH = 180;
const STAGE_CONTEXT_MENU_HEIGHT = 280;
const LIBRARY_PREVIEW_SCALE = 3;
const INSPECTOR_PREVIEW_SCALE = 4;
const DECOMPOSITION_COLOR_SLOTS: ReadonlyArray<1 | 2 | 3> = [1, 2, 3];
const TRANSPARENT_DECOMPOSITION_PIXEL: CharacterDecompositionPixel = {
  kind: "transparent",
};

const createDecompositionCanvas = (
  width: number,
  height: number,
): CharacterDecompositionCanvas => ({
  width,
  height,
  pixels: Array.from({ length: height }, () =>
    Array.from({ length: width }, () => TRANSPARENT_DECOMPOSITION_PIXEL),
  ),
});

const resizeDecompositionCanvas = (
  current: CharacterDecompositionCanvas,
  nextWidth: number,
  nextHeight: number,
): CharacterDecompositionCanvas => ({
  width: nextWidth,
  height: nextHeight,
  pixels: Array.from({ length: nextHeight }, (_, y) =>
    Array.from(
      { length: nextWidth },
      (_, x) => current.pixels[y]?.[x] ?? TRANSPARENT_DECOMPOSITION_PIXEL,
    ),
  ),
});

const isSameDecompositionPixel = (
  left: CharacterDecompositionPixel,
  right: CharacterDecompositionPixel,
): boolean => {
  if (left.kind !== right.kind) {
    return false;
  }

  if (left.kind === "transparent") {
    return true;
  }

  if (right.kind === "transparent") {
    return false;
  }

  return (
    left.paletteIndex === right.paletteIndex &&
    left.colorIndex === right.colorIndex
  );
};

const paintDecompositionPixel = (
  canvas: CharacterDecompositionCanvas,
  x: number,
  y: number,
  pixel: CharacterDecompositionPixel,
): CharacterDecompositionCanvas => {
  const currentPixel = canvas.pixels[y]?.[x] ?? TRANSPARENT_DECOMPOSITION_PIXEL;
  if (isSameDecompositionPixel(currentPixel, pixel)) {
    return canvas;
  }

  return {
    ...canvas,
    pixels: canvas.pixels.map((row, rowIndex) =>
      rowIndex === y
        ? row.map((currentRowPixel, columnIndex) =>
            columnIndex === x ? pixel : currentRowPixel,
          )
        : row,
    ),
  };
};

interface LibraryDragState {
  spriteIndex: number;
  pointerId: number;
  clientX: number;
  clientY: number;
  isOverStage: boolean;
  stageX: number;
  stageY: number;
}

interface ViewportPanState {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startScrollLeft: number;
  startScrollTop: number;
}

interface DecompositionDrawState {
  pointerId: number;
}

interface DecompositionRegionDragState {
  regionId: string;
  pointerId: number;
  offsetX: number;
  offsetY: number;
}

interface SpriteContextMenuState {
  clientX: number;
  clientY: number;
  spriteEditorIndex: number;
}

interface FabricSpriteObjectEntry {
  index: number;
  object: FabricObject;
}

type CharacterPreviewState =
  | { kind: "none" }
  | { kind: "error"; message: string }
  | { kind: "ready"; characterSet: CharacterSet; grid: string[][] };

type CharacterEditorMode = "compose" | "decompose";
type DecompositionTool = "pen" | "eraser" | "region";

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

const CharacterInput = styled(OutlinedInput)({
  width: "100%",
  borderRadius: "1rem",
  background: "var(--surface-quiet)",
  color: "var(--ink-strong)",
  boxShadow: "inset 0 0.0625rem 0 rgba(255, 255, 255, 0.85)",
  "& .MuiOutlinedInput-input": {
    padding: "0.8125rem 0.875rem",
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(148, 163, 184, 0.22)",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(15, 118, 110, 0.28)",
  },
  "&.Mui-focused": {
    boxShadow:
      "0 0 0 0.25rem rgba(15, 118, 110, 0.1), inset 0 0.0625rem 0 rgba(255, 255, 255, 0.85)",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(15, 118, 110, 0.4)",
  },
});

const CharacterSelectInput = styled(NativeSelect)({
  width: "100%",
  borderRadius: "1rem",
  background:
    "linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.92))",
  color: "var(--ink-strong)",
  "& .MuiNativeSelect-select": {
    padding: "0.8125rem 2.5rem 0.8125rem 0.875rem",
    borderRadius: "1rem",
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(148, 163, 184, 0.22)",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(15, 118, 110, 0.28)",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(15, 118, 110, 0.4)",
  },
  "& .MuiNativeSelect-icon": {
    right: "0.875rem",
    color: "var(--ink-soft)",
  },
});

const WideToolButton = styled(ToolButton)({
  width: "100%",
});

const FullWidthContainer = styled(BareContainer)({
  width: "100%",
  minWidth: 0,
});

const WorkspaceStageContainer = styled(FullWidthContainer)({
  minHeight: 0,
});

const ComposeSidebarContainer = styled(FullWidthContainer)(({ theme }) => ({
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

const ResponsiveAutoWidthContainer = styled(FullWidthContainer)(
  ({ theme }) => ({
    [theme.breakpoints.up("xl")]: {
      width: "auto",
    },
  }),
);

const StageInputContainer = styled(FullWidthContainer)(({ theme }) => ({
  [theme.breakpoints.up("sm")]: {
    width: "7.5rem",
  },
}));

const PaletteControlContainer = styled(FullWidthContainer)({
  flex: "1 1 10rem",
});

const WorkspaceColumnsGrid = styled(MaterialGrid)({
  width: "100%",
  minHeight: 0,
});

const ComposeSidebarGridItem = styled(MaterialGrid)(({ theme }) => ({
  width: "100%",
  [theme.breakpoints.up("lg")]: {
    flexBasis: "17.5rem",
    maxWidth: "17.5rem",
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

const WorkspaceStageGridItem = styled(MaterialGrid)({
  width: "100%",
  minWidth: 0,
  flex: "1 1 0",
});

const ResponsiveHeaderGrid = createStackLayout("ResponsiveHeaderGrid", {
  direction: { xs: "column", xl: "row" },
  flexWrap: "wrap",
  spacing: "0.75rem",
  alignItems: "end",
});

type CharacterWorkspaceGridProps = StackProps & {
  decompose?: boolean;
};

const CharacterWorkspaceGrid = React.forwardRef<
  HTMLDivElement,
  CharacterWorkspaceGridProps
>(function CharacterWorkspaceGrid({ decompose, children, ...props }, ref) {
  const childrenArray = React.Children.toArray(children);
  const sidebar = childrenArray[0];
  const stage = childrenArray[1];
  const decompositionSidebar = childrenArray[2];

  if (decompose === true) {
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
              {decompositionSidebar}
            </DecompositionInspectorContainer>
          </DecompositionInspectorGridItem>
        </WorkspaceColumnsGrid>
      </Stack>
    );
  }

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

const PreviewHeaderLayout = createStackLayout("PreviewHeaderLayout", {
  direction: { xs: "column", md: "row" },
  spacing: "0.75rem",
  alignItems: "center",
});

const PreviewControlsRow = createStackLayout("PreviewControlsRow", {
  direction: "row",
  flexWrap: "wrap",
  spacing: "0.625rem",
  alignItems: "center",
  justifyContent: { xs: "start", md: "stretch" },
});

const DecompositionToolGrid = createStackLayout("DecompositionToolGrid", {
  direction: "row",
  flexWrap: "wrap",
  spacing: "0.625rem",
  alignItems: "center",
});

const DecompositionSidebar = createStackLayout("DecompositionSidebar", {
  minWidth: 0,
  minHeight: 0,
  spacing: "1rem",
  overflow: "auto",
  pr: "0.25rem",
});

const CharacterWorkspaceRoot = createStackLayout("CharacterWorkspaceRoot", {
  minHeight: 0,
  spacing: "1rem",
});

const SidebarColumn = createStackLayout("SidebarColumn", {
  minWidth: 0,
  minHeight: 0,
  spacing: "1rem",
  overflow: "auto",
  pr: "0.25rem",
});

const EditorCardRoot = styled("div")(editorCardStyles);

const EditorCard = createStackLayout("EditorCard", {
  component: EditorCardRoot,
  minHeight: 0,
  spacing: "0.875rem",
  p: "1rem",
});

const LibraryCard = createStackLayout("LibraryCard", {
  component: EditorCardRoot,
  minHeight: 0,
  spacing: "0.875rem",
  p: "1rem",
});

const LibraryScrollArea = styled(ScrollArea)({
  // Keep scrollbar layout stable without reserving an unnecessary leading gutter.
  scrollbarGutter: "stable",
});

type StageEditorCardProps = StackProps & { decompose?: boolean };

const StageEditorCard = React.forwardRef<HTMLDivElement, StageEditorCardProps>(
  function StageEditorCard({ decompose, ...props }, ref) {
    void decompose;
    return <EditorCard ref={ref} {...props} />;
  },
);

const RegionListCard = createStackLayout("RegionListCard", {
  component: EditorCardRoot,
  minHeight: 0,
  spacing: "0.875rem",
  p: "1rem",
});

const EditorFieldStack = createStackLayout("EditorFieldStack", {
  component: "label",
  spacing: "0.625rem",
});

const TwoOptionGrid = createUniformGridLayout("TwoOptionGrid", 2, 1, 1.25);

const LibraryGrid = createUniformGridLayout("LibraryGrid", 2, 1, 1.25);

const LibrarySpriteButton = styled(ButtonBase, {
  shouldForwardProp: shouldForwardLibraryStateProp,
})<{ dragging?: boolean; draggableState?: boolean }>(
  ({ dragging, draggableState }) => ({
    appearance: "none",
    minHeight: "7.375rem",
    padding: "0.75rem",
    borderRadius: "1.125rem",
    border:
      dragging === true
        ? "0.0625rem solid rgba(15, 118, 110, 0.42)"
        : "0.0625rem solid rgba(148, 163, 184, 0.2)",
    background:
      dragging === true
        ? "rgba(240, 253, 250, 0.96)"
        : "linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(241, 245, 249, 0.94))",
    color: "var(--ink-strong)",
    cursor: draggableState === true ? "grab" : "default",
    userSelect: "none",
    touchAction: "none",
    transition:
      "transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease",
    boxShadow:
      dragging === true
        ? "0 1rem 1.875rem rgba(15, 118, 110, 0.16)"
        : "0 0.625rem 1.125rem rgba(15, 23, 42, 0.08)",
  }),
);

const LibrarySpriteTitle = styled("span")({
  fontSize: "0.6875rem",
  fontWeight: 800,
  letterSpacing: "0.08em",
  color: "var(--ink-soft)",
});

const LibrarySpritePreviewFrame = styled(Stack)({
  width: "5.5rem",
  minHeight: "4rem",
  borderRadius: "0.875rem",
  background:
    "linear-gradient(180deg, rgba(15, 23, 42, 0.06), rgba(148, 163, 184, 0.08))",
});

const DecompositionToolCardRoot = styled("div")({
  borderRadius: "1.125rem",
  background:
    "linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(241, 245, 249, 0.9))",
  border: "0.0625rem solid rgba(148, 163, 184, 0.18)",
});

const DecompositionToolCard = createStackLayout("DecompositionToolCard", {
  component: DecompositionToolCardRoot,
  spacing: "0.75rem",
  p: "0.75rem",
});

const PaletteControlRow = createStackLayout("PaletteControlRow", {
  direction: "row",
  flexWrap: "wrap",
  spacing: "0.625rem",
  alignItems: "center",
});

const PaletteSlotGrid = createUniformGridLayout("PaletteSlotGrid", 3, 1, 1);

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

const CharacterStageViewport = React.forwardRef<
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

const ViewportCenterWrap = styled("div")({
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

const ComposeCanvasMount = React.memo(function ComposeCanvasMount({
  onCanvasRef,
}: {
  onCanvasRef: (element: HTMLCanvasElement | null) => void;
}) {
  return <StageCanvasElement ref={onCanvasRef} aria-hidden="true" />;
});

const DecompositionCanvasElement = styled(StageCanvasElement, {
  shouldForwardProp: shouldForwardCanvasCursorProp,
})<{ cursorStyle: string }>(({ cursorStyle }) => ({
  imageRendering: "pixelated",
  cursor: cursorStyle,
}));

const StageDragPreview = styled("div", {
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

const RegionOverlayButton = styled(ButtonBase, {
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

const RegionPreviewSurfaceRoot = styled("div")({
  borderRadius: "1.125rem",
  background:
    "linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(241, 245, 249, 0.92))",
  border: "0.0625rem solid rgba(148, 163, 184, 0.18)",
});

const RegionPreviewSurface = createStackLayout("RegionPreviewSurface", {
  component: RegionPreviewSurfaceRoot,
  minHeight: "6.75rem",
  alignItems: "center",
  justifyContent: "center",
});

const InspectorSection = createStackLayout("InspectorSection", {
  spacing: "0.625rem",
});

const InspectorFieldGrid = createUniformGridLayout(
  "InspectorFieldGrid",
  2,
  1,
  1.5,
);

const DualActionGrid = createUniformGridLayout("DualActionGrid", 2, 1, 1.25);

const RegionList = createStackLayout("RegionList", {
  spacing: "0.625rem",
});

const RegionListButton = styled(ButtonBase, {
  shouldForwardProp: createShouldForwardProp(["selectedState"]),
})<{ selectedState?: boolean }>(({ selectedState }) => ({
  appearance: "none",
  padding: "0.75rem",
  borderRadius: "1.125rem",
  border:
    selectedState === true
      ? "0.0625rem solid rgba(15, 118, 110, 0.38)"
      : "0.0625rem solid rgba(148, 163, 184, 0.2)",
  background:
    selectedState === true
      ? "rgba(240, 253, 250, 0.96)"
      : "linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(241, 245, 249, 0.94))",
  color: "var(--ink-strong)",
  textAlign: "left",
  boxShadow:
    selectedState === true
      ? "0 1.125rem 2rem rgba(15, 118, 110, 0.12)"
      : "0 0.625rem 1.125rem rgba(15, 23, 42, 0.06)",
}));

const RegionMetaRow = createStackLayout("RegionMetaRow", {
  direction: "row",
  flexWrap: "wrap",
  spacing: "0.5rem",
});

const FloatingLibraryPreview = styled("div", {
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

const PortalOverlay = styled("div")({
  position: "fixed",
  inset: 0,
  zIndex: 320,
});

const PositionedActionMenu = styled(ActionMenu, {
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

const PositionedActionMenuButton = styled(ActionMenuButton, {
  shouldForwardProp: shouldForwardMenuPositionProp,
})<{ danger?: boolean }>(({ danger }) => ({
  color: danger === true ? "rgb(190, 24, 93)" : "var(--ink-strong)",
  background:
    danger === true ? "rgba(255, 241, 242, 0.96)" : "rgba(248, 250, 252, 0.96)",
}));

const EmptyTilePreview = styled("div", {
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

const PixelPreviewCell = styled("div", {
  shouldForwardProp: shouldForwardPixelPreviewSizeProp,
})<{ pixelSize: number; colorHex: string }>(({ pixelSize, colorHex }) => ({
  width: pixelSize,
  height: pixelSize,
  backgroundColor: colorHex,
}));

const StageSurface = styled("div", {
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

const isInRange = (value: number, min: number, max: number): boolean =>
  value >= min && value <= max;

const toNumber = (value: string): O.Option<number> => {
  if (value === "") {
    return O.none;
  }

  const parsed = Number(value);
  if (Number.isInteger(parsed) === false) {
    return O.none;
  }

  return O.some(parsed);
};

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const trySetPointerCapture = (target: HTMLElement, pointerId: number): void => {
  try {
    target.setPointerCapture(pointerId);
  } catch {
    // Synthetic pointer events used in tests may not have a capturable pointer.
  }
};

const createComposeSpriteSource = (
  spriteIndex: number,
  sprites: SpriteTile[],
  spritePalettes: NesSpritePalettes,
): O.Option<HTMLCanvasElement> => {
  if (typeof document === "undefined") {
    return O.none;
  }

  const tileOption = O.fromNullable(sprites[spriteIndex]);
  if (O.isNone(tileOption)) {
    return O.none;
  }

  const tile = tileOption.value;
  const sourceCanvas = Object.assign(document.createElement("canvas"), {
    width: tile.width,
    height: tile.height,
  });
  const contextOption = O.fromNullable(sourceCanvas.getContext("2d"));
  if (O.isNone(contextOption)) {
    return O.none;
  }

  const context = contextOption.value;
  const hexPixels = renderSpriteTileToHexArray(tile, spritePalettes);
  context.clearRect(0, 0, tile.width, tile.height);

  tile.pixels.forEach((pixelRow, rowIndex) => {
    pixelRow.forEach((colorIndex, columnIndex) => {
      if (colorIndex === 0) {
        return;
      }

      const colorHexOption = pipe(
        O.fromNullable(hexPixels[rowIndex]),
        O.chain((hexRow) => O.fromNullable(hexRow[columnIndex])),
      );

      if (O.isNone(colorHexOption)) {
        return;
      }

      Object.assign(context, {
        fillStyle: colorHexOption.value,
      });
      context.fillRect(columnIndex, rowIndex, 1, 1);
    });
  });

  return O.some(sourceCanvas);
};

const findComposeObjectEntry = (
  entries: ReadonlyArray<FabricSpriteObjectEntry>,
  target?: FabricObject,
): O.Option<FabricSpriteObjectEntry> =>
  pipe(
    O.fromNullable(target),
    O.chain((currentTarget) =>
      O.fromNullable(entries.find((entry) => entry.object === currentTarget)),
    ),
  );

const isMouseLikeCanvasEvent = (
  event: CanvasEvents["mouse:down"]["e"],
): event is MouseEvent | PointerEvent =>
  "button" in event && "clientX" in event && "clientY" in event;

const isSameOptionalNumber = (
  left: O.Option<number>,
  right: O.Option<number>,
): boolean =>
  pipe(
    left,
    O.match(
      () => O.isNone(right),
      (leftValue) =>
        pipe(
          right,
          O.match(
            () => false,
            (rightValue) => rightValue === leftValue,
          ),
        ),
    ),
  );

const clampDecompositionRegion = (
  region: CharacterDecompositionRegion,
  width: number,
  height: number,
  spriteSize: ProjectSpriteSize,
): CharacterDecompositionRegion => ({
  ...region,
  x: clamp(region.x, 0, Math.max(width - 8, 0)),
  y: clamp(region.y, 0, Math.max(height - spriteSize, 0)),
});

const clampDecompositionRegions = (
  regions: CharacterDecompositionRegion[],
  width: number,
  height: number,
  spriteSize: ProjectSpriteSize,
): CharacterDecompositionRegion[] =>
  regions.map((region) =>
    clampDecompositionRegion(region, width, height, spriteSize),
  );

const isSpriteTileEmpty = (pixels: number[][]): boolean =>
  pixels.every((row) => row.every((colorIndex) => colorIndex === 0));

const isProjectSpriteSizeLocked = (
  sprites: ReturnType<typeof useProjectState.getState>["sprites"],
  screenSpriteCount: number,
  characterSets: CharacterSet[],
): boolean =>
  screenSpriteCount > 0 ||
  sprites.some((sprite) => isSpriteTileEmpty(sprite.pixels) === false) ||
  characterSets.some((characterSet) => characterSet.sprites.length > 0);

const getIssueLabel = (issue: CharacterDecompositionIssue): string => {
  if (issue === "mixed-palette") {
    return "複数パレット";
  }

  if (issue === "overlap") {
    return "重なり";
  }

  if (issue === "out-of-bounds") {
    return "範囲外";
  }

  return "空領域";
};

const getRegionStatusLabel = (
  region: CharacterDecompositionAnalysis["regions"][number],
): string => {
  if (region.issues.length > 0) {
    const issueOption = O.fromNullable(region.issues[0]);
    return pipe(
      issueOption,
      O.match(
        () => "空領域",
        (issue) => getIssueLabel(issue),
      ),
    );
  }

  if (region.resolution.kind === "existing") {
    return `再利用 #${region.resolution.spriteIndex}`;
  }

  if (region.resolution.kind === "planned") {
    return "新規追加";
  }

  return "未解決";
};

export const CharacterMode: React.FC = () => {
  const [newName, setNewName] = useState("New Character");
  const [editorMode, setEditorMode] = useState<CharacterEditorMode>("compose");
  const [stageWidth, setStageWidth] = useState(STAGE_WIDTH);
  const [stageHeight, setStageHeight] = useState(STAGE_HEIGHT);
  const [stageZoomLevel, setStageZoomLevel] = useState(
    STAGE_DEFAULT_ZOOM_LEVEL,
  );
  const [libraryDragState, setLibraryDragState] = useState<
    O.Option<LibraryDragState>
  >(O.none);
  const [viewportPanState, setViewportPanState] = useState<
    O.Option<ViewportPanState>
  >(O.none);
  const [selectedSpriteEditorIndex, setSelectedSpriteEditorIndex] = useState<
    O.Option<number>
  >(O.none);
  const [spriteContextMenu, setSpriteContextMenu] = useState<
    O.Option<SpriteContextMenuState>
  >(O.none);
  const [decompositionTool, setDecompositionTool] =
    useState<DecompositionTool>("pen");
  const [decompositionPaletteIndex, setDecompositionPaletteIndex] =
    useState<PaletteIndex>(0);
  const [decompositionColorIndex, setDecompositionColorIndex] = useState<
    1 | 2 | 3
  >(1);
  const [decompositionCanvas, setDecompositionCanvas] = useState(
    createDecompositionCanvas(STAGE_WIDTH, STAGE_HEIGHT),
  );
  const [decompositionRegions, setDecompositionRegions] = useState<
    CharacterDecompositionRegion[]
  >([]);
  const [decompositionDrawState, setDecompositionDrawState] = useState<
    O.Option<DecompositionDrawState>
  >(O.none);
  const [decompositionRegionDragState, setDecompositionRegionDragState] =
    useState<O.Option<DecompositionRegionDragState>>(O.none);
  const [selectedRegionId, setSelectedRegionId] = useState<O.Option<string>>(
    O.none,
  );
  const stageElementRef = useRef<O.Option<HTMLDivElement>>(O.none);
  const viewportElementRef = useRef<O.Option<HTMLDivElement>>(O.none);
  const composeCanvasElementRef = useRef<O.Option<HTMLCanvasElement>>(O.none);
  const composeFabricCanvasRef = useRef<O.Option<FabricCanvas>>(O.none);
  const composeFabricObjectEntriesRef = useRef<
    ReadonlyArray<FabricSpriteObjectEntry>
  >([]);
  const decompositionCanvasRef = useRef<O.Option<HTMLCanvasElement>>(O.none);

  const characterSets = useCharacterState((s) => s.characterSets);
  const selectedCharacterId = useCharacterState((s) => s.selectedCharacterId);
  const createSet = useCharacterState((s) => s.createSet);
  const selectSet = useCharacterState((s) => s.selectSet);
  const renameSet = useCharacterState((s) => s.renameSet);
  const addSprite = useCharacterState((s) => s.addSprite);
  const setSprite = useCharacterState((s) => s.setSprite);
  const removeSprite = useCharacterState((s) => s.removeSprite);
  const deleteSet = useCharacterState((s) => s.deleteSet);

  const projectSpriteSize = useProjectState((s) => s.spriteSize);
  const sprites = useProjectState((s) => s.sprites);
  const screen = useProjectState((s) => s.screen);
  const spritePalettes = useProjectState((s) => s.nes.spritePalettes);
  const { exportPng, exportSvgSimple, exportCharacterJson } = useExportImage();

  const activeSet = useMemo(
    () =>
      pipe(
        selectedCharacterId,
        O.chain((id) =>
          O.fromNullable(
            characterSets.find((characterSet) => characterSet.id === id),
          ),
        ),
      ),
    [characterSets, selectedCharacterId],
  );

  const stageScale = useMemo(
    () => resolveCharacterStageScale(stageWidth, stageHeight, stageZoomLevel),
    [stageHeight, stageWidth, stageZoomLevel],
  );

  const validSelectedSpriteEditorIndex = useMemo(
    () =>
      pipe(
        activeSet,
        O.chain((characterSet) =>
          ensureSelectedCharacterSpriteIndex(
            selectedSpriteEditorIndex,
            characterSet.sprites.length,
          ),
        ),
      ),
    [activeSet, selectedSpriteEditorIndex],
  );

  const selectedSprite = useMemo(
    () =>
      pipe(
        activeSet,
        O.chain((characterSet) =>
          pipe(
            validSelectedSpriteEditorIndex,
            O.chain((index) =>
              pipe(
                O.fromNullable(characterSet.sprites[index]),
                O.map((sprite) => ({ index, sprite })),
              ),
            ),
          ),
        ),
      ),
    [activeSet, validSelectedSpriteEditorIndex],
  );

  useEffect(() => {
    if (editorMode === "compose" && O.isSome(selectedSprite)) {
      return;
    }

    setSpriteContextMenu(O.none);
  }, [editorMode, selectedSprite]);

  const projectSpriteSizeLocked = useMemo(
    () =>
      isProjectSpriteSizeLocked(sprites, screen.sprites.length, characterSets),
    [characterSets, screen.sprites.length, sprites],
  );

  const decompositionAnalysis = useMemo(
    () =>
      analyzeCharacterDecomposition({
        canvas: decompositionCanvas,
        regions: decompositionRegions,
        spriteSize: projectSpriteSize,
        sprites,
      }),
    [decompositionCanvas, decompositionRegions, projectSpriteSize, sprites],
  );

  const selectedRegionAnalysis = useMemo(
    () =>
      pipe(
        selectedRegionId,
        O.chain((regionId) =>
          O.fromNullable(
            decompositionAnalysis.regions.find(
              (regionAnalysis) => regionAnalysis.region.id === regionId,
            ),
          ),
        ),
      ),
    [decompositionAnalysis.regions, selectedRegionId],
  );

  const previewState: CharacterPreviewState = useMemo(
    () =>
      pipe(
        activeSet,
        O.match(
          (): CharacterPreviewState => ({ kind: "none" }),
          (characterSet): CharacterPreviewState => {
            const preview = buildCharacterPreviewHexGrid(characterSet, {
              sprites,
              palettes: spritePalettes,
              transparentHex: PREVIEW_TRANSPARENT_HEX,
            });

            if (E.isLeft(preview)) {
              return { kind: "error", message: preview.left };
            }

            return {
              kind: "ready",
              characterSet,
              grid: preview.right,
            };
          },
        ),
      ),
    [activeSet, sprites, spritePalettes],
  );

  const activeSetName = pipe(
    activeSet,
    O.match(
      () => "",
      (characterSet) => characterSet.name,
    ),
  );

  const activeSetSpriteCount = pipe(
    activeSet,
    O.match(
      () => 0,
      (characterSet) => characterSet.sprites.length,
    ),
  );
  const selectedSpriteStageMetadata = pipe(
    selectedSprite,
    O.match(
      () => ({
        index: "",
        x: "",
        y: "",
        layer: "",
      }),
      ({ index, sprite }) => ({
        index: `${index}`,
        x: `${sprite.x}`,
        y: `${sprite.y}`,
        layer: `${sprite.layer}`,
      }),
    ),
  );

  const decompositionValidRegionCount = decompositionAnalysis.regions.filter(
    (region) => region.issues.length === 0,
  ).length;
  const decompositionInvalidRegionCount =
    decompositionAnalysis.regions.length - decompositionValidRegionCount;

  const decompositionCanvasCursor = (() => {
    if (decompositionTool === "region") {
      return "copy";
    }

    if (decompositionTool === "eraser") {
      return "cell";
    }

    return "crosshair";
  })();

  const handleComposeCanvasRef = useCallback(
    (element: HTMLCanvasElement | null) => {
      composeCanvasElementRef.current = O.fromNullable(element);
    },
    [],
  );

  useEffect(() => {
    if (O.isNone(decompositionCanvasRef.current)) {
      return;
    }

    const canvasElement = decompositionCanvasRef.current.value;
    const contextOption = O.fromNullable(canvasElement.getContext("2d"));
    if (O.isNone(contextOption)) {
      return;
    }

    const context = contextOption.value;
    const scaledWidth = stageWidth * stageScale;
    const scaledHeight = stageHeight * stageScale;
    const rgbaValues = decompositionCanvas.pixels.flatMap((pixelRow) =>
      Array.from({ length: stageScale }, () =>
        pixelRow.flatMap((pixel) => {
          if (pixel.kind === "transparent") {
            return Array.from({ length: stageScale }, () => [
              0, 0, 0, 0,
            ]).flat();
          }

          const hex = nesIndexToCssHex(
            spritePalettes[pixel.paletteIndex][pixel.colorIndex],
          );
          const r = Number.parseInt(hex.slice(1, 3), 16);
          const g = Number.parseInt(hex.slice(3, 5), 16);
          const b = Number.parseInt(hex.slice(5, 7), 16);

          return Array.from({ length: stageScale }, () => [
            r,
            g,
            b,
            255,
          ]).flat();
        }),
      ).flat(),
    );
    const imageData = new ImageData(
      Uint8ClampedArray.from(rgbaValues),
      scaledWidth,
      scaledHeight,
    );

    context.clearRect(0, 0, scaledWidth, scaledHeight);
    context.putImageData(imageData, 0, 0);
  }, [
    decompositionCanvas,
    spritePalettes,
    stageHeight,
    stageScale,
    stageWidth,
  ]);

  const getStageRect = (): O.Option<DOMRect> =>
    pipe(
      stageElementRef.current,
      O.map((stage) => stage.getBoundingClientRect()),
    );

  const getViewportElement = (): O.Option<HTMLDivElement> =>
    viewportElementRef.current;

  const resolveDecompositionStagePoint = (
    clientX: number,
    clientY: number,
    offsetX = 0,
    offsetY = 0,
    maxX = stageWidth - 1,
    maxY = stageHeight - 1,
  ): O.Option<{ x: number; y: number }> =>
    pipe(
      getStageRect(),
      O.map((stageRect) =>
        resolveCharacterStagePoint({
          clientX,
          clientY,
          stageLeft: stageRect.left,
          stageTop: stageRect.top,
          stageScale,
          offsetX,
          offsetY,
          minX: 0,
          maxX,
          minY: 0,
          maxY,
        }),
      ),
    );

  const updateStageZoomLevel = (
    nextZoomLevel: number,
    anchor: O.Option<{ clientX: number; clientY: number }> = O.none,
  ) => {
    setStageZoomLevel((current) => {
      const clampedZoomLevel = clamp(
        nextZoomLevel,
        STAGE_MIN_ZOOM_LEVEL,
        STAGE_MAX_ZOOM_LEVEL,
      );

      if (clampedZoomLevel === current) {
        return current;
      }

      if (O.isNone(anchor)) {
        return clampedZoomLevel;
      }

      pipe(
        getViewportElement(),
        O.map((viewportElement) => {
          const viewport = viewportElement;
          const rect = viewport.getBoundingClientRect();
          const relativeX = anchor.value.clientX - rect.left;
          const relativeY = anchor.value.clientY - rect.top;
          const currentStageX = viewport.scrollLeft + relativeX;
          const currentStageY = viewport.scrollTop + relativeY;
          const currentScale = resolveCharacterStageScale(
            stageWidth,
            stageHeight,
            current,
          );
          const nextScale = resolveCharacterStageScale(
            stageWidth,
            stageHeight,
            clampedZoomLevel,
          );

          window.requestAnimationFrame(() => {
            viewport.scrollTo({
              left: (currentStageX / currentScale) * nextScale - relativeX,
              top: (currentStageY / currentScale) * nextScale - relativeY,
            });
          });
        }),
      );

      return clampedZoomLevel;
    });
  };

  const createLibraryDragState = (
    spriteIndex: number,
    pointerId: number,
    clientX: number,
    clientY: number,
  ): LibraryDragState => {
    const stageRectOption = getStageRect();
    const tileOption = O.fromNullable(sprites[spriteIndex]);

    if (O.isNone(stageRectOption) || O.isNone(tileOption)) {
      return {
        spriteIndex,
        pointerId,
        clientX,
        clientY,
        isOverStage: false,
        stageX: 0,
        stageY: 0,
      };
    }

    const stageRect = stageRectOption.value;
    const isOverStage =
      clientX >= stageRect.left &&
      clientX <= stageRect.right &&
      clientY >= stageRect.top &&
      clientY <= stageRect.bottom;

    if (isOverStage === false) {
      return {
        spriteIndex,
        pointerId,
        clientX,
        clientY,
        isOverStage,
        stageX: 0,
        stageY: 0,
      };
    }

    const tile = tileOption.value;
    const nextPoint = resolveCharacterStagePoint({
      clientX,
      clientY,
      stageLeft: stageRect.left,
      stageTop: stageRect.top,
      stageScale,
      offsetX: (tile.width * stageScale) / 2,
      offsetY: (tile.height * stageScale) / 2,
      minX: 0,
      maxX: stageWidth - 1,
      minY: 0,
      maxY: stageHeight - 1,
    });

    return {
      spriteIndex,
      pointerId,
      clientX,
      clientY,
      isOverStage,
      stageX: nextPoint.x,
      stageY: nextPoint.y,
    };
  };

  const renderTilePixels = (
    tileOption: O.Option<(typeof sprites)[number]>,
    scale: number,
    keyPrefix: string,
  ) => {
    if (O.isNone(tileOption)) {
      return (
        <EmptyTilePreview previewWidth={8 * scale} previewHeight={16 * scale} />
      );
    }

    const tile = tileOption.value;
    const hexPixels = renderSpriteTileToHexArray(tile, spritePalettes);

    return (
      <Stack
        spacing={0}
        width={tile.width * scale}
        height={tile.height * scale}
        alignItems="stretch"
      >
        {tile.pixels.map((pixelRow, rowIndex) => (
          <Stack
            key={`pixel-row-${keyPrefix}-${rowIndex}`}
            direction="row"
            spacing={0}
            alignItems="stretch"
          >
            {pixelRow.map((colorIndex, columnIndex) => {
              const hexRowOption = O.fromNullable(hexPixels[rowIndex]);
              const hexOption = pipe(
                hexRowOption,
                O.chain((row) => O.fromNullable(row[columnIndex])),
              );
              const colorHex = pipe(
                hexOption,
                O.getOrElse(() => PREVIEW_TRANSPARENT_HEX),
              );
              const isTransparent = colorIndex === 0;
              return (
                <PixelPreviewCell
                  key={`pixel-${keyPrefix}-${rowIndex}-${columnIndex}`}
                  pixelSize={scale}
                  colorHex={isTransparent ? "transparent" : colorHex}
                />
              );
            })}
          </Stack>
        ))}
      </Stack>
    );
  };

  const renderSpritePixels = (spriteIndex: number, scale: number) =>
    renderTilePixels(
      O.fromNullable(sprites[spriteIndex]),
      scale,
      `sprite-${spriteIndex}`,
    );

  const handleCreateSet = () => {
    createSet({ name: newName });
    setSelectedSpriteEditorIndex(O.none);
    setSelectedRegionId(O.none);
    setLibraryDragState(O.none);
  };

  const handleSelectSet = (value: string) => {
    selectSet(value === "" ? O.none : O.some(value));
    setSelectedSpriteEditorIndex(O.none);
    setSelectedRegionId(O.none);
    setLibraryDragState(O.none);
  };

  const handleDeleteSet = (setId: string) => {
    deleteSet(setId);
    setSelectedSpriteEditorIndex(O.none);
    setSelectedRegionId(O.none);
    setLibraryDragState(O.none);
  };

  const handleProjectSpriteSizeChange = (nextSpriteSize: ProjectSpriteSize) => {
    if (
      projectSpriteSizeLocked === true ||
      projectSpriteSize === nextSpriteSize
    ) {
      return;
    }

    const currentState = useProjectState.getState();
    const nextSprites = currentState.sprites.map((sprite) =>
      createEmptySpriteTile(nextSpriteSize, sprite.paletteIndex),
    );
    const nextScreen = {
      ...currentState.screen,
      sprites: [],
    };
    const nextNes = mergeScreenIntoNesOam(
      {
        ...currentState.nes,
        ppuControl: {
          ...currentState.nes.ppuControl,
          spriteSize: nextSpriteSize,
        },
      },
      nextScreen,
    );

    useProjectState.setState({
      spriteSize: nextSpriteSize,
      sprites: nextSprites,
      screen: nextScreen,
      nes: nextNes,
    });
    setSelectedSpriteEditorIndex(O.none);
    setDecompositionRegions([]);
    setSelectedRegionId(O.none);
  };

  const handleZoomOut = () => {
    updateStageZoomLevel(stageZoomLevel - 1, O.none);
  };

  const handleZoomIn = () => {
    updateStageZoomLevel(stageZoomLevel + 1, O.none);
  };

  const clampSpritesToStage = (
    setId: string,
    currentSprites: CharacterSprite[],
    nextWidth: number,
    nextHeight: number,
  ) => {
    currentSprites.forEach((sprite, index) => {
      const nextX = clamp(sprite.x, 0, nextWidth - 1);
      const nextY = clamp(sprite.y, 0, nextHeight - 1);

      if (nextX === sprite.x && nextY === sprite.y) {
        return;
      }

      setSprite(setId, index, {
        ...sprite,
        x: nextX,
        y: nextY,
      });
    });
  };

  const handleStageWidthChange = (rawValue: string) => {
    const parsed = toNumber(rawValue);

    if (O.isNone(parsed)) {
      return;
    }

    const nextWidth = clamp(parsed.value, STAGE_MIN_WIDTH, STAGE_MAX_WIDTH);
    setStageWidth(nextWidth);
    setDecompositionCanvas((current) =>
      resizeDecompositionCanvas(current, nextWidth, stageHeight),
    );
    setDecompositionRegions((current) =>
      clampDecompositionRegions(
        current,
        nextWidth,
        stageHeight,
        projectSpriteSize,
      ),
    );
    pipe(
      activeSet,
      O.map((characterSet) =>
        clampSpritesToStage(
          characterSet.id,
          characterSet.sprites,
          nextWidth,
          stageHeight,
        ),
      ),
    );
  };

  const handleStageHeightChange = (rawValue: string) => {
    const parsed = toNumber(rawValue);

    if (O.isNone(parsed)) {
      return;
    }

    const nextHeight = clamp(parsed.value, STAGE_MIN_HEIGHT, STAGE_MAX_HEIGHT);
    setStageHeight(nextHeight);
    setDecompositionCanvas((current) =>
      resizeDecompositionCanvas(current, stageWidth, nextHeight),
    );
    setDecompositionRegions((current) =>
      clampDecompositionRegions(
        current,
        stageWidth,
        nextHeight,
        projectSpriteSize,
      ),
    );
    pipe(
      activeSet,
      O.map((characterSet) =>
        clampSpritesToStage(
          characterSet.id,
          characterSet.sprites,
          stageWidth,
          nextHeight,
        ),
      ),
    );
  };

  const handleViewportWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (event.ctrlKey === false) {
      return;
    }

    event.preventDefault();
    updateStageZoomLevel(
      event.deltaY < 0 ? stageZoomLevel + 1 : stageZoomLevel - 1,
      O.some({ clientX: event.clientX, clientY: event.clientY }),
    );
  };

  const handleViewportPointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (event.button !== 1) {
      return;
    }

    event.preventDefault();
    setViewportPanState(
      O.some({
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startScrollLeft: event.currentTarget.scrollLeft,
        startScrollTop: event.currentTarget.scrollTop,
      }),
    );
    trySetPointerCapture(event.currentTarget, event.pointerId);
  };

  const handleViewportPointerMove = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (O.isNone(viewportPanState)) {
      return;
    }

    if (viewportPanState.value.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - viewportPanState.value.startClientX;
    const deltaY = event.clientY - viewportPanState.value.startClientY;
    const viewport = event.currentTarget;
    viewport.scrollTo({
      left: viewportPanState.value.startScrollLeft - deltaX,
      top: viewportPanState.value.startScrollTop - deltaY,
    });
  };

  const handleViewportPointerEnd = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (O.isNone(viewportPanState)) {
      return;
    }

    if (viewportPanState.value.pointerId !== event.pointerId) {
      return;
    }

    setViewportPanState(O.none);
  };

  const handleWorkspacePointerDownCapture = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (
      typeof Element !== "undefined" &&
      event.target instanceof Element &&
      event.target.closest("[data-sprite-context-menu-root='true']") instanceof
        Element
    ) {
      return;
    }

    setSpriteContextMenu(O.none);
  };

  const handleComposeContextMenu = (event: React.MouseEvent<HTMLElement>) => {
    if (editorMode !== "compose") {
      return;
    }

    event.preventDefault();
  };

  const focusStageElement = () => {
    pipe(
      stageElementRef.current,
      O.map((stageElement) => stageElement.focus()),
    );
  };

  useLayoutEffect(() => {
    if (O.isNone(composeCanvasElementRef.current)) {
      return;
    }

    const composeCanvas = new FabricCanvas(
      composeCanvasElementRef.current.value,
      {
        defaultCursor: "default",
        enablePointerEvents: true,
        fireRightClick: true,
        fireMiddleClick: true,
        hoverCursor: "grab",
        imageSmoothingEnabled: false,
        moveCursor: "grabbing",
        preserveObjectStacking: true,
        selection: false,
        stopContextMenu: true,
      },
    );
    composeCanvas.upperCanvasEl.setAttribute(
      "aria-label",
      "合成描画キャンバス",
    );
    composeCanvas.wrapperEl.setAttribute("aria-label", "合成描画キャンバス");
    composeCanvas.lowerCanvasEl.style.setProperty(
      "image-rendering",
      "pixelated",
    );
    composeCanvas.upperCanvasEl.style.setProperty(
      "image-rendering",
      "pixelated",
    );
    Object.assign(composeFabricCanvasRef, {
      current: O.some(composeCanvas),
    });

    return () => {
      Object.assign(composeFabricObjectEntriesRef, {
        current: [],
      });
      Object.assign(composeFabricCanvasRef, {
        current: O.none,
      });
      void composeCanvas.dispose();
    };
  }, []);

  useEffect(() => {
    if (O.isNone(composeFabricCanvasRef.current)) {
      return;
    }

    const composeCanvas = composeFabricCanvasRef.current.value;
    const scaledWidth = stageWidth * stageScale;
    const scaledHeight = stageHeight * stageScale;
    const orderedEntries = pipe(
      activeSet,
      O.match(
        (): ReadonlyArray<{
          index: number;
          sprite: CharacterSprite;
        }> => [],
        (characterSet) =>
          getCharacterLayerEntriesBackToFront(characterSet.sprites),
      ),
    );

    composeCanvas.clear();
    composeCanvas.setDimensions({
      width: scaledWidth,
      height: scaledHeight,
    });
    composeCanvas.wrapperEl.setAttribute("data-stage-width", `${stageWidth}`);
    composeCanvas.wrapperEl.setAttribute("data-stage-height", `${stageHeight}`);
    composeCanvas.upperCanvasEl.setAttribute(
      "data-stage-width",
      `${stageWidth}`,
    );
    composeCanvas.upperCanvasEl.setAttribute(
      "data-stage-height",
      `${stageHeight}`,
    );
    composeCanvas.lowerCanvasEl.style.setProperty(
      "image-rendering",
      "pixelated",
    );
    composeCanvas.upperCanvasEl.style.setProperty(
      "image-rendering",
      "pixelated",
    );

    const nextObjectEntries = orderedEntries.reduce<
      ReadonlyArray<FabricSpriteObjectEntry>
    >((entries, entry) => {
      const sourceOption = createComposeSpriteSource(
        entry.sprite.spriteIndex,
        sprites,
        spritePalettes,
      );
      if (O.isNone(sourceOption)) {
        return entries;
      }

      const nextObject = new FabricImage(sourceOption.value, {
        borderColor: "rgba(15, 118, 110, 0.92)",
        cornerColor: "rgba(15, 118, 110, 0.92)",
        cornerSize: 6,
        cornerStyle: "circle",
        evented: true,
        hasControls: false,
        imageSmoothing: false,
        left: entry.sprite.x * stageScale,
        lockRotation: true,
        objectCaching: false,
        originX: "left",
        originY: "top",
        padding: 0,
        scaleX: stageScale,
        scaleY: stageScale,
        selectable: true,
        top: entry.sprite.y * stageScale,
        transparentCorners: false,
      });

      composeCanvas.add(nextObject);

      return [...entries, { index: entry.index, object: nextObject }];
    }, []);

    Object.assign(composeFabricObjectEntriesRef, {
      current: nextObjectEntries,
    });

    pipe(
      validSelectedSpriteEditorIndex,
      O.chain((selectedIndex) =>
        O.fromNullable(
          nextObjectEntries.find((entry) => entry.index === selectedIndex),
        ),
      ),
      O.match(
        () => {
          composeCanvas.discardActiveObject();
        },
        (entry) => {
          composeCanvas.setActiveObject(entry.object);
        },
      ),
    );

    composeCanvas.requestRenderAll();
  }, [
    activeSet,
    stageHeight,
    stageScale,
    stageWidth,
    spritePalettes,
    sprites,
    validSelectedSpriteEditorIndex,
  ]);

  useEffect(() => {
    if (O.isNone(composeFabricCanvasRef.current)) {
      return;
    }

    const composeCanvas = composeFabricCanvasRef.current.value;
    composeCanvas.wrapperEl.style.setProperty(
      "display",
      editorMode === "compose" ? "" : "none",
    );
    composeCanvas.wrapperEl.style.setProperty(
      "pointer-events",
      editorMode === "compose" ? "auto" : "none",
    );
  }, [editorMode]);

  useEffect(() => {
    if (editorMode !== "compose") {
      return;
    }

    if (O.isNone(composeFabricCanvasRef.current)) {
      return;
    }

    const composeCanvas = composeFabricCanvasRef.current.value;

    const handleMouseDown = (event: CanvasEvents["mouse:down"]) => {
      const focusStage = () => {
        pipe(
          stageElementRef.current,
          O.map((stageElement) => stageElement.focus()),
        );
      };
      const selectIndex = (nextIndex: O.Option<number>) => {
        if (isSameOptionalNumber(validSelectedSpriteEditorIndex, nextIndex)) {
          return;
        }

        setSelectedSpriteEditorIndex(nextIndex);
      };
      const openContextMenuAt = (
        clientX: number,
        clientY: number,
        spriteEditorIndex: number,
      ) => {
        focusStage();
        setSpriteContextMenu(
          O.some({
            clientX,
            clientY,
            spriteEditorIndex,
          }),
        );
      };

      focusStage();
      setSpriteContextMenu(O.none);

      if (isMouseLikeCanvasEvent(event.e) === false) {
        return;
      }

      const pointerEvent = event.e;

      if (pointerEvent.button === 2) {
        const menuTargetIndex = pipe(
          findComposeObjectEntry(
            composeFabricObjectEntriesRef.current,
            event.target,
          ),
          O.map((entry) => entry.index),
          O.alt(() => validSelectedSpriteEditorIndex),
        );

        pipe(
          menuTargetIndex,
          O.map((spriteEditorIndex) => {
            selectIndex(O.some(spriteEditorIndex));
            openContextMenuAt(
              pointerEvent.clientX,
              pointerEvent.clientY,
              spriteEditorIndex,
            );
          }),
        );
        return;
      }

      if (pointerEvent.button !== 0) {
        return;
      }

      pipe(
        findComposeObjectEntry(
          composeFabricObjectEntriesRef.current,
          event.target,
        ),
        O.match(
          () => selectIndex(O.none),
          (entry) => selectIndex(O.some(entry.index)),
        ),
      );
    };

    const handleObjectMoving = (event: CanvasEvents["object:moving"]) => {
      const currentLeft = event.target.left;
      const currentTop = event.target.top;

      if (typeof currentLeft !== "number" || typeof currentTop !== "number") {
        return;
      }

      const nextLeft = clamp(
        Math.round(currentLeft / stageScale),
        0,
        stageWidth - 1,
      );
      const nextTop = clamp(
        Math.round(currentTop / stageScale),
        0,
        stageHeight - 1,
      );

      event.target.set({
        left: nextLeft * stageScale,
        top: nextTop * stageScale,
      });
      event.target.setCoords();
    };

    const handleObjectModified = (event: CanvasEvents["object:modified"]) => {
      if (O.isNone(activeSet)) {
        return;
      }

      const currentLeft = event.target.left;
      const currentTop = event.target.top;

      if (typeof currentLeft !== "number" || typeof currentTop !== "number") {
        return;
      }

      pipe(
        findComposeObjectEntry(
          composeFabricObjectEntriesRef.current,
          event.target,
        ),
        O.chain((entry) =>
          pipe(
            O.fromNullable(activeSet.value.sprites[entry.index]),
            O.map((sprite) => ({ entry, sprite })),
          ),
        ),
        O.map(({ entry, sprite }) => {
          const nextX = clamp(
            Math.round(currentLeft / stageScale),
            0,
            stageWidth - 1,
          );
          const nextY = clamp(
            Math.round(currentTop / stageScale),
            0,
            stageHeight - 1,
          );

          if (nextX === sprite.x && nextY === sprite.y) {
            return;
          }

          setSprite(activeSet.value.id, entry.index, {
            ...sprite,
            x: nextX,
            y: nextY,
          });
        }),
      );
    };

    composeCanvas.on("mouse:down", handleMouseDown);
    composeCanvas.on("object:moving", handleObjectMoving);
    composeCanvas.on("object:modified", handleObjectModified);

    return () => {
      composeCanvas.off("mouse:down", handleMouseDown);
      composeCanvas.off("object:moving", handleObjectMoving);
      composeCanvas.off("object:modified", handleObjectModified);
    };
  }, [
    activeSet,
    editorMode,
    setSprite,
    stageHeight,
    stageScale,
    stageWidth,
    validSelectedSpriteEditorIndex,
  ]);

  const withSpriteIndex = (
    spriteEditorIndex: O.Option<number>,
    onSelect: (entry: {
      setId: string;
      spriteCount: number;
      index: number;
      sprite: CharacterSprite;
    }) => void,
  ) => {
    pipe(
      activeSet,
      O.chain((characterSet) =>
        pipe(
          spriteEditorIndex,
          O.chain((index) =>
            pipe(
              O.fromNullable(characterSet.sprites[index]),
              O.map((sprite) => ({
                setId: characterSet.id,
                spriteCount: characterSet.sprites.length,
                index,
                sprite,
              })),
            ),
          ),
        ),
      ),
      O.map(onSelect),
    );
  };

  const withSelectedSprite = (
    onSelect: (entry: {
      setId: string;
      spriteCount: number;
      index: number;
      sprite: CharacterSprite;
    }) => void,
  ) => withSpriteIndex(validSelectedSpriteEditorIndex, onSelect);

  const updateSpriteAtIndex = (
    spriteEditorIndex: O.Option<number>,
    transform: (sprite: CharacterSprite) => CharacterSprite,
  ) => {
    withSpriteIndex(spriteEditorIndex, (entry) => {
      const nextSprite = transform(entry.sprite);
      const isValid =
        isInRange(nextSprite.spriteIndex, 0, 63) &&
        isInRange(nextSprite.x, 0, stageWidth - 1) &&
        isInRange(nextSprite.y, 0, stageHeight - 1) &&
        isInRange(nextSprite.layer, 0, 63);

      if (isValid === false) {
        return;
      }

      setSprite(entry.setId, entry.index, nextSprite);
    });
  };

  const handleRemoveCharacterSprite = (
    setId: string,
    index: number,
    currentSpriteCount: number,
  ) => {
    removeSprite(setId, index);
    setSelectedSpriteEditorIndex((current) =>
      resolveSelectionAfterSpriteRemoval(
        current,
        index,
        currentSpriteCount - 1,
      ),
    );
  };

  const handleDeleteSelectedSprite = () => {
    setSpriteContextMenu(O.none);
    withSelectedSprite((entry) =>
      handleRemoveCharacterSprite(entry.setId, entry.index, entry.spriteCount),
    );
  };

  const handleNudgeSelectedSprite = (
    direction: "left" | "right" | "up" | "down",
  ) => {
    setSpriteContextMenu(O.none);
    updateSpriteAtIndex(validSelectedSpriteEditorIndex, (sprite) =>
      nudgeCharacterSprite(sprite, direction, stageWidth - 1, stageHeight - 1),
    );
  };

  const handleDeleteContextMenuSprite = (spriteEditorIndex: number) => {
    setSpriteContextMenu(O.none);
    withSpriteIndex(O.some(spriteEditorIndex), (entry) =>
      handleRemoveCharacterSprite(entry.setId, entry.index, entry.spriteCount),
    );
  };

  const handleShiftContextMenuSpriteLayer = (
    spriteEditorIndex: number,
    amount: number,
  ) => {
    setSpriteContextMenu(O.none);
    updateSpriteAtIndex(O.some(spriteEditorIndex), (sprite) =>
      shiftCharacterSpriteLayer(sprite, amount),
    );
  };

  const handleStageKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (editorMode !== "compose") {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setSpriteContextMenu(O.none);
      return;
    }

    if (O.isNone(selectedSprite)) {
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      handleNudgeSelectedSprite("left");
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      handleNudgeSelectedSprite("right");
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      handleNudgeSelectedSprite("up");
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      handleNudgeSelectedSprite("down");
      return;
    }

    if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();
      handleDeleteSelectedSprite();
    }
  };

  const handleDecompositionCanvasPointerDown = (
    event: React.PointerEvent<HTMLCanvasElement>,
  ) => {
    if (event.button !== 0) {
      return;
    }

    const pointOption =
      decompositionTool === "region"
        ? resolveDecompositionStagePoint(
            event.clientX,
            event.clientY,
            0,
            0,
            stageWidth - 8,
            stageHeight - projectSpriteSize,
          )
        : resolveDecompositionStagePoint(event.clientX, event.clientY);
    if (O.isNone(pointOption)) {
      return;
    }

    event.preventDefault();

    if (decompositionTool === "region") {
      const nextRegion = clampDecompositionRegion(
        {
          id: ["region", `${Date.now()}`, `${Math.random()}`].join("-"),
          x: pointOption.value.x,
          y: pointOption.value.y,
        },
        stageWidth,
        stageHeight,
        projectSpriteSize,
      );
      setDecompositionRegions((current) => [...current, nextRegion]);
      setSelectedRegionId(O.some(nextRegion.id));
      return;
    }

    const nextPixel: CharacterDecompositionPixel =
      decompositionTool === "eraser"
        ? TRANSPARENT_DECOMPOSITION_PIXEL
        : {
            kind: "color",
            paletteIndex: decompositionPaletteIndex,
            colorIndex: decompositionColorIndex,
          };
    setDecompositionCanvas((current) =>
      paintDecompositionPixel(
        current,
        pointOption.value.x,
        pointOption.value.y,
        nextPixel,
      ),
    );
    setDecompositionDrawState(O.some({ pointerId: event.pointerId }));
    trySetPointerCapture(event.currentTarget, event.pointerId);
  };

  const handleDecompositionRegionPointerDown = (
    event: React.PointerEvent<HTMLButtonElement>,
    region: CharacterDecompositionRegion,
  ) => {
    if (decompositionTool !== "region" || event.button !== 0) {
      return;
    }

    const stageRectOption = getStageRect();
    if (O.isNone(stageRectOption)) {
      return;
    }

    event.preventDefault();
    setSelectedRegionId(O.some(region.id));
    setDecompositionRegionDragState(
      O.some({
        regionId: region.id,
        pointerId: event.pointerId,
        offsetX:
          event.clientX - (stageRectOption.value.left + region.x * stageScale),
        offsetY:
          event.clientY - (stageRectOption.value.top + region.y * stageScale),
      }),
    );
    trySetPointerCapture(event.currentTarget, event.pointerId);
  };

  const handleRemoveSelectedRegion = () => {
    pipe(
      selectedRegionId,
      O.map((regionId) => {
        setDecompositionRegions((current) =>
          current.filter((region) => region.id !== regionId),
        );
        setSelectedRegionId(O.none);
      }),
    );
  };

  const handleApplyDecomposition = () => {
    pipe(
      activeSet,
      O.map((characterSet) => {
        const result = applyCharacterDecomposition({
          canvas: decompositionCanvas,
          regions: decompositionRegions,
          spriteSize: projectSpriteSize,
          sprites,
        });

        if (E.isLeft(result)) {
          return;
        }

        const nextScreen = {
          ...screen,
          sprites: screen.sprites.map((screenSprite) => {
            const nextTileOption = O.fromNullable(
              result.right.sprites[screenSprite.spriteIndex],
            );
            if (O.isNone(nextTileOption)) {
              return screenSprite;
            }

            return {
              ...screenSprite,
              ...nextTileOption.value,
            };
          }),
        };
        const currentProjectState = useProjectState.getState();
        useProjectState.setState({
          sprites: result.right.sprites,
          screen: nextScreen,
          nes: mergeScreenIntoNesOam(currentProjectState.nes, nextScreen),
        });

        useCharacterState.setState((state) => ({
          characterSets: state.characterSets.map((currentCharacterSet) =>
            currentCharacterSet.id === characterSet.id
              ? {
                  ...currentCharacterSet,
                  sprites: result.right.characterSprites,
                }
              : currentCharacterSet,
          ),
        }));
      }),
    );
  };

  const handleLibraryPointerDown = (
    event: React.PointerEvent<HTMLButtonElement>,
    spriteIndex: number,
  ) => {
    if (event.button !== 0 || O.isNone(activeSet) || editorMode !== "compose") {
      return;
    }

    event.preventDefault();
    setLibraryDragState(
      O.some(
        createLibraryDragState(
          spriteIndex,
          event.pointerId,
          event.clientX,
          event.clientY,
        ),
      ),
    );
    trySetPointerCapture(event.currentTarget, event.pointerId);
  };

  const activeSetId = pipe(
    activeSet,
    O.match(
      () => "",
      (characterSet) => characterSet.id,
    ),
  );

  const isStageDropActive = pipe(
    libraryDragState,
    O.match(
      () => false,
      (drag) => drag.isOverStage,
    ),
  );

  const handleWorkspacePointerMove = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (O.isSome(libraryDragState)) {
      if (libraryDragState.value.pointerId !== event.pointerId) {
        return;
      }

      setLibraryDragState(
        O.some(
          createLibraryDragState(
            libraryDragState.value.spriteIndex,
            libraryDragState.value.pointerId,
            event.clientX,
            event.clientY,
          ),
        ),
      );
      return;
    }

    if (editorMode === "decompose" && O.isSome(decompositionDrawState)) {
      if (decompositionDrawState.value.pointerId !== event.pointerId) {
        return;
      }

      const pointOption = resolveDecompositionStagePoint(
        event.clientX,
        event.clientY,
      );
      if (O.isNone(pointOption)) {
        return;
      }

      const nextPixel: CharacterDecompositionPixel =
        decompositionTool === "eraser"
          ? TRANSPARENT_DECOMPOSITION_PIXEL
          : {
              kind: "color",
              paletteIndex: decompositionPaletteIndex,
              colorIndex: decompositionColorIndex,
            };
      setDecompositionCanvas((current) =>
        paintDecompositionPixel(
          current,
          pointOption.value.x,
          pointOption.value.y,
          nextPixel,
        ),
      );
      return;
    }

    if (editorMode === "decompose" && O.isSome(decompositionRegionDragState)) {
      if (decompositionRegionDragState.value.pointerId !== event.pointerId) {
        return;
      }

      const pointOption = resolveDecompositionStagePoint(
        event.clientX,
        event.clientY,
        decompositionRegionDragState.value.offsetX,
        decompositionRegionDragState.value.offsetY,
        stageWidth - 8,
        stageHeight - projectSpriteSize,
      );
      if (O.isNone(pointOption)) {
        return;
      }

      setDecompositionRegions((current) =>
        current.map((region) =>
          region.id === decompositionRegionDragState.value.regionId
            ? {
                ...region,
                x: pointOption.value.x,
                y: pointOption.value.y,
              }
            : region,
        ),
      );
    }
  };

  const handleWorkspacePointerEnd = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (O.isSome(libraryDragState)) {
      if (libraryDragState.value.pointerId !== event.pointerId) {
        return;
      }

      const completedDrag = createLibraryDragState(
        libraryDragState.value.spriteIndex,
        libraryDragState.value.pointerId,
        event.clientX,
        event.clientY,
      );

      pipe(
        activeSet,
        O.map((characterSet) => {
          if (completedDrag.isOverStage === false) {
            return;
          }

          addSprite(characterSet.id, {
            spriteIndex: completedDrag.spriteIndex,
            x: completedDrag.stageX,
            y: completedDrag.stageY,
            layer: getNextCharacterSpriteLayer(characterSet.sprites),
          });
          setSelectedSpriteEditorIndex(O.some(characterSet.sprites.length));
        }),
      );
      setLibraryDragState(O.none);
      return;
    }

    if (O.isSome(decompositionDrawState)) {
      if (decompositionDrawState.value.pointerId !== event.pointerId) {
        return;
      }

      setDecompositionDrawState(O.none);
      return;
    }

    if (O.isSome(decompositionRegionDragState)) {
      if (decompositionRegionDragState.value.pointerId !== event.pointerId) {
        return;
      }

      setDecompositionRegionDragState(O.none);
    }
  };

  const spriteContextMenuPortal =
    typeof document === "undefined"
      ? O.none
      : pipe(
          spriteContextMenu,
          O.map((menuState) => {
            const viewportWidth =
              typeof window === "undefined"
                ? menuState.clientX
                : window.innerWidth;
            const viewportHeight =
              typeof window === "undefined"
                ? menuState.clientY
                : window.innerHeight;
            const left = Math.max(
              12,
              Math.min(
                menuState.clientX,
                viewportWidth - STAGE_CONTEXT_MENU_WIDTH - 12,
              ),
            );
            const top = Math.max(
              12,
              Math.min(
                menuState.clientY,
                viewportHeight - STAGE_CONTEXT_MENU_HEIGHT - 12,
              ),
            );
            const menuActions: ReadonlyArray<{
              label: string;
              onSelect: () => void;
              tone?: "default" | "danger";
            }> = [
              {
                label: "レイヤーを上げる",
                onSelect: () =>
                  handleShiftContextMenuSpriteLayer(
                    menuState.spriteEditorIndex,
                    1,
                  ),
              },
              {
                label: "レイヤーを下げる",
                onSelect: () =>
                  handleShiftContextMenuSpriteLayer(
                    menuState.spriteEditorIndex,
                    -1,
                  ),
              },
              {
                label: "削除",
                onSelect: () =>
                  handleDeleteContextMenuSprite(menuState.spriteEditorIndex),
                tone: "danger",
              },
            ];

            return createPortal(
              <PortalOverlay
                data-sprite-context-menu-root="true"
                onContextMenu={handleComposeContextMenu}
                onPointerDown={() => setSpriteContextMenu(O.none)}
              >
                <PositionedActionMenu
                  role="menu"
                  aria-label="スプライトメニュー"
                  onPointerDown={(event) => event.stopPropagation()}
                  menuLeft={left}
                  menuTop={top}
                  menuWidth={STAGE_CONTEXT_MENU_WIDTH}
                  ready={true}
                >
                  {menuActions.map((action) => (
                    <PositionedActionMenuButton
                      key={action.label}
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        action.onSelect();
                        focusStageElement();
                      }}
                      danger={action.tone === "danger"}
                    >
                      {action.label}
                    </PositionedActionMenuButton>
                  ))}
                </PositionedActionMenu>
              </PortalOverlay>,
              document.body,
            );
          }),
        );

  return (
    <Panel flex={1} minHeight={0} height="100%">
      <PanelHeader>
        <PanelHeaderRow>
          <PanelTitle>キャラクター編集</PanelTitle>
          <ProjectActions
            actions={pipe(
              activeSet,
              O.match(
                () => [],
                (characterSet) => [
                  {
                    label: "PNGエクスポート",
                    onSelect: () => {
                      if (previewState.kind !== "ready") {
                        return;
                      }
                      void exportPng(
                        previewState.grid,
                        `${characterSet.name}.png`,
                      );
                    },
                  },
                  {
                    label: "SVGエクスポート",
                    onSelect: () => {
                      if (previewState.kind !== "ready") {
                        return;
                      }
                      void exportSvgSimple(
                        previewState.grid,
                        8,
                        `${characterSet.name}.svg`,
                      );
                    },
                  },
                  {
                    label: "キャラクターJSON書き出し",
                    onSelect: () =>
                      void exportCharacterJson(
                        {
                          characterSets: [characterSet],
                          selectedCharacterId: characterSet.id,
                        },
                        `${characterSet.name}.json`,
                      ),
                  },
                ],
              ),
            )}
          />
        </PanelHeaderRow>
      </PanelHeader>

      <CharacterWorkspaceRoot
        flex={1}
        onPointerDownCapture={handleWorkspacePointerDownCapture}
        onPointerMoveCapture={handleWorkspacePointerMove}
        onPointerUpCapture={handleWorkspacePointerEnd}
        onPointerCancelCapture={handleWorkspacePointerEnd}
      >
        <ResponsiveHeaderGrid>
          <Field flex="1 1 17.5rem">
            <FieldLabel>新規セット名</FieldLabel>
            <CharacterInput
              type="text"
              value={newName}
              inputProps={{
                "aria-label": "新規セット名",
              }}
              onChange={(event) => setNewName(event.target.value)}
            />
          </Field>
          <ResponsiveAutoWidthContainer>
            <ToolButton type="button" tone="primary" onClick={handleCreateSet}>
              セットを作成
            </ToolButton>
          </ResponsiveAutoWidthContainer>
          <Field flex="1 1 17.5rem">
            <FieldLabel>編集中のセット</FieldLabel>
            <CharacterSelectInput
              variant="outlined"
              inputProps={{
                "aria-label": "編集中のセット",
              }}
              value={pipe(
                selectedCharacterId,
                O.match(
                  () => "",
                  (value) => value,
                ),
              )}
              onChange={(event) => handleSelectSet(event.target.value)}
            >
              {characterSets.length === 0 && (
                <option value="">キャラクターセットがありません</option>
              )}
              {characterSets.map((characterSet) => (
                <option key={characterSet.id} value={characterSet.id}>
                  {`${characterSet.name} (${characterSet.sprites.length} sprites)`}
                </option>
              ))}
            </CharacterSelectInput>
          </Field>
          <ResponsiveAutoWidthContainer>
            <ToolButton
              type="button"
              tone="danger"
              disabled={O.isNone(activeSet)}
              onClick={() => {
                if (activeSetId === "") {
                  return;
                }
                handleDeleteSet(activeSetId);
              }}
            >
              セットを削除
            </ToolButton>
          </ResponsiveAutoWidthContainer>
        </ResponsiveHeaderGrid>

        <CharacterWorkspaceGrid
          aria-label="キャラクター編集ワークスペース"
          decompose={editorMode === "decompose"}
          flex={1}
        >
          <SidebarColumn>
            <EditorCard>
              <Field>
                <FieldLabel>セット名</FieldLabel>
                <CharacterInput
                  type="text"
                  value={activeSetName}
                  disabled={O.isNone(activeSet)}
                  inputProps={{
                    "aria-label": "セット名",
                  }}
                  onChange={(event) =>
                    pipe(
                      activeSet,
                      O.map((characterSet) =>
                        renameSet(characterSet.id, event.target.value),
                      ),
                    )
                  }
                />
              </Field>

              <EditorFieldStack>
                <FieldLabel>編集モード</FieldLabel>
                <TwoOptionGrid>
                  <WideToolButton
                    type="button"
                    aria-label="編集モード 合成"
                    active={editorMode === "compose"}
                    onClick={() => setEditorMode("compose")}
                  >
                    合成
                  </WideToolButton>
                  <WideToolButton
                    type="button"
                    aria-label="編集モード 分解"
                    active={editorMode === "decompose"}
                    onClick={() => setEditorMode("decompose")}
                  >
                    分解
                  </WideToolButton>
                </TwoOptionGrid>
              </EditorFieldStack>

              <EditorFieldStack>
                <PanelHeaderRow>
                  <FieldLabel>スプライト単位</FieldLabel>
                  <Badge tone={projectSpriteSizeLocked ? "neutral" : "accent"}>
                    {projectSpriteSizeLocked === true ? "locked" : "editable"}
                  </Badge>
                </PanelHeaderRow>
                <TwoOptionGrid>
                  <WideToolButton
                    type="button"
                    aria-label="プロジェクトスプライトサイズ 8x8"
                    active={projectSpriteSize === 8}
                    disabled={
                      projectSpriteSizeLocked === true &&
                      projectSpriteSize !== 8
                    }
                    onClick={() => handleProjectSpriteSizeChange(8)}
                  >
                    8×8
                  </WideToolButton>
                  <WideToolButton
                    type="button"
                    aria-label="プロジェクトスプライトサイズ 8x16"
                    active={projectSpriteSize === 16}
                    disabled={
                      projectSpriteSizeLocked === true &&
                      projectSpriteSize !== 16
                    }
                    onClick={() => handleProjectSpriteSizeChange(16)}
                  >
                    8×16
                  </WideToolButton>
                </TwoOptionGrid>
              </EditorFieldStack>
            </EditorCard>

            <LibraryCard>
              <PanelHeaderRow>
                <FieldLabel>スプライトライブラリ</FieldLabel>
              </PanelHeaderRow>

              <LibraryScrollArea flex={1} minHeight={0} pr={0}>
                <LibraryGrid>
                  {sprites.map((spriteTile, spriteIndex) => {
                    const isDragging = pipe(
                      libraryDragState,
                      O.match(
                        () => false,
                        (drag) => drag.spriteIndex === spriteIndex,
                      ),
                    );

                    return (
                      <LibrarySpriteButton
                        key={`library-sprite-${spriteIndex}`}
                        type="button"
                        dragging={isDragging}
                        draggableState={
                          editorMode === "compose" && O.isSome(activeSet)
                        }
                        draggable={false}
                        aria-label={`ライブラリスプライト ${spriteIndex}`}
                        onDragStart={(event) => event.preventDefault()}
                        onPointerDown={(event) =>
                          handleLibraryPointerDown(event, spriteIndex)
                        }
                      >
                        <Stack
                          alignItems="center"
                          spacing="0.625rem"
                          width="100%"
                        >
                          <LibrarySpriteTitle>
                            {`Sprite ${spriteIndex}`}
                          </LibrarySpriteTitle>
                          <LibrarySpritePreviewFrame
                            alignItems="center"
                            justifyContent="center"
                            spacing={0}
                          >
                            {renderSpritePixels(
                              spriteIndex,
                              LIBRARY_PREVIEW_SCALE,
                            )}
                          </LibrarySpritePreviewFrame>
                          <Badge tone="accent">{`${spriteTile.width}×${spriteTile.height}`}</Badge>
                        </Stack>
                      </LibrarySpriteButton>
                    );
                  })}
                </LibraryGrid>
              </LibraryScrollArea>
            </LibraryCard>
          </SidebarColumn>

          <StageEditorCard decompose={editorMode === "decompose"} flex={1}>
            <PreviewHeaderLayout>
              <PanelHeaderRow>
                <FieldLabel>
                  {editorMode === "compose"
                    ? "プレビューキャンバス"
                    : "分解キャンバス"}
                </FieldLabel>
                <Badge tone="accent">
                  {editorMode === "compose"
                    ? `${activeSetSpriteCount} items`
                    : `${decompositionRegions.length} regions`}
                </Badge>
              </PanelHeaderRow>

              <PreviewControlsRow>
                <StageInputContainer>
                  <CharacterInput
                    type="number"
                    value={stageWidth}
                    inputProps={{
                      min: STAGE_MIN_WIDTH,
                      max: STAGE_MAX_WIDTH,
                      step: 8,
                      "aria-label": "プレビューキャンバス幅",
                    }}
                    onChange={(event) =>
                      handleStageWidthChange(event.target.value)
                    }
                  />
                </StageInputContainer>
                <StageInputContainer>
                  <CharacterInput
                    type="number"
                    value={stageHeight}
                    inputProps={{
                      min: STAGE_MIN_HEIGHT,
                      max: STAGE_MAX_HEIGHT,
                      step: 8,
                      "aria-label": "プレビューキャンバス高さ",
                    }}
                    onChange={(event) =>
                      handleStageHeightChange(event.target.value)
                    }
                  />
                </StageInputContainer>
                <Badge tone="neutral">{`${stageZoomLevel}x`}</Badge>
                <ToolButton type="button" onClick={handleZoomOut}>
                  -
                </ToolButton>
                <ToolButton type="button" onClick={handleZoomIn}>
                  +
                </ToolButton>
              </PreviewControlsRow>
            </PreviewHeaderLayout>

            {editorMode === "decompose" && (
              <DecompositionToolCard>
                <PanelHeaderRow>
                  <FieldLabel>分解ツール</FieldLabel>
                  <Badge tone="neutral">
                    {projectSpriteSize === 8 ? "8×8" : "8×16"}
                  </Badge>
                </PanelHeaderRow>

                <DecompositionToolGrid>
                  <ToolButton
                    type="button"
                    aria-label="分解ツール ペン"
                    active={decompositionTool === "pen"}
                    onClick={() => setDecompositionTool("pen")}
                  >
                    ペン
                  </ToolButton>
                  <ToolButton
                    type="button"
                    aria-label="分解ツール 消しゴム"
                    active={decompositionTool === "eraser"}
                    onClick={() => setDecompositionTool("eraser")}
                  >
                    消しゴム
                  </ToolButton>
                  <ToolButton
                    type="button"
                    aria-label="分解ツール 切り取り"
                    active={decompositionTool === "region"}
                    onClick={() => setDecompositionTool("region")}
                  >
                    切り取り
                  </ToolButton>
                  <PaletteControlRow>
                    <PaletteControlContainer>
                      <CharacterSelectInput
                        variant="outlined"
                        value={decompositionPaletteIndex}
                        inputProps={{
                          "aria-label": "分解描画パレット",
                        }}
                        onChange={(event) => {
                          const parsed = Number(event.target.value);
                          if (
                            parsed === 0 ||
                            parsed === 1 ||
                            parsed === 2 ||
                            parsed === 3
                          ) {
                            setDecompositionPaletteIndex(parsed);
                          }
                        }}
                      >
                        {spritePalettes.map((_, paletteIndex) => (
                          <option key={paletteIndex} value={paletteIndex}>
                            パレット {paletteIndex}
                          </option>
                        ))}
                      </CharacterSelectInput>
                    </PaletteControlContainer>

                    <PaletteSlotGrid>
                      {DECOMPOSITION_COLOR_SLOTS.map((slotIndex) => {
                        const tone =
                          decompositionColorIndex === slotIndex &&
                          decompositionTool !== "eraser";
                        const colorHex = nesIndexToCssHex(
                          spritePalettes[decompositionPaletteIndex][slotIndex],
                        );

                        return (
                          <SlotGroup
                            key={`decompose-slot-${slotIndex}`}
                            active={tone}
                          >
                            <SlotButton
                              type="button"
                              aria-label={`分解色スロット ${slotIndex}`}
                              bg={colorHex}
                              active={tone}
                              onClick={() => {
                                if (
                                  slotIndex === 1 ||
                                  slotIndex === 2 ||
                                  slotIndex === 3
                                ) {
                                  setDecompositionColorIndex(slotIndex);
                                  setDecompositionTool("pen");
                                }
                              }}
                            />
                            <SlotLabel>{`slot${slotIndex}`}</SlotLabel>
                          </SlotGroup>
                        );
                      })}
                    </PaletteSlotGrid>
                  </PaletteControlRow>
                </DecompositionToolGrid>
              </DecompositionToolCard>
            )}

            <CharacterStageViewport
              ref={(element: HTMLDivElement | null) => {
                viewportElementRef.current = O.fromNullable(element);
              }}
              aria-label="プレビューキャンバスビュー"
              onWheel={handleViewportWheel}
              onPointerDown={handleViewportPointerDown}
              onPointerMove={handleViewportPointerMove}
              onPointerUp={handleViewportPointerEnd}
              onPointerCancel={handleViewportPointerEnd}
              onMouseDown={(event) => {
                if (event.button === 1) {
                  event.preventDefault();
                }
              }}
              dragging={O.isSome(viewportPanState)}
            >
              <ViewportCenterWrap>
                <StageSurface
                  ref={(element) => {
                    stageElementRef.current = O.fromNullable(element);
                  }}
                  aria-label="キャラクターステージ"
                  data-active-set-name={activeSetName}
                  data-stage-sprite-count={activeSetSpriteCount}
                  data-selected-sprite-index={selectedSpriteStageMetadata.index}
                  data-selected-sprite-layer={selectedSpriteStageMetadata.layer}
                  data-selected-sprite-x={selectedSpriteStageMetadata.x}
                  data-selected-sprite-y={selectedSpriteStageMetadata.y}
                  tabIndex={editorMode === "compose" ? 0 : -1}
                  onContextMenu={handleComposeContextMenu}
                  onKeyDown={handleStageKeyDown}
                  activeDrop={isStageDropActive}
                  stageWidthPx={stageWidth * stageScale}
                  stageHeightPx={stageHeight * stageScale}
                  stageScale={stageScale}
                >
                  <ComposeCanvasMount onCanvasRef={handleComposeCanvasRef} />

                  {editorMode === "compose" &&
                    pipe(
                      libraryDragState,
                      O.match(
                        () => <></>,
                        (drag) => {
                          if (drag.isOverStage === false) {
                            return <></>;
                          }

                          return (
                            <StageDragPreview
                              key={`library-preview-${drag.spriteIndex}`}
                              previewLeft={drag.stageX * stageScale}
                              previewTop={drag.stageY * stageScale}
                            >
                              {renderSpritePixels(drag.spriteIndex, stageScale)}
                            </StageDragPreview>
                          );
                        },
                      ),
                    )}

                  {editorMode === "decompose" && (
                    <>
                      <DecompositionCanvasElement
                        ref={(element: HTMLCanvasElement | null) => {
                          decompositionCanvasRef.current =
                            O.fromNullable(element);
                        }}
                        aria-label="分解描画キャンバス"
                        data-stage-width={stageWidth}
                        data-stage-height={stageHeight}
                        width={stageWidth * stageScale}
                        height={stageHeight * stageScale}
                        onPointerDown={handleDecompositionCanvasPointerDown}
                        cursorStyle={decompositionCanvasCursor}
                      />

                      {decompositionAnalysis.regions.map(
                        (regionAnalysis, regionIndex) => {
                          const isSelected = pipe(
                            selectedRegionId,
                            O.match(
                              () => false,
                              (regionId) =>
                                regionId === regionAnalysis.region.id,
                            ),
                          );
                          const hasIssues = regionAnalysis.issues.length > 0;

                          return (
                            <RegionOverlayButton
                              key={regionAnalysis.region.id}
                              type="button"
                              aria-label={`切り取り領域 ${regionIndex}`}
                              onPointerDown={(event) =>
                                handleDecompositionRegionPointerDown(
                                  event,
                                  regionAnalysis.region,
                                )
                              }
                              onClick={() =>
                                setSelectedRegionId(
                                  O.some(regionAnalysis.region.id),
                                )
                              }
                              selectedState={isSelected}
                              issueState={hasIssues}
                              regionLeft={regionAnalysis.region.x * stageScale}
                              regionTop={regionAnalysis.region.y * stageScale}
                              regionHeightPx={projectSpriteSize * stageScale}
                              regionScale={stageScale}
                              toolMode={decompositionTool}
                            >
                              <Stack
                                height="100%"
                                width="100%"
                                alignItems="flex-start"
                                justifyContent="space-between"
                                spacing={0}
                              >
                                <Badge tone={hasIssues ? "danger" : "accent"}>
                                  {`#${regionIndex}`}
                                </Badge>
                                <Badge tone={hasIssues ? "danger" : "neutral"}>
                                  {getRegionStatusLabel(regionAnalysis)}
                                </Badge>
                              </Stack>
                            </RegionOverlayButton>
                          );
                        },
                      )}
                    </>
                  )}
                </StageSurface>
              </ViewportCenterWrap>
            </CharacterStageViewport>
          </StageEditorCard>

          {editorMode === "decompose" && (
            <DecompositionSidebar>
              <>
                <EditorCard>
                  <PanelHeaderRow>
                    <FieldLabel>選択中の領域</FieldLabel>
                    <Badge tone="neutral">
                      {pipe(
                        selectedRegionId,
                        O.match(
                          () => "none",
                          (value) => value,
                        ),
                      )}
                    </Badge>
                  </PanelHeaderRow>

                  <RegionPreviewSurface>
                    {pipe(
                      selectedRegionAnalysis,
                      O.match(
                        () => <></>,
                        (regionAnalysis) =>
                          renderTilePixels(
                            regionAnalysis.tile,
                            INSPECTOR_PREVIEW_SCALE,
                            `region-${regionAnalysis.region.id}`,
                          ),
                      ),
                    )}
                  </RegionPreviewSurface>

                  <DetailList>
                    <DetailRow>
                      <FieldLabel>領域数</FieldLabel>
                      <Badge tone="accent">
                        {decompositionAnalysis.regions.length}
                      </Badge>
                    </DetailRow>
                    <DetailRow>
                      <FieldLabel>有効 / 無効</FieldLabel>
                      <Badge
                        tone={
                          decompositionInvalidRegionCount > 0
                            ? "danger"
                            : "neutral"
                        }
                      >
                        {`${decompositionValidRegionCount} / ${decompositionInvalidRegionCount}`}
                      </Badge>
                    </DetailRow>
                    <DetailRow>
                      <FieldLabel>再利用 / 新規</FieldLabel>
                      <Badge tone="neutral">
                        {`${decompositionAnalysis.reusableSpriteCount} / ${decompositionAnalysis.requiredNewSpriteCount}`}
                      </Badge>
                    </DetailRow>
                  </DetailList>

                  {pipe(
                    selectedRegionAnalysis,
                    O.match(
                      () => <></>,
                      (regionAnalysis) => (
                        <InspectorSection>
                          <InspectorFieldGrid>
                            <Field>
                              <FieldLabel>x</FieldLabel>
                              <CharacterInput
                                type="number"
                                value={regionAnalysis.region.x}
                                readOnly
                                inputProps={{
                                  "aria-label": "選択中領域X座標",
                                }}
                              />
                            </Field>
                            <Field>
                              <FieldLabel>y</FieldLabel>
                              <CharacterInput
                                type="number"
                                value={regionAnalysis.region.y}
                                readOnly
                                inputProps={{
                                  "aria-label": "選択中領域Y座標",
                                }}
                              />
                            </Field>
                          </InspectorFieldGrid>

                          <DetailList>
                            <DetailRow>
                              <FieldLabel>状態</FieldLabel>
                              <Badge
                                tone={
                                  regionAnalysis.issues.length > 0
                                    ? "danger"
                                    : "accent"
                                }
                              >
                                {getRegionStatusLabel(regionAnalysis)}
                              </Badge>
                            </DetailRow>
                            <DetailRow>
                              <FieldLabel>issues</FieldLabel>
                              <Badge
                                tone={
                                  regionAnalysis.issues.length > 0
                                    ? "danger"
                                    : "neutral"
                                }
                              >
                                {regionAnalysis.issues.length > 0
                                  ? regionAnalysis.issues
                                      .map(getIssueLabel)
                                      .join(", ")
                                  : "none"}
                              </Badge>
                            </DetailRow>
                          </DetailList>
                        </InspectorSection>
                      ),
                    ),
                  )}

                  <DualActionGrid>
                    <WideToolButton
                      type="button"
                      tone="danger"
                      disabled={O.isNone(selectedRegionId)}
                      onClick={handleRemoveSelectedRegion}
                    >
                      選択中領域を削除
                    </WideToolButton>
                    <WideToolButton
                      type="button"
                      tone="primary"
                      disabled={
                        O.isNone(activeSet) ||
                        decompositionRegions.length === 0 ||
                        decompositionAnalysis.canApply === false
                      }
                      onClick={handleApplyDecomposition}
                    >
                      分解して現在のセットへ反映
                    </WideToolButton>
                  </DualActionGrid>
                </EditorCard>

                <RegionListCard>
                  <PanelHeaderRow>
                    <FieldLabel>切り取り領域一覧</FieldLabel>
                    <Badge tone="accent">
                      {decompositionAnalysis.regions.length} regions
                    </Badge>
                  </PanelHeaderRow>

                  <ScrollArea flex={1} minHeight={0} pr={0}>
                    <RegionList>
                      {decompositionAnalysis.regions.map(
                        (regionAnalysis, regionIndex) => {
                          const isSelected = pipe(
                            selectedRegionId,
                            O.match(
                              () => false,
                              (regionId) =>
                                regionId === regionAnalysis.region.id,
                            ),
                          );

                          return (
                            <RegionListButton
                              key={regionAnalysis.region.id}
                              type="button"
                              selectedState={isSelected}
                              onClick={() =>
                                setSelectedRegionId(
                                  O.some(regionAnalysis.region.id),
                                )
                              }
                            >
                              <Stack spacing="0.625rem" width="100%">
                                <PanelHeaderRow>
                                  <FieldLabel>{`領域 ${regionIndex}`}</FieldLabel>
                                  <Badge
                                    tone={
                                      regionAnalysis.issues.length > 0
                                        ? "danger"
                                        : "accent"
                                    }
                                  >
                                    {getRegionStatusLabel(regionAnalysis)}
                                  </Badge>
                                </PanelHeaderRow>
                                <RegionMetaRow>
                                  <Badge tone="neutral">
                                    {`x:${regionAnalysis.region.x}`}
                                  </Badge>
                                  <Badge tone="neutral">
                                    {`y:${regionAnalysis.region.y}`}
                                  </Badge>
                                  <Badge
                                    tone={
                                      regionAnalysis.issues.length > 0
                                        ? "danger"
                                        : "neutral"
                                    }
                                  >
                                    {regionAnalysis.issues.length > 0
                                      ? regionAnalysis.issues
                                          .map(getIssueLabel)
                                          .join(", ")
                                      : "valid"}
                                  </Badge>
                                </RegionMetaRow>
                              </Stack>
                            </RegionListButton>
                          );
                        },
                      )}
                    </RegionList>
                  </ScrollArea>
                </RegionListCard>
              </>
            </DecompositionSidebar>
          )}
        </CharacterWorkspaceGrid>

        {editorMode === "compose" &&
          pipe(
            libraryDragState,
            O.match(
              () => <></>,
              (drag) => (
                <FloatingLibraryPreview
                  aria-label="ライブラリドラッグプレビュー"
                  dragClientX={drag.clientX}
                  dragClientY={drag.clientY}
                >
                  <Stack
                    height="100%"
                    width="100%"
                    alignItems="center"
                    justifyContent="center"
                    spacing={0}
                  >
                    {renderSpritePixels(
                      drag.spriteIndex,
                      LIBRARY_PREVIEW_SCALE,
                    )}
                  </Stack>
                </FloatingLibraryPreview>
              ),
            ),
          )}

        {pipe(
          spriteContextMenuPortal,
          O.match(
            () => <></>,
            (menu) => menu,
          ),
        )}
      </CharacterWorkspaceRoot>
    </Panel>
  );
};
