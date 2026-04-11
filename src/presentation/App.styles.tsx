import ButtonBase from "@mui/material/ButtonBase";
import Stack, { type StackProps } from "@mui/material/Stack";
import React from "react";
import {
  ACTION_MENU_BUTTON_CLASS_NAME,
  APP_ACTION_MENU_CLASS_NAME,
  APP_ACTION_MENU_OVERLAY_CLASS_NAME,
  APP_CANVAS_VIEWPORT_CLASS_NAME,
  APP_CONTAINER_CLASS_NAME,
  APP_DETAIL_KEY_CLASS_NAME,
  APP_DETAIL_ROW_CLASS_NAME,
  APP_DETAIL_VALUE_CLASS_NAME,
  APP_DIVIDER_CLASS_NAME,
  APP_EYEBROW_CLASS_NAME,
  APP_FIELD_LABEL_CLASS_NAME,
  APP_H3_CLASS_NAME,
  APP_HELPER_TEXT_CLASS_NAME,
  APP_METRIC_CARD_CLASS_NAME,
  APP_METRIC_LABEL_CLASS_NAME,
  APP_METRIC_VALUE_CLASS_NAME,
  APP_MODE_SWITCHER_CARD_CLASS_NAME,
  APP_MODE_SWITCHER_TITLE_CLASS_NAME,
  APP_PANEL_CLASS_NAME,
  APP_PANEL_DESCRIPTION_CLASS_NAME,
  APP_PANEL_TITLE_CLASS_NAME,
  APP_SCROLL_AREA_CLASS_NAME,
  APP_SCROLL_COLUMN_CLASS_NAME,
  BADGE_CLASS_NAME,
  COLLAPSE_TOGGLE_CLASS_NAME,
  ICON_ACTION_BUTTON_CLASS_NAME,
  TOOL_BUTTON_CLASS_NAME,
  mergeClassNames,
} from "./styleClassNames";

type ButtonTone = "neutral" | "primary" | "danger";
type BadgeTone = "neutral" | "accent" | "danger";
type ToolButtonProps = React.ComponentProps<typeof ButtonBase> & {
  active?: boolean;
  tone?: ButtonTone;
};
type CollapseToggleProps = React.ComponentProps<typeof ButtonBase> & {
  open?: boolean;
};
type IconActionButtonProps = React.ComponentProps<typeof ButtonBase> & {
  active?: boolean;
};
type BadgeProps = React.ComponentProps<"span"> & {
  tone?: BadgeTone;
};

const createBoxLayout = (
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
        return <Root ref={ref} {...defaultProps} {...props} />;
      }

      return (
        <Root
          ref={ref}
          {...defaultProps}
          {...props}
          className={mergedClassName}
        />
      );
    },
  );

  return LayoutComponent;
};

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

const toBooleanDataValue = (value?: boolean): "true" | "false" =>
  value === true ? "true" : "false";

const resolveButtonTone = (tone?: ButtonTone): ButtonTone => {
  if (tone === "primary") {
    return "primary";
  }

  if (tone === "danger") {
    return "danger";
  }

  return "neutral";
};

const resolveBadgeTone = (tone?: BadgeTone): BadgeTone => {
  if (tone === "accent") {
    return "accent";
  }

  if (tone === "danger") {
    return "danger";
  }

  return "neutral";
};

const ToolButtonRoot = React.forwardRef<HTMLButtonElement, ToolButtonProps>(
  function ToolButtonRoot({ active, tone, ...props }, ref) {
    return (
      <ButtonBase
        ref={ref}
        {...props}
        data-active={toBooleanDataValue(active)}
        data-tone={resolveButtonTone(tone)}
      />
    );
  },
);

const CollapseToggleRoot = React.forwardRef<
  HTMLButtonElement,
  CollapseToggleProps
>(function CollapseToggleRoot({ open, ...props }, ref) {
  return (
    <ButtonBase ref={ref} {...props} data-open={toBooleanDataValue(open)} />
  );
});

const IconActionButtonRoot = React.forwardRef<
  HTMLButtonElement,
  IconActionButtonProps
>(function IconActionButtonRoot({ active, ...props }, ref) {
  return (
    <ButtonBase ref={ref} {...props} data-active={toBooleanDataValue(active)} />
  );
});

const BadgeRoot = React.forwardRef<HTMLSpanElement, BadgeProps>(
  function BadgeRoot({ tone, ...props }, ref) {
    return <span ref={ref} {...props} data-tone={resolveBadgeTone(tone)} />;
  },
);

const resolvePrimitiveClassName = (
  defaultClassName: string,
  className: false | string,
): string => mergeClassNames(defaultClassName, className);

export const Container = createBoxLayout("Container", {
  component: "div",
  className: APP_CONTAINER_CLASS_NAME,
  p: { xs: "1rem", md: "1.5rem" },
});

export const Eyebrow = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(function Eyebrow({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      {...props}
      className={resolvePrimitiveClassName(
        APP_EYEBROW_CLASS_NAME,
        typeof className === "string" ? className : false,
      )}
    />
  );
});

export const ModeSwitcherCard = createBoxLayout("ModeSwitcherCard", {
  component: "div",
  className: APP_MODE_SWITCHER_CARD_CLASS_NAME,
  width: "100%",
  p: "0.875rem",
});

export const ModeSwitcherLayout = createStackLayout("ModeSwitcherLayout", {
  direction: { xs: "column", xl: "row" },
  spacing: "0.75rem",
  alignItems: "center",
});

export const ModeSwitcherHeader = createStackLayout("ModeSwitcherHeader", {
  minWidth: 0,
  spacing: "0.125rem",
});

export const ModeSwitcherTitle = React.forwardRef<
  HTMLHeadingElement,
  React.ComponentProps<"h2">
>(function ModeSwitcherTitle({ className, ...props }, ref) {
  return (
    <h2
      ref={ref}
      {...props}
      className={resolvePrimitiveClassName(
        APP_MODE_SWITCHER_TITLE_CLASS_NAME,
        typeof className === "string" ? className : false,
      )}
    />
  );
});

export const WorkspaceGrid = createStackLayout("WorkspaceGrid", {
  direction: { xs: "column", lg: "row" },
  spacing: { xs: "1rem", xl: "1.25rem" },
  flex: "1 1 0",
  minHeight: 0,
  overflow: { xs: "auto", lg: "visible" },
});

export const LeftPane = createBoxLayout("LeftPane", {
  component: "section",
  flex: 1,
  height: "100%",
  minWidth: 0,
  minHeight: 0,
  overflow: "hidden",
});

export const RightPane = createStackLayout("RightPane", {
  component: "aside",
  spacing: "1rem",
  width: { xs: "100%", lg: "20rem", xl: "22.5rem" },
  flexShrink: 0,
  height: "100%",
  minHeight: { xs: "auto", lg: 0 },
  overflow: "hidden",
});

export const Panel = createStackLayout("Panel", {
  component: "div",
  className: APP_PANEL_CLASS_NAME,
  spacing: "0.875rem",
  minWidth: 0,
  minHeight: 0,
  p: "1.125rem",
});

export const PanelHeader = createStackLayout("PanelHeader", {
  position: "relative",
  zIndex: 1,
  spacing: "0.3125rem",
});

export const PanelHeaderRow = createStackLayout("PanelHeaderRow", {
  direction: "row",
  alignItems: "center",
  justifyContent: "space-between",
  spacing: "0.75rem",
  flexWrap: "wrap",
});

export const PanelTitle = React.forwardRef<
  HTMLHeadingElement,
  React.ComponentProps<"h2">
>(function PanelTitle({ className, ...props }, ref) {
  return (
    <h2
      ref={ref}
      {...props}
      className={resolvePrimitiveClassName(
        APP_PANEL_TITLE_CLASS_NAME,
        typeof className === "string" ? className : false,
      )}
    />
  );
});

export const PanelDescription = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentProps<"p">
>(function PanelDescription({ className, ...props }, ref) {
  return (
    <p
      ref={ref}
      {...props}
      className={resolvePrimitiveClassName(
        APP_PANEL_DESCRIPTION_CLASS_NAME,
        typeof className === "string" ? className : false,
      )}
    />
  );
});

export const H3 = React.forwardRef<
  HTMLHeadingElement,
  React.ComponentProps<"h3">
>(function H3({ className, ...props }, ref) {
  return (
    <h3
      ref={ref}
      {...props}
      className={resolvePrimitiveClassName(
        APP_H3_CLASS_NAME,
        typeof className === "string" ? className : false,
      )}
    />
  );
});

export const Toolbar = createStackLayout("Toolbar", {
  direction: "row",
  flexWrap: "wrap",
  spacing: "0.625rem",
  alignItems: "center",
});

export const Spacer = createBoxLayout("Spacer", {
  flex: "1 1 1.5rem",
  minWidth: "0.75rem",
});

export const ToolButton = React.forwardRef<HTMLButtonElement, ToolButtonProps>(
  function ToolButton({ className, ...props }, ref) {
    return (
      <ToolButtonRoot
        ref={ref}
        {...props}
        className={mergeClassNames(
          TOOL_BUTTON_CLASS_NAME,
          typeof className === "string" ? className : false,
        )}
      />
    );
  },
);

export const ActionButton = ToolButton;

export const CollapseToggle = React.forwardRef<
  HTMLButtonElement,
  CollapseToggleProps
>(function CollapseToggle({ className, ...props }, ref) {
  return (
    <CollapseToggleRoot
      ref={ref}
      {...props}
      className={mergeClassNames(
        COLLAPSE_TOGGLE_CLASS_NAME,
        typeof className === "string" ? className : false,
      )}
    />
  );
});

export const ActionCluster = createBoxLayout("ActionCluster", {
  position: "relative",
  zIndex: 3,
  width: "min(100%, 20rem)",
});

export const ActionButtonsRow = createStackLayout("ActionButtonsRow", {
  direction: "row",
  alignItems: "center",
  justifyContent: "flex-end",
  spacing: "0.625rem",
  flexWrap: "wrap",
  width: "100%",
});

export const IconActionButton = React.forwardRef<
  HTMLButtonElement,
  IconActionButtonProps
>(function IconActionButton({ className, ...props }, ref) {
  return (
    <IconActionButtonRoot
      ref={ref}
      {...props}
      className={mergeClassNames(
        ICON_ACTION_BUTTON_CLASS_NAME,
        typeof className === "string" ? className : false,
      )}
    />
  );
});

export const IconLabel = createStackLayout("IconLabel", {
  component: "span",
  direction: "row",
  alignItems: "center",
  spacing: "0.625rem",
});

export const ActionMenu = createStackLayout("ActionMenu", {
  component: "div",
  className: APP_ACTION_MENU_CLASS_NAME,
  position: "fixed",
  minWidth: "13.75rem",
  maxWidth: "min(20rem, calc(100vw - 2rem))",
  spacing: "0.375rem",
  p: "0.625rem",
  zIndex: 9999,
});

export const ActionMenuOverlay = createBoxLayout("ActionMenuOverlay", {
  component: "div",
  className: APP_ACTION_MENU_OVERLAY_CLASS_NAME,
});

export const ActionMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof ButtonBase>
>(function ActionMenuButton({ className, ...props }, ref) {
  return (
    <ButtonBase
      ref={ref}
      {...props}
      className={mergeClassNames(
        ACTION_MENU_BUTTON_CLASS_NAME,
        typeof className === "string" ? className : false,
      )}
    />
  );
});

export const Field = createStackLayout("Field", {
  component: "label",
  spacing: "0.5rem",
});

export const FieldLabel = React.forwardRef<
  HTMLSpanElement,
  React.ComponentProps<"span">
>(function FieldLabel({ className, ...props }, ref) {
  return (
    <span
      ref={ref}
      {...props}
      className={resolvePrimitiveClassName(
        APP_FIELD_LABEL_CLASS_NAME,
        typeof className === "string" ? className : false,
      )}
    />
  );
});

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  function Badge({ className, ...props }, ref) {
    return (
      <BadgeRoot
        ref={ref}
        {...props}
        className={mergeClassNames(
          BADGE_CLASS_NAME,
          typeof className === "string" ? className : false,
        )}
      />
    );
  },
);

export const SplitLayout = createStackLayout("SplitLayout", {
  direction: { xs: "column", lg: "row" },
  spacing: "1rem",
  minHeight: 0,
});

export const CanvasViewport = createBoxLayout("CanvasViewport", {
  component: "div",
  className: APP_CANVAS_VIEWPORT_CLASS_NAME,
  overflow: "auto",
  minHeight: 0,
  p: "1.125rem",
});

export const ScrollColumn = createStackLayout("ScrollColumn", {
  component: "div",
  className: APP_SCROLL_COLUMN_CLASS_NAME,
  minHeight: 0,
  overflow: "auto",
  spacing: "1rem",
});

export const ScrollArea = createBoxLayout("ScrollArea", {
  component: "div",
  className: APP_SCROLL_AREA_CLASS_NAME,
  minHeight: 0,
  overflow: "auto",
});

export const MetricCard = createStackLayout("MetricCard", {
  component: "div",
  className: APP_METRIC_CARD_CLASS_NAME,
  spacing: "0.375rem",
  px: "1rem",
  py: "0.875rem",
});

export const MetricLabel = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(function MetricLabel({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      {...props}
      className={resolvePrimitiveClassName(
        APP_METRIC_LABEL_CLASS_NAME,
        typeof className === "string" ? className : false,
      )}
    />
  );
});

export const MetricValue = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(function MetricValue({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      {...props}
      className={resolvePrimitiveClassName(
        APP_METRIC_VALUE_CLASS_NAME,
        typeof className === "string" ? className : false,
      )}
    />
  );
});

export const DetailList = createStackLayout("DetailList", {
  position: "relative",
  zIndex: 1,
  spacing: "0.625rem",
});

export const DetailRow = createStackLayout("DetailRow", {
  component: "div",
  className: APP_DETAIL_ROW_CLASS_NAME,
  direction: "row",
  alignItems: "center",
  justifyContent: "space-between",
  spacing: "1rem",
  px: "0.875rem",
  py: "0.75rem",
});

export const DetailKey = React.forwardRef<
  HTMLSpanElement,
  React.ComponentProps<"span">
>(function DetailKey({ className, ...props }, ref) {
  return (
    <span
      ref={ref}
      {...props}
      className={resolvePrimitiveClassName(
        APP_DETAIL_KEY_CLASS_NAME,
        typeof className === "string" ? className : false,
      )}
    />
  );
});

export const DetailValue = React.forwardRef<
  HTMLSpanElement,
  React.ComponentProps<"span">
>(function DetailValue({ className, ...props }, ref) {
  return (
    <span
      ref={ref}
      {...props}
      className={resolvePrimitiveClassName(
        APP_DETAIL_VALUE_CLASS_NAME,
        typeof className === "string" ? className : false,
      )}
    />
  );
});

export const HelperText = createBoxLayout("HelperText", {
  component: "p",
  className: APP_HELPER_TEXT_CLASS_NAME,
  position: "relative",
  zIndex: 1,
  m: 0,
});

export const Divider = createBoxLayout("Divider", {
  component: "div",
  className: APP_DIVIDER_CLASS_NAME,
  position: "relative",
  zIndex: 1,
  height: "0.0625rem",
});
