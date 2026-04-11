import Stack, { type StackProps } from "@mui/material/Stack";
import React from "react";
import {
  CanvasViewport,
  DetailList,
  DetailRow,
  PanelHeaderRow,
  ToolButton,
} from "../../../App.styles";
import {
  SCREEN_EDITOR_CONTENT_CLASS_NAME,
  SCREEN_FLIP_TOOL_BUTTON_CLASS_NAME,
  SCREEN_GROUP_ACTION_BUTTON_CLASS_NAME,
  SCREEN_PREVIEW_CANVAS_WRAP_CLASS_NAME,
  SCREEN_PREVIEW_VIEWPORT_CLASS_NAME,
  SCREEN_READ_ONLY_DETAIL_ROW_CLASS_NAME,
  SCREEN_TALL_TOOL_BUTTON_CLASS_NAME,
  SCREEN_WARNING_LIST_CLASS_NAME,
  SCREEN_WIDE_TALL_TOOL_BUTTON_CLASS_NAME,
  SCREEN_ZOOM_CONTROLS_ROW_CLASS_NAME,
  mergeClassNames,
} from "../../../styleClassNames";

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

export const TwoColumnFieldGrid = createStackLayout("TwoColumnFieldGrid", {
  direction: "row",
  flexWrap: "wrap",
  spacing: "0.75rem",
  alignItems: "end",
});

export const ScreenModeEditorContent = createStackLayout(
  "ScreenModeEditorContent",
  {
    component: "div",
    className: SCREEN_EDITOR_CONTENT_CLASS_NAME,
  },
);

export const ScreenModeSection = createStackLayout("ScreenModeSection", {
  spacing: "0.875rem",
});

export const FullWidthField = createStackLayout("FullWidthField", {
  component: "label",
  spacing: "0.5rem",
  flexBasis: "100%",
});

export const GridActionRow = createStackLayout("GridActionRow", {
  flex: "1 1 10rem",
  justifyContent: "flex-end",
});

export const FullWidthActionRow = createStackLayout("FullWidthActionRow", {
  flexBasis: "100%",
  justifyContent: "flex-end",
});

export const WideTallToolButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof ToolButton>
>(function WideTallToolButton({ className, ...props }, ref) {
  return (
    <ToolButton
      ref={ref}
      {...props}
      className={mergeClassNames(
        SCREEN_TALL_TOOL_BUTTON_CLASS_NAME,
        SCREEN_WIDE_TALL_TOOL_BUTTON_CLASS_NAME,
        typeof className === "string" ? className : false,
      )}
    />
  );
});

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

export const collapseChevronStyle = (open: boolean): React.CSSProperties => ({
  transform: open ? "rotate(180deg)" : "rotate(0deg)",
  transition: "transform 160ms ease",
});

export const ReadOnlyDetailRow = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof DetailRow>
>(function ReadOnlyDetailRow({ className, ...props }, ref) {
  return (
    <DetailRow
      ref={ref}
      {...props}
      px={0}
      py={0}
      className={mergeClassNames(
        SCREEN_READ_ONLY_DETAIL_ROW_CLASS_NAME,
        typeof className === "string" ? className : false,
      )}
    />
  );
});

export const FlipButtonGrid = createStackLayout("FlipButtonGrid", {
  direction: "row",
  spacing: "0.75rem",
  alignItems: "end",
});

export const FlipToolButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof ToolButton>
>(function FlipToolButton({ className, ...props }, ref) {
  return (
    <ToolButton
      ref={ref}
      {...props}
      className={mergeClassNames(
        SCREEN_FLIP_TOOL_BUTTON_CLASS_NAME,
        typeof className === "string" ? className : false,
      )}
    />
  );
});

export const GroupActionButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof ToolButton>
>(function GroupActionButton({ className, ...props }, ref) {
  return (
    <ToolButton
      ref={ref}
      {...props}
      className={mergeClassNames(
        SCREEN_TALL_TOOL_BUTTON_CLASS_NAME,
        SCREEN_GROUP_ACTION_BUTTON_CLASS_NAME,
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

export const PreviewCanvasWrap = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(function PreviewCanvasWrap({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      {...props}
      className={mergeClassNames(
        SCREEN_PREVIEW_CANVAS_WRAP_CLASS_NAME,
        typeof className === "string" ? className : false,
      )}
    />
  );
});

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
