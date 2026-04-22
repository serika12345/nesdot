import React from "react";
import { mergeClassNames } from "../../../../styleClassNames";
import styles from "./ScreenModePrimitives.module.css";

interface LibrarySectionContentProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly open: boolean;
}

interface PreviewViewportProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly active?: boolean;
}

const toBooleanDataValue = (value?: boolean): "true" | "false" =>
  value === true ? "true" : "false";

const createLayout = (
  defaultClassName: string,
): React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>
> => {
  return React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    function LayoutComponent({ className, ...props }, ref) {
      return (
        <div
          {...props}
          ref={ref}
          className={mergeClassNames(defaultClassName, className ?? false)}
        />
      );
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
  return (
    <div
      {...props}
      ref={ref}
      className={mergeClassNames(
        styles.previewViewport ?? "",
        className ?? false,
      )}
      data-active={toBooleanDataValue(active)}
    />
  );
});

export const PreviewCanvasWrap = createLayout(styles.previewCanvasWrap ?? "");

export const LibrarySectionContent = React.forwardRef<
  HTMLDivElement,
  LibrarySectionContentProps
>(function LibrarySectionContent({ open, className, ...props }, ref) {
  return (
    <div
      {...props}
      ref={ref}
      className={mergeClassNames(
        styles.librarySectionContent ?? "",
        className ?? false,
      )}
      data-open-state={toBooleanDataValue(open)}
    />
  );
});

export const SpriteLibraryGrid = createLayout(styles.spriteLibraryGrid ?? "");

export const CharacterLibraryGrid = createLayout(
  styles.characterLibraryGrid ?? "",
);

export const CharacterPreviewTiles = createLayout(
  styles.characterPreviewTiles ?? "",
);

export const WarningList = createLayout(styles.warningList ?? "");
