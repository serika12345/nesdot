import React from "react";
import styles from "./ScreenModePrimitives.module.css";

interface LibrarySectionContentProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly open: boolean;
}

interface PreviewViewportProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly active?: boolean;
}

const createLayout = (
  defaultClassName: string,
): React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>
> => {
  return React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    function LayoutComponent({ className, ...props }, ref) {
      const combinedClassName =
        typeof className === "string" && className.length > 0
          ? `${defaultClassName} ${className}`
          : defaultClassName;

      return <div {...props} ref={ref} className={combinedClassName} />;
    },
  );
};

export const ScreenModeEditorContent = createLayout(styles.editorContent ?? "");

export const WorkspaceHeaderActionCluster = createLayout(
  styles.workspaceHeaderActionCluster ?? "",
);

export const ZoomControlsRow = createLayout(styles.zoomControlsRow ?? "");

export const PreviewViewport = React.forwardRef<
  HTMLDivElement,
  PreviewViewportProps
>(function PreviewViewport({ active, className, ...props }, ref) {
  const baseClassName = styles.previewViewport ?? "";
  const activeClassName =
    active === true ? (styles.previewViewportActive ?? "") : "";
  const combinedClassName = [baseClassName, activeClassName, className]
    .filter(
      (value): value is string => typeof value === "string" && value.length > 0,
    )
    .join(" ");

  return <div {...props} ref={ref} className={combinedClassName} />;
});

export const PreviewCanvasWrap = createLayout(styles.previewCanvasWrap ?? "");

export const LibrarySectionContent = React.forwardRef<
  HTMLDivElement,
  LibrarySectionContentProps
>(function LibrarySectionContent({ open, className, ...props }, ref) {
  const baseClassName = styles.librarySectionContent ?? "";
  const closedClassName =
    open === true ? "" : (styles.librarySectionContentClosed ?? "");
  const combinedClassName = [baseClassName, closedClassName, className]
    .filter(
      (value): value is string => typeof value === "string" && value.length > 0,
    )
    .join(" ");

  return <div {...props} ref={ref} className={combinedClassName} />;
});

export const SpriteLibraryGrid = createLayout(styles.spriteLibraryGrid ?? "");

export const CharacterLibraryGrid = createLayout(
  styles.characterLibraryGrid ?? "",
);

export const CharacterPreviewTiles = createLayout(
  styles.characterPreviewTiles ?? "",
);

export const WarningList = createLayout(styles.warningList ?? "");
