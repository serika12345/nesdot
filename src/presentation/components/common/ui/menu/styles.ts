import Stack from "@mui/material/Stack";
import { alpha, styled, type Theme } from "@mui/material/styles";
import type { CSSProperties } from "react";

const getMenuRadius = (theme: Theme): string => `${theme.shape.borderRadius}px`;

const getMenuTransition = (theme: Theme): string =>
  `${theme.transitions.duration.shortest}ms`;

export const MenuBarSurface = styled(Stack)(({ theme }) => ({
  width: "100%",
  overflowX: "auto",
  overflowY: "hidden",
  borderRadius: getMenuRadius(theme),
  border: `0.0625rem solid ${alpha(theme.palette.common.white, 0.48)}`,
  background: `linear-gradient(180deg, ${alpha(
    theme.palette.common.white,
    0.96,
  )} 0%, ${alpha(theme.palette.grey[50], 0.88)} 100%)`,
  padding: theme.spacing(0.5),
  minHeight: theme.spacing(6),
  boxShadow: `inset 0 0.0625rem 0 ${alpha(
    theme.palette.common.white,
    0.72,
  )}, ${theme.shadows[3]}`,
  backdropFilter: "blur(1rem)",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "flex-start",
  minWidth: 0,
}));

export const menuRootStyle = (theme: Theme): CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: theme.spacing(0.25),
  width: "max-content",
  minWidth: 0,
});

export const MenuTriggerAction = styled("button")(({ theme }) => ({
  border: `0.0625rem solid ${alpha(theme.palette.primary.main, 0)}`,
  background: "transparent",
  color: theme.palette.text.primary,
  borderRadius: getMenuRadius(theme),
  fontFamily: theme.typography.fontFamily,
  fontSize: theme.typography.body2.fontSize,
  lineHeight: theme.typography.body2.lineHeight,
  fontWeight: theme.typography.button.fontWeight,
  padding: `${theme.spacing(0.875)} ${theme.spacing(1.25)}`,
  userSelect: "none",
  cursor: "pointer",
  outline: "none",
  transition: `background-color ${getMenuTransition(
    theme,
  )} ease, border-color ${getMenuTransition(
    theme,
  )} ease, box-shadow ${getMenuTransition(theme)} ease, color ${getMenuTransition(
    theme,
  )} ease`,
  "&:hover": {
    borderColor: alpha(theme.palette.primary.main, 0.12),
    background: alpha(theme.palette.primary.main, 0.06),
  },
  "&[data-state='open']": {
    color: theme.palette.primary.dark,
    borderColor: alpha(theme.palette.primary.main, 0.18),
    background: `linear-gradient(180deg, ${alpha(
      theme.palette.common.white,
      0.96,
    )} 0%, ${alpha(theme.palette.primary.main, 0.14)} 100%)`,
    boxShadow: `0 0.75rem 1.5rem ${alpha(theme.palette.primary.main, 0.16)}`,
  },
  "&:focus-visible": {
    borderColor: alpha(theme.palette.primary.main, 0.28),
    boxShadow: `0 0 0 0.125rem ${alpha(theme.palette.primary.main, 0.18)}`,
  },
}));

export const MenuContentSurface = styled("div")(({ theme }) => ({
  minWidth: "15rem",
  borderRadius: getMenuRadius(theme),
  border: `0.0625rem solid ${alpha(theme.palette.divider, 0.95)}`,
  background: `linear-gradient(180deg, ${alpha(
    theme.palette.background.paper,
    0.98,
  )} 0%, ${alpha(theme.palette.grey[50], 0.96)} 100%)`,
  boxShadow: `0 1.5rem 3rem ${alpha(theme.palette.common.black, 0.18)}`,
  padding: theme.spacing(0.75),
  zIndex: theme.zIndex.modal + 1,
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(0.25),
  backdropFilter: "blur(1rem)",
}));

export const MenuSubContentSurface = styled("div")(({ theme }) => ({
  minWidth: "15rem",
  borderRadius: getMenuRadius(theme),
  border: `0.0625rem solid ${alpha(theme.palette.divider, 0.95)}`,
  background: `linear-gradient(180deg, ${alpha(
    theme.palette.background.paper,
    0.98,
  )} 0%, ${alpha(theme.palette.grey[50], 0.96)} 100%)`,
  boxShadow: `0 1.5rem 3rem ${alpha(theme.palette.common.black, 0.18)}`,
  padding: theme.spacing(0.75),
  zIndex: theme.zIndex.modal + 1,
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(0.25),
  backdropFilter: "blur(1rem)",
}));

export const MenuSeparatorLine = styled("div")(({ theme }) => ({
  height: "0.0625rem",
  margin: `${theme.spacing(0.5)} ${theme.spacing(0.25)}`,
  background: alpha(theme.palette.divider, 0.96),
}));

export const MenuItemAction = styled("div")(({ theme }) => ({
  borderRadius: getMenuRadius(theme),
  minHeight: theme.spacing(5),
  padding: `${theme.spacing(0.75)} ${theme.spacing(1)}`,
  fontSize: theme.typography.body2.fontSize,
  lineHeight: theme.typography.body2.lineHeight,
  color: theme.palette.text.primary,
  outline: "none",
  userSelect: "none",
  cursor: "pointer",
  transition: `background-color ${getMenuTransition(
    theme,
  )} ease, color ${getMenuTransition(theme)} ease`,
  "&[data-highlighted]": {
    background: alpha(theme.palette.primary.main, 0.12),
    color: theme.palette.primary.dark,
  },
  "&[data-disabled]": {
    color: theme.palette.text.secondary,
    opacity: 0.56,
    cursor: "not-allowed",
  },
}));

export const MenuSubTriggerAction = styled("div")(({ theme }) => ({
  borderRadius: getMenuRadius(theme),
  minHeight: theme.spacing(5),
  padding: `${theme.spacing(0.75)} ${theme.spacing(1)}`,
  fontSize: theme.typography.body2.fontSize,
  lineHeight: theme.typography.body2.lineHeight,
  color: theme.palette.text.primary,
  outline: "none",
  userSelect: "none",
  cursor: "pointer",
  transition: `background-color ${getMenuTransition(
    theme,
  )} ease, color ${getMenuTransition(theme)} ease`,
  display: "block",
  "&[data-highlighted], &[data-state='open']": {
    background: alpha(theme.palette.primary.main, 0.12),
    color: theme.palette.primary.dark,
  },
  "&[data-disabled]": {
    color: theme.palette.text.secondary,
    opacity: 0.56,
    cursor: "not-allowed",
  },
}));

export const MenuItemIconSlotRoot = styled("span")(({ theme }) => ({
  color: "currentColor",
  opacity: 0.78,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: theme.spacing(2.5),
  height: theme.spacing(2.5),
  flexShrink: 0,
}));

export const MenuItemMetaRoot = styled("span")(({ theme }) => ({
  color: "currentColor",
  opacity: 0.72,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: theme.spacing(0.75),
  flexShrink: 0,
}));

export const MenuModeSelectionMarkerRoot = styled("span")(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: theme.spacing(2),
  height: theme.spacing(2),
  flexShrink: 0,
}));

export const MenuItemTextLabel = styled("span")({
  minWidth: 0,
  flex: "1 1 auto",
});

export const MenuItemShortcutText = styled("span")(({ theme }) => ({
  fontSize: theme.typography.caption.fontSize,
  lineHeight: theme.typography.caption.lineHeight,
  whiteSpace: "nowrap",
  fontVariantNumeric: "tabular-nums",
}));

export const MenuAboutIconImage = styled("img")(({ theme }) => ({
  width: theme.spacing(9),
  height: theme.spacing(9),
  borderRadius: getMenuRadius(theme),
}));

export const MenuAboutAppName = styled("span")(({ theme }) => ({
  fontSize: theme.typography.subtitle1.fontSize,
  fontWeight: 700,
  lineHeight: theme.typography.subtitle1.lineHeight,
  color: theme.palette.text.primary,
}));

export const MenuAboutVersionText = styled("span")(({ theme }) => ({
  fontSize: theme.typography.body2.fontSize,
  lineHeight: theme.typography.body2.lineHeight,
  color: theme.palette.text.secondary,
}));
