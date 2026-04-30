import { Button } from "@radix-ui/themes";
import React from "react";
import { SurfaceCard } from "../../../common/ui/chrome/SurfaceCard";
import {
  applyRuntimeStyle,
  assignForwardedRef,
} from "../../../common/ui/runtimeStyle";
import styles from "./CharacterModePrimitives.module.css";
import {
  createDecompositionCanvasStyle,
  createEmptyTilePreviewStyle,
  createFloatingLibraryPreviewStyle,
  createPixelPreviewCellStyle,
  createPositionedActionMenuStyle,
  createRegionOverlayButtonStyle,
  createStageDragPreviewStyle,
  createStageSurfaceStyle,
} from "./CharacterModePrimitivesStyle";

export type DecompositionTool = "pen" | "eraser" | "region";

type ClosedHtmlDivProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "className" | "style"
> & {
  readonly className?: never;
  readonly style?: never;
};

type ClosedDivProps = Omit<
  React.ComponentProps<"div">,
  "className" | "style"
> & {
  readonly className?: never;
  readonly style?: never;
};

type CharacterStageViewportProps = ClosedHtmlDivProps & {
  readonly dragging?: boolean;
};

type DecompositionCanvasElementProps = Omit<
  React.ComponentProps<"canvas">,
  "style"
> & {
  readonly cursorStyle: string;
  readonly style?: never;
};

type StageDragPreviewProps = Omit<React.ComponentProps<"div">, "style"> & {
  readonly previewLeft: number;
  readonly previewTop: number;
  readonly style?: never;
};

type RegionOverlayButtonProps = Omit<
  React.ComponentProps<"button">,
  "style"
> & {
  readonly issueState?: boolean;
  readonly regionHeightPx: number;
  readonly regionLeft: number;
  readonly regionScale: number;
  readonly regionTop: number;
  readonly selectedState?: boolean;
  readonly toolMode: DecompositionTool;
  readonly style?: never;
};

type FloatingLibraryPreviewProps = Omit<
  React.ComponentProps<"div">,
  "style"
> & {
  readonly dragClientX: number;
  readonly dragClientY: number;
  readonly style?: never;
};

type PositionedActionMenuProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "style"
> & {
  readonly menuLeft: number;
  readonly menuTop: number;
  readonly menuWidth: number;
  readonly ready: boolean;
  readonly style?: never;
};

type PositionedActionMenuButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  "style"
> & {
  readonly danger?: boolean;
  readonly style?: never;
};

type EmptyTilePreviewProps = Omit<React.ComponentProps<"div">, "style"> & {
  readonly previewHeight: number;
  readonly previewWidth: number;
  readonly style?: never;
};

type PixelPreviewCellProps = Omit<React.ComponentProps<"div">, "style"> & {
  readonly colorHex: string;
  readonly pixelSize: number;
  readonly style?: never;
};

type StageEditorCardProps = ClosedHtmlDivProps;

type StageSurfaceProps = ClosedDivProps & {
  readonly activeDrop?: boolean;
  readonly stageHeightPx: number;
  readonly stageScale: number;
  readonly stageWidthPx: number;
};

type CharacterStageStatusProps = {
  readonly activeSetName: string;
  readonly selectedSprite: {
    readonly index: string;
    readonly layer: string;
    readonly x: string;
    readonly y: string;
  };
  readonly spriteCount: number;
};

const formatStageStatusValue = (value: string): string =>
  value === "" ? "なし" : value;

const createLayout = (
  baseClassName: string,
): React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>
> => {
  return React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    function LayoutComponent({ className, ...props }, ref) {
      const combinedClassName =
        typeof className === "string" && className.length > 0
          ? `${baseClassName} ${className}`
          : baseClassName;

      return <div {...props} ref={ref} className={combinedClassName} />;
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
  StageEditorCardProps
>(function StageEditorCard({ ...props }, ref) {
  return (
    <SurfaceCard {...props} ref={ref} className={styles.stageEditorCard} />
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
>(function CharacterStageViewport({ dragging, ...props }, ref) {
  const baseClassName = styles.characterStageViewport ?? "";
  const draggingClassName =
    dragging === true ? (styles.characterStageViewportDragging ?? "") : "";
  const combinedClassName =
    draggingClassName.length > 0
      ? `${baseClassName} ${draggingClassName}`
      : baseClassName;
  const handleViewportRef = React.useCallback(
    (element: HTMLDivElement | null) => {
      assignForwardedRef(ref, element);
    },
    [ref],
  );

  return (
    <div {...props} ref={handleViewportRef} className={combinedClassName} />
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
  { className, cursorStyle, ...props },
  ref,
) {
  const baseClassName = styles.decompositionCanvasElement ?? "";
  const combinedClassName =
    typeof className === "string" && className.length > 0
      ? `${baseClassName} ${className}`
      : baseClassName;
  const handleCanvasRef = React.useCallback(
    (element: HTMLCanvasElement | null) => {
      assignForwardedRef(ref, element);
      applyRuntimeStyle(
        element,
        createDecompositionCanvasStyle({}, cursorStyle),
      );
    },
    [cursorStyle, ref],
  );

  return (
    <canvas {...props} ref={handleCanvasRef} className={combinedClassName} />
  );
});

export const StageDragPreview = React.forwardRef<
  HTMLDivElement,
  StageDragPreviewProps
>(function StageDragPreview({ previewLeft, previewTop, ...props }, ref) {
  const handlePreviewRef = React.useCallback(
    (element: HTMLDivElement | null) => {
      assignForwardedRef(ref, element);
      applyRuntimeStyle(
        element,
        createStageDragPreviewStyle({}, previewLeft, previewTop),
      );
    },
    [previewLeft, previewTop, ref],
  );

  return <div {...props} ref={handlePreviewRef} />;
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
    toolMode,
    className,
    ...props
  },
  ref,
) {
  const baseClassName = styles.resetButton ?? "";
  const combinedClassName =
    typeof className === "string" && className.length > 0
      ? `${baseClassName} ${className}`
      : baseClassName;
  const handleOverlayRef = React.useCallback(
    (element: HTMLButtonElement | null) => {
      assignForwardedRef(ref, element);
      applyRuntimeStyle(
        element,
        createRegionOverlayButtonStyle(
          {},
          regionLeft,
          regionTop,
          regionScale,
          regionHeightPx,
          issueState === true,
          selectedState === true,
          toolMode,
        ),
      );
    },
    [
      issueState,
      ref,
      regionHeightPx,
      regionLeft,
      regionScale,
      regionTop,
      selectedState,
      toolMode,
    ],
  );

  return (
    <button
      {...props}
      ref={handleOverlayRef}
      className={combinedClassName}
      type={props.type ?? "button"}
    />
  );
});

export const FloatingLibraryPreview = React.forwardRef<
  HTMLDivElement,
  FloatingLibraryPreviewProps
>(function FloatingLibraryPreview(
  { className, dragClientX, dragClientY, ...props },
  ref,
) {
  const handlePreviewRef = React.useCallback(
    (element: HTMLDivElement | null) => {
      assignForwardedRef(ref, element);
      applyRuntimeStyle(
        element,
        createFloatingLibraryPreviewStyle({}, dragClientX, dragClientY),
      );
    },
    [dragClientX, dragClientY, ref],
  );

  return <div {...props} ref={handlePreviewRef} className={className} />;
});

export const PortalOverlay = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(function PortalOverlay({ className, ...props }, ref) {
  const baseClassName = styles.portalOverlay ?? "";
  const combinedClassName =
    typeof className === "string" && className.length > 0
      ? `${baseClassName} ${className}`
      : baseClassName;
  const handleOverlayRef = React.useCallback(
    (element: HTMLDivElement | null) => {
      assignForwardedRef(ref, element);
    },
    [ref],
  );

  return (
    <div {...props} ref={handleOverlayRef} className={combinedClassName} />
  );
});

export const PositionedActionMenu = React.forwardRef<
  HTMLDivElement,
  PositionedActionMenuProps
>(function PositionedActionMenu(
  { className, menuLeft, menuTop, menuWidth, ready, ...props },
  ref,
) {
  const baseClassName = styles.positionedActionMenu ?? "";
  const combinedClassName =
    typeof className === "string" && className.length > 0
      ? `${baseClassName} ${className}`
      : baseClassName;
  const handleMenuRef = React.useCallback(
    (element: HTMLDivElement | null) => {
      assignForwardedRef(ref, element);
      applyRuntimeStyle(
        element,
        createPositionedActionMenuStyle(
          {},
          menuLeft,
          menuTop,
          menuWidth,
          ready,
        ),
      );
    },
    [menuLeft, menuTop, menuWidth, ready, ref],
  );

  return <div {...props} ref={handleMenuRef} className={combinedClassName} />;
});

export const PositionedActionMenuButton = React.forwardRef<
  HTMLButtonElement,
  PositionedActionMenuButtonProps
>(function PositionedActionMenuButton({ danger, ...props }, ref) {
  return (
    <Button
      {...props}
      ref={ref}
      className={styles.fullWidthBox}
      color={danger === true ? "red" : "gray"}
      size="1"
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
  { className, previewHeight, previewWidth, ...props },
  ref,
) {
  const handlePreviewRef = React.useCallback(
    (element: HTMLDivElement | null) => {
      assignForwardedRef(ref, element);
      applyRuntimeStyle(
        element,
        createEmptyTilePreviewStyle({}, previewWidth, previewHeight),
      );
    },
    [previewHeight, previewWidth, ref],
  );

  return <div {...props} ref={handlePreviewRef} className={className} />;
});

export const PixelPreviewCell = React.forwardRef<
  HTMLDivElement,
  PixelPreviewCellProps
>(function PixelPreviewCell({ className, colorHex, pixelSize, ...props }, ref) {
  const handleCellRef = React.useCallback(
    (element: HTMLDivElement | null) => {
      assignForwardedRef(ref, element);
      applyRuntimeStyle(
        element,
        createPixelPreviewCellStyle({}, pixelSize, colorHex),
      );
    },
    [colorHex, pixelSize, ref],
  );

  return <div {...props} ref={handleCellRef} className={className} />;
});

export const StageSurface = React.forwardRef<HTMLDivElement, StageSurfaceProps>(
  function StageSurface(
    { activeDrop, children, stageHeightPx, stageScale, stageWidthPx, ...props },
    ref,
  ) {
    const baseClassName = styles.characterStageSurface ?? "";
    const activeDropClassName =
      activeDrop === true ? (styles.characterStageSurfaceActiveDrop ?? "") : "";
    const combinedClassName =
      activeDropClassName.length > 0
        ? `${baseClassName} ${activeDropClassName}`
        : baseClassName;
    const handleSurfaceRef = React.useCallback(
      (element: HTMLDivElement | null) => {
        assignForwardedRef(ref, element);
        applyRuntimeStyle(
          element,
          createStageSurfaceStyle({}, stageWidthPx, stageHeightPx, stageScale),
        );
      },
      [ref, stageHeightPx, stageScale, stageWidthPx],
    );

    return (
      <div {...props} ref={handleSurfaceRef} className={combinedClassName}>
        {children}
      </div>
    );
  },
);

export const CharacterStageStatus: React.FC<CharacterStageStatusProps> = ({
  activeSetName,
  selectedSprite,
  spriteCount,
}) => {
  return (
    <div className={styles.visuallyHidden} role="status">
      {`キャラクターステージ状態: セット ${formatStageStatusValue(activeSetName)}; スプライト数 ${spriteCount}; 選択スプライト ${formatStageStatusValue(selectedSprite.index)}; レイヤー ${formatStageStatusValue(selectedSprite.layer)}; X ${formatStageStatusValue(selectedSprite.x)}; Y ${formatStageStatusValue(selectedSprite.y)}`}
    </div>
  );
};
