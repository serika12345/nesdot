import type { BoxProps } from "@mui/material/Box";
import type { GridProps, GridSize } from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import type { StackProps } from "@mui/material/Stack";
import Box from "@mui/material/Box";
import MaterialGrid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import React from "react";
import { mergeClassNames } from "../../../../styleClassNames";
import { screenModePreviewViewportStyle } from "./ScreenModePrimitivesStyle";

export { collapseChevronStyle } from "./ScreenModePrimitivesStyle";

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
    position: "relative",
    zIndex: 1,
    spacing: "1rem",
  },
);

export const WorkspaceHeaderActionCluster = createStackLayout(
  "WorkspaceHeaderActionCluster",
  {
    direction: "row",
    alignItems: "center",
    flexWrap: "nowrap",
    spacing: 1.25,
  },
);

export const ZoomControlsRow = React.forwardRef<HTMLDivElement, StackProps>(
  function ZoomControlsRow({ className, ...props }, ref) {
    return (
      <Stack
        ref={ref}
        useFlexGap
        {...props}
        direction="row"
        alignItems="center"
        justifyContent="flex-start"
        spacing="0.75rem"
        flexWrap="wrap"
        className={mergeClassNames(
          typeof className === "string" ? className : false,
        )}
      />
    );
  },
);

type PreviewViewportProps = BoxProps & {
  active?: boolean;
};

export const PreviewViewport = React.forwardRef<
  HTMLDivElement,
  PreviewViewportProps
>(function PreviewViewport({ active, className, ...props }, ref) {
  const { component, style, ...forwardedProps } = props;

  void component;

  return (
    <Box
      ref={ref}
      {...forwardedProps}
      component={Paper}
      variant="outlined"
      data-active={active === true ? "true" : "false"}
      className={mergeClassNames(
        typeof className === "string" ? className : false,
      )}
      flex={1}
      minHeight={0}
      overflow="auto"
      position="relative"
      p="1.5rem"
      style={screenModePreviewViewportStyle(style ?? {}, active === true)}
    />
  );
});

export const PreviewCanvasWrap = createGridContainerLayout(
  "PreviewCanvasWrap",
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
);

export const CharacterLibraryGrid = createUniformGridLayout(
  "CharacterLibraryGrid",
  1,
  1,
  1.25,
);

export const CharacterPreviewTiles = createStackLayout(
  "CharacterPreviewTiles",
  {
    component: "div",
    direction: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    minWidth: 0,
    spacing: 0.5,
    minHeight: "1.5rem",
  },
);

export const WarningList = React.forwardRef<HTMLDivElement, StackProps>(
  function WarningList({ className, ...props }, ref) {
    return (
      <Stack
        ref={ref}
        useFlexGap
        {...props}
        flexShrink={0}
        position="relative"
        zIndex={1}
        spacing="0.625rem"
        className={mergeClassNames(
          typeof className === "string" ? className : false,
        )}
      />
    );
  },
);
