import Box, { type BoxProps } from "@mui/material/Box";
import MaterialGrid, {
  type GridProps,
  type GridSize,
} from "@mui/material/Grid";
import Stack, { type StackProps } from "@mui/material/Stack";
import React from "react";
import {
  CanvasViewport,
  DetailList,
  PanelHeaderRow,
} from "../../../../../App.styles";
import {
  SCREEN_CHARACTER_LIBRARY_GRID_CLASS_NAME,
  SCREEN_CHARACTER_PREVIEW_TILES_CLASS_NAME,
  SCREEN_EDITOR_CONTENT_CLASS_NAME,
  SCREEN_LIBRARY_SECTION_CONTENT_CLASS_NAME,
  SCREEN_PREVIEW_CANVAS_WRAP_CLASS_NAME,
  SCREEN_PREVIEW_VIEWPORT_CLASS_NAME,
  SCREEN_SPRITE_LIBRARY_GRID_CLASS_NAME,
  SCREEN_WARNING_LIST_CLASS_NAME,
  SCREEN_WORKSPACE_HEADER_ACTION_CLUSTER_CLASS_NAME,
  SCREEN_ZOOM_CONTROLS_ROW_CLASS_NAME,
  mergeClassNames,
} from "../../../../../styleClassNames";

export { collapseChevronStyle } from "./styles";

type LibrarySectionContentProps = BoxProps & {
  open: boolean;
};

type GridContainerLayoutProps = Omit<GridProps, "container" | "size">;
type UniformGridLayoutProps = Omit<
  GridProps,
  "columns" | "container" | "size" | "spacing"
>;

const createStackLayout = (
  displayName: string,
  defaultProps: StackProps,
  Root: typeof Stack = Stack,
) => {
  void displayName;

  return React.forwardRef<HTMLDivElement, StackProps>(function LayoutComponent(
    { className, ...props },
    ref,
  ) {
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
  });
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

const createUniformGridLayout = (
  displayName: string,
  columns: GridProps["columns"],
  itemSize: GridSize,
  spacing: GridProps["spacing"],
  defaultProps: UniformGridLayoutProps = {},
) => {
  void displayName;

  return React.forwardRef<HTMLDivElement, UniformGridLayoutProps>(
    function LayoutComponent({ children, className, ...props }, ref) {
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
    },
  );
};

export const ScreenModeEditorContent = createStackLayout(
  "ScreenModeEditorContent",
  {
    component: "div",
    className: SCREEN_EDITOR_CONTENT_CLASS_NAME,
  },
);

export const WorkspaceHeaderActionCluster = createStackLayout(
  "WorkspaceHeaderActionCluster",
  {
    className: SCREEN_WORKSPACE_HEADER_ACTION_CLUSTER_CLASS_NAME,
    direction: "row",
    alignItems: "center",
    flexWrap: "nowrap",
    spacing: 1.25,
  },
);

export const ZoomControlsRow = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof PanelHeaderRow>
>(function ZoomControlsRow({ className, ...props }, ref) {
  return (
    <PanelHeaderRow
      ref={ref}
      {...props}
      justifyContent="flex-start"
      className={mergeClassNames(
        SCREEN_ZOOM_CONTROLS_ROW_CLASS_NAME,
        typeof className === "string" ? className : false,
      )}
    />
  );
});

type PreviewViewportProps = React.ComponentProps<typeof CanvasViewport> & {
  active?: boolean;
};

export const PreviewViewport = React.forwardRef<
  HTMLDivElement,
  PreviewViewportProps
>(function PreviewViewport({ active, className, ...props }, ref) {
  return (
    <CanvasViewport
      ref={ref}
      data-active={active === true ? "true" : "false"}
      className={mergeClassNames(
        SCREEN_PREVIEW_VIEWPORT_CLASS_NAME,
        typeof className === "string" ? className : false,
      )}
      flex={1}
      minHeight={0}
      p="1.5rem"
      {...props}
    />
  );
});

export const PreviewCanvasWrap = createGridContainerLayout(
  "PreviewCanvasWrap",
  {
    className: SCREEN_PREVIEW_CANVAS_WRAP_CLASS_NAME,
    wrap: "nowrap",
    justifyContent: "center",
    alignItems: "center",
    width: "max-content",
    height: "max-content",
    minWidth: "100%",
    minHeight: "100%",
  },
);

export const LibrarySectionContent = React.forwardRef<
  HTMLDivElement,
  LibrarySectionContentProps
>(function LibrarySectionContent({ open, className, ...props }, ref) {
  return (
    <Box
      ref={ref}
      {...props}
      display={open === true ? "block" : "none"}
      minHeight={0}
      data-open-state={open === true ? "true" : "false"}
      className={mergeClassNames(
        SCREEN_LIBRARY_SECTION_CONTENT_CLASS_NAME,
        typeof className === "string" ? className : false,
      )}
    />
  );
});

export const SpriteLibraryGrid = createUniformGridLayout(
  "SpriteLibraryGrid",
  2,
  1,
  1.25,
  {
    className: SCREEN_SPRITE_LIBRARY_GRID_CLASS_NAME,
  },
);

export const CharacterLibraryGrid = createUniformGridLayout(
  "CharacterLibraryGrid",
  1,
  1,
  1.25,
  {
    className: SCREEN_CHARACTER_LIBRARY_GRID_CLASS_NAME,
  },
);

export const CharacterPreviewTiles = createStackLayout(
  "CharacterPreviewTiles",
  {
    component: "div",
    className: SCREEN_CHARACTER_PREVIEW_TILES_CLASS_NAME,
    direction: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    minWidth: 0,
    spacing: 0.5,
    minHeight: "1.5rem",
  },
);

export const WarningList = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof DetailList>
>(function WarningList({ className, ...props }, ref) {
  return (
    <DetailList
      ref={ref}
      {...props}
      flexShrink={0}
      className={mergeClassNames(
        SCREEN_WARNING_LIST_CLASS_NAME,
        typeof className === "string" ? className : false,
      )}
    />
  );
});
