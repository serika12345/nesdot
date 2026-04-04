import { ButtonBase, Stack, type StackProps } from "@mui/material";
import { styled } from "@mui/material/styles";
import React from "react";

type ButtonTone = "neutral" | "primary" | "danger";
type BadgeTone = "neutral" | "accent" | "danger";

const createBoxLayout = (
  displayName: string,
  defaultProps: StackProps,
  Root: typeof Stack = Stack,
) => {
  void displayName;
  const LayoutComponent = React.forwardRef<HTMLDivElement, StackProps>(
    function LayoutComponent(props, ref) {
      return <Root ref={ref} {...defaultProps} {...props} />;
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
    function LayoutComponent(props, ref) {
      return <Root ref={ref} useFlexGap {...defaultProps} {...props} />;
    },
  );

  return LayoutComponent;
};

const shouldForwardButtonStateProp = (prop: PropertyKey): boolean =>
  prop !== "active" && prop !== "tone";

const shouldForwardOpenProp = (prop: PropertyKey): boolean => prop !== "open";

const shouldForwardActiveProp = (prop: PropertyKey): boolean =>
  prop !== "active";

const buttonStyleOptions = (active?: boolean, tone?: ButtonTone) => ({
  ...(active === true ? { active: true } : {}),
  ...(active === false ? { active: false } : {}),
  ...(tone === "neutral" || tone === "primary" || tone === "danger"
    ? { tone }
    : {}),
});

const badgeStyleOptions = (tone?: BadgeTone) => ({
  ...(tone === "neutral" || tone === "accent" || tone === "danger"
    ? { tone }
    : {}),
});

const buttonStyles = ({
  active = false,
  tone = "neutral",
}: {
  active?: boolean;
  tone?: ButtonTone;
}) => {
  if (tone === "danger") {
    return {
      color: "#fff1f2",
      background: "linear-gradient(135deg, #be123c 0%, #9f1239 100%)",
      border: "0.0625rem solid rgba(159, 18, 57, 0.4)",
      boxShadow: "0 0.75rem 1.5rem rgba(190, 24, 93, 0.2)",
    };
  }

  if (tone === "primary" || active) {
    return {
      color: "#f0fdfa",
      background: "linear-gradient(135deg, #0f766e 0%, #155e75 100%)",
      border: "0.0625rem solid rgba(21, 94, 117, 0.35)",
      boxShadow: "0 0.875rem 1.625rem rgba(15, 118, 110, 0.22)",
    };
  }

  return {
    color: "var(--ink-strong)",
    background:
      "linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(241, 245, 249, 0.92))",
    border: "0.0625rem solid rgba(148, 163, 184, 0.24)",
    boxShadow: "0 0.625rem 1.25rem rgba(15, 23, 42, 0.08)",
  };
};

const badgeStyles = ({ tone = "neutral" }: { tone?: BadgeTone }) => {
  if (tone === "accent") {
    return {
      color: "#0f766e",
      background: "rgba(15, 118, 110, 0.12)",
      border: "0.0625rem solid rgba(15, 118, 110, 0.18)",
    };
  }

  if (tone === "danger") {
    return {
      color: "#be123c",
      background: "rgba(190, 24, 93, 0.1)",
      border: "0.0625rem solid rgba(190, 24, 93, 0.16)",
    };
  }

  return {
    color: "var(--ink-soft)",
    background: "rgba(148, 163, 184, 0.12)",
    border: "0.0625rem solid rgba(148, 163, 184, 0.18)",
  };
};

const ContainerRoot = styled("div")({
  position: "relative",
  zIndex: 1,
  height: "100vh",
  overflow: "hidden",
});

export const Container = createBoxLayout("Container", {
  component: ContainerRoot,
  p: { xs: "1rem", md: "1.5rem" },
});

export const Eyebrow = styled("div")({
  fontSize: "0.6875rem",
  fontWeight: 700,
  letterSpacing: "0.18em",
  color: "rgba(148, 163, 184, 0.92)",
});

const ModeSwitcherCardRoot = styled("div")({
  borderRadius: "1.25rem",
  background:
    "linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(248, 250, 252, 0.9))",
  border: "0.0625rem solid var(--panel-border)",
  boxShadow: "var(--panel-shadow)",
  backdropFilter: "blur(1.125rem)",
});

export const ModeSwitcherCard = createBoxLayout("ModeSwitcherCard", {
  component: ModeSwitcherCardRoot,
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

export const ModeSwitcherTitle = styled("h2")({
  margin: 0,
  fontSize: "1.125rem",
  lineHeight: 1.05,
  letterSpacing: "-0.02em",
  color: "var(--ink-strong)",
});

export const WorkspaceGrid = createStackLayout("WorkspaceGrid", {
  direction: { xs: "column", lg: "row" },
  spacing: { xs: "1rem", xl: "1.25rem" },
  height: "100%",
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

const PanelRoot = styled("div")({
  position: "relative",
  overflow: "hidden",
  borderRadius: "1.5rem",
  background:
    "linear-gradient(180deg, var(--panel-surface-strong), var(--panel-surface))",
  border: "0.0625rem solid var(--panel-border)",
  boxShadow: "var(--panel-shadow)",
  backdropFilter: "blur(1.125rem)",
  "&::after": {
    content: '""',
    position: "absolute",
    inset: "0 auto auto 0",
    width: "11.25rem",
    height: "11.25rem",
    background:
      "radial-gradient(circle, rgba(45, 212, 191, 0.09) 0%, transparent 70%)",
    pointerEvents: "none",
  },
});

export const Panel = createStackLayout("Panel", {
  component: PanelRoot,
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

export const PanelTitle = styled("h2")({
  margin: 0,
  fontSize: "1.5rem",
  lineHeight: 1.1,
  letterSpacing: "-0.03em",
  color: "var(--ink-strong)",
});

export const PanelDescription = styled("p")({
  margin: 0,
  fontSize: "0.875rem",
  lineHeight: 1.6,
  color: "var(--ink-soft)",
});

export const H3 = styled("h3")({
  margin: 0,
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

export const ToolButton = styled(ButtonBase, {
  shouldForwardProp: shouldForwardButtonStateProp,
})<{
  active?: boolean;
  tone?: ButtonTone;
}>(({ active, tone }) => ({
  appearance: "none",
  borderRadius: "1rem",
  padding: "0.75rem 1rem",
  fontSize: "0.875rem",
  fontWeight: 700,
  letterSpacing: "0.01em",
  cursor: "pointer",
  textAlign: "center",
  transition:
    "transform 160ms ease, box-shadow 160ms ease, background 160ms ease, opacity 160ms ease",
  ...buttonStyles(buttonStyleOptions(active, tone)),
  "&:hover:not(:disabled)": {
    transform: "translateY(-0.0625rem)",
  },
  "&:disabled": {
    opacity: 0.45,
    cursor: "not-allowed",
    transform: "none",
    boxShadow: "none",
  },
}));

export const ActionButton = ToolButton;

export const CollapseToggle = styled(ButtonBase, {
  shouldForwardProp: shouldForwardOpenProp,
})<{ open?: boolean }>(({ open }) => ({
  appearance: "none",
  gap: "0.5rem",
  borderRadius: "62.4375rem",
  padding: "0.5625rem 0.75rem",
  border: `0.0625rem solid ${open === true ? "rgba(15, 118, 110, 0.2)" : "rgba(148, 163, 184, 0.18)"}`,
  background:
    open === true ? "rgba(15, 118, 110, 0.1)" : "rgba(248, 250, 252, 0.88)",
  color: open === true ? "#0f766e" : "var(--ink-soft)",
  fontSize: "0.75rem",
  fontWeight: 700,
  letterSpacing: "0.06em",
  cursor: "pointer",
  transition:
    "transform 160ms ease, background 160ms ease, border-color 160ms ease",
  "&:hover": {
    transform: "translateY(-0.0625rem)",
  },
}));

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

export const IconActionButton = styled(ButtonBase, {
  shouldForwardProp: shouldForwardActiveProp,
})<{ active?: boolean }>(({ active }) => ({
  appearance: "none",
  gap: "0.625rem",
  minHeight: "2.625rem",
  padding: "0.625rem 0.875rem",
  borderRadius: "1rem",
  whiteSpace: "nowrap",
  border:
    active === true
      ? "0.0625rem solid rgba(15, 118, 110, 0.22)"
      : "0.0625rem solid rgba(148, 163, 184, 0.2)",
  background:
    active === true
      ? "linear-gradient(180deg, rgba(240, 253, 250, 0.98), rgba(236, 253, 245, 0.9))"
      : "linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.92))",
  color: active === true ? "#0f766e" : "var(--ink-strong)",
  boxShadow: "0 0.625rem 1.25rem rgba(15, 23, 42, 0.08)",
  cursor: "pointer",
  fontSize: "0.8125rem",
  fontWeight: 700,
  letterSpacing: "0.01em",
  transition:
    "transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease",
  "&:hover": {
    transform: "translateY(-0.0625rem)",
  },
}));

export const IconLabel = createStackLayout("IconLabel", {
  component: "span",
  direction: "row",
  alignItems: "center",
  spacing: "0.625rem",
});

const ActionMenuRoot = styled("div")({
  borderRadius: "1.125rem",
  background: "rgba(255, 255, 255, 0.98)",
  border: "0.0625rem solid rgba(148, 163, 184, 0.2)",
  boxShadow: "0 1.375rem 2.5rem rgba(15, 23, 42, 0.16)",
  backdropFilter: "blur(1.125rem)",
});

export const ActionMenu = createStackLayout("ActionMenu", {
  component: ActionMenuRoot,
  position: "fixed",
  minWidth: "13.75rem",
  maxWidth: "min(20rem, calc(100vw - 2rem))",
  spacing: "0.375rem",
  p: "0.625rem",
  zIndex: 9999,
});

const ActionMenuOverlayRoot = styled("div")({
  position: "fixed",
  inset: 0,
  zIndex: 9998,
});

export const ActionMenuOverlay = createBoxLayout("ActionMenuOverlay", {
  component: ActionMenuOverlayRoot,
});

export const ActionMenuButton = styled(ButtonBase)({
  appearance: "none",
  width: "100%",
  justifyContent: "space-between",
  gap: "0.75rem",
  padding: "0.6875rem 0.75rem",
  border: 0,
  borderRadius: "0.75rem",
  background: "transparent",
  color: "var(--ink-strong)",
  cursor: "pointer",
  fontSize: "0.8125rem",
  fontWeight: 700,
  textAlign: "left",
  transition: "background 160ms ease",
  "&:hover": {
    background: "rgba(15, 23, 42, 0.05)",
  },
});

export const Field = createStackLayout("Field", {
  component: "label",
  spacing: "0.5rem",
});

export const FieldLabel = styled("span")({
  fontSize: "0.75rem",
  fontWeight: 700,
  letterSpacing: "0.08em",
  color: "var(--ink-soft)",
});

export const Badge = styled("span")<{ tone?: BadgeTone }>(({ tone }) => ({
  width: "fit-content",
  padding: "0.4375rem 0.75rem",
  borderRadius: "62.4375rem",
  fontSize: "0.75rem",
  fontWeight: 700,
  letterSpacing: "0.06em",
  ...badgeStyles(badgeStyleOptions(tone)),
}));

export const SplitLayout = createStackLayout("SplitLayout", {
  direction: { xs: "column", lg: "row" },
  spacing: "1rem",
  minHeight: 0,
});

const CanvasViewportRoot = styled("div")({
  position: "relative",
  zIndex: 1,
  borderRadius: "1.5rem",
  background:
    "radial-gradient(circle at top, rgba(30, 41, 59, 0.3), transparent 40%), linear-gradient(180deg, var(--canvas-shell-alt), var(--canvas-shell))",
  border: "0.0625rem solid rgba(148, 163, 184, 0.16)",
  boxShadow: "inset 0 0.0625rem 0 rgba(255, 255, 255, 0.03)",
  scrollbarGutter: "stable both-edges",
});

export const CanvasViewport = createBoxLayout("CanvasViewport", {
  component: CanvasViewportRoot,
  overflow: "auto",
  minHeight: 0,
  p: "1.125rem",
});

export const ScrollColumn = createStackLayout("ScrollColumn", {
  component: styled("div")({
    scrollbarGutter: "stable both-edges",
  }),
  minHeight: 0,
  overflow: "auto",
  spacing: "1rem",
  pr: "0.25rem",
});

export const ScrollArea = createBoxLayout("ScrollArea", {
  component: styled("div")({
    scrollbarGutter: "stable both-edges",
  }),
  minHeight: 0,
  overflow: "auto",
  pr: "0.25rem",
});

const MetricCardRoot = styled("div")({
  borderRadius: "1.25rem",
  background: "rgba(248, 250, 252, 0.84)",
  border: "0.0625rem solid rgba(148, 163, 184, 0.16)",
});

export const MetricCard = createStackLayout("MetricCard", {
  component: MetricCardRoot,
  spacing: "0.375rem",
  px: "1rem",
  py: "0.875rem",
});

export const MetricLabel = styled("div")({
  fontSize: "0.6875rem",
  fontWeight: 700,
  letterSpacing: "0.1em",
  color: "var(--ink-soft)",
});

export const MetricValue = styled("div")({
  fontSize: "1.375rem",
  fontWeight: 700,
  letterSpacing: "-0.03em",
  color: "var(--ink-strong)",
});

export const DetailList = createStackLayout("DetailList", {
  position: "relative",
  zIndex: 1,
  spacing: "0.625rem",
});

const DetailRowRoot = styled("div")({
  borderRadius: "1.125rem",
  background: "rgba(248, 250, 252, 0.84)",
  border: "0.0625rem solid rgba(148, 163, 184, 0.16)",
});

export const DetailRow = createStackLayout("DetailRow", {
  component: DetailRowRoot,
  direction: "row",
  alignItems: "center",
  justifyContent: "space-between",
  spacing: "1rem",
  px: "0.875rem",
  py: "0.75rem",
});

export const DetailKey = styled("span")({
  fontSize: "0.8125rem",
  fontWeight: 600,
  color: "var(--ink-soft)",
});

export const DetailValue = styled("span")({
  fontSize: "0.875rem",
  fontWeight: 700,
  color: "var(--ink-strong)",
  textAlign: "right",
});

const HelperTextRoot = styled("p")({
  fontSize: "0.8125rem",
  lineHeight: 1.7,
  color: "var(--ink-soft)",
});

export const HelperText = createBoxLayout("HelperText", {
  component: HelperTextRoot,
  position: "relative",
  zIndex: 1,
  m: 0,
});

const DividerRoot = styled("div")({
  background:
    "linear-gradient(90deg, rgba(148, 163, 184, 0.18), rgba(148, 163, 184, 0.02))",
});

export const Divider = createBoxLayout("Divider", {
  component: DividerRoot,
  position: "relative",
  zIndex: 1,
  height: "0.0625rem",
});
