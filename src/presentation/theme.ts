import { alpha, createTheme, type Theme } from "@mui/material/styles";
import {
  APP_INTERACTIVE_PIXEL_CANVAS_CLASS_NAME,
  BACKGROUND_TILE_PREVIEW_CANVAS_CLASS_NAME,
  MENU_ABOUT_APP_NAME_CLASS_NAME,
  MENU_ABOUT_ICON_IMAGE_CLASS_NAME,
  MENU_ABOUT_VERSION_TEXT_CLASS_NAME,
  MENU_BAR_ROOT_CLASS_NAME,
  MENU_CONTENT_CLASS_NAME,
  MENU_ITEM_CLASS_NAME,
  MENU_ITEM_CONTENT_LAYOUT_CLASS_NAME,
  MENU_ITEM_ICON_SLOT_CLASS_NAME,
  MENU_ITEM_LABEL_LAYOUT_CLASS_NAME,
  MENU_ITEM_META_CLASS_NAME,
  MENU_ITEM_SHORTCUT_TEXT_CLASS_NAME,
  MENU_ITEM_TEXT_CLASS_NAME,
  MENU_ROOT_CLASS_NAME,
  MENU_SEPARATOR_CLASS_NAME,
  MENU_SUB_TRIGGER_CLASS_NAME,
  MENU_TRIGGER_CLASS_NAME,
} from "./styleClassNames";

const canvasShell = "#081320";
const canvasShellAlt = "#10253b";
const ink = "#1e293b";
const lineBase = "#94a3b8";
const shadowBase = "#0f172a";

const appThemeBase = createTheme({
  cssVariables: true,
  palette: {
    mode: "light",
    primary: {
      main: "#0f766e",
      dark: "#155e75",
      contrastText: "#f0fdfa",
    },
    secondary: {
      main: "#2dd4bf",
      dark: "#0f766e",
      contrastText: ink,
    },
    error: {
      main: "#be123c",
      dark: "#9f1239",
      contrastText: "#fff1f2",
    },
    info: {
      main: "#38bdf8",
      dark: "#0c4a6e",
      contrastText: "#f8fafc",
    },
    background: {
      default: "#0d1726",
      paper: alpha("#ffffff", 0.94),
    },
    text: {
      primary: shadowBase,
      secondary: "#64748b",
    },
    divider: alpha(lineBase, 0.22),
  },
  shape: {
    borderRadius: 18,
  },
  typography: {
    fontFamily:
      '"Avenir Next", "SF Pro Display", "Segoe UI", "Helvetica Neue", sans-serif',
    button: {
      fontWeight: 700,
      textTransform: "none",
    },
    h2: {
      fontSize: "1.5rem",
      lineHeight: 1.1,
      letterSpacing: "-0.03em",
      fontWeight: 700,
    },
  },
});

export const appTheme = createTheme(appThemeBase, {
  components: {
    MuiCssBaseline: {
      styleOverrides: getAppGlobalStyles(appThemeBase),
    },
  },
});

/**
 * テーマ値を使ってアプリ全体のグローバルスタイルを生成します。
 * CSS 変数とベース要素の見た目を一元化し、各画面が同じデザイントークンを共有できるようにします。
 */
function getAppGlobalStyles(theme: Theme) {
  return {
    ":root": {
      "--ink-strong": theme.palette.text.primary,
      "--ink": ink,
      "--ink-soft": theme.palette.text.secondary,
      "--panel-surface": alpha(theme.palette.common.white, 0.94),
      "--panel-surface-strong": alpha(theme.palette.common.white, 0.98),
      "--surface-muted": alpha(theme.palette.grey[50], 0.84),
      "--surface-quiet": alpha(theme.palette.grey[50], 0.92),
      "--line-soft": alpha(lineBase, 0.16),
      "--line-strong": alpha(lineBase, 0.22),
      "--accent-solid": theme.palette.primary.main,
      "--accent-emphasis": theme.palette.primary.dark,
      "--accent-contrast": theme.palette.primary.contrastText,
      "--accent-soft": alpha(theme.palette.primary.main, 0.1),
      "--accent-soft-strong": alpha(theme.palette.primary.main, 0.12),
      "--accent-border": alpha(theme.palette.primary.main, 0.18),
      "--accent-border-strong": alpha(theme.palette.primary.main, 0.22),
      "--accent-shadow": `0 1.125rem 1.875rem ${alpha(theme.palette.primary.main, 0.12)}`,
      "--danger-solid": theme.palette.error.main,
      "--danger-emphasis": theme.palette.error.dark,
      "--danger-contrast": theme.palette.error.contrastText,
      "--danger-soft": alpha(theme.palette.error.main, 0.1),
      "--danger-border": alpha(theme.palette.error.main, 0.16),
      "--panel-border": theme.palette.divider,
      "--panel-shadow": `0 1.5rem 3.75rem ${alpha(shadowBase, 0.18)}`,
      "--canvas-shell": canvasShell,
      "--canvas-shell-alt": canvasShellAlt,
    },
    "*": {
      boxSizing: "border-box",
    },
    html: {
      height: "100%",
      background: [
        `radial-gradient(circle at 12% 12%, ${alpha(theme.palette.info.main, 0.18)}, transparent 24%)`,
        `radial-gradient(circle at 88% 18%, ${alpha(theme.palette.secondary.main, 0.14)}, transparent 20%)`,
        "linear-gradient(180deg, #07111d 0%, #0d1726 48%, #101827 100%)",
      ].join(", "),
    },
    body: {
      margin: 0,
      height: "100%",
      minWidth: 0,
      color: "var(--ink)",
      fontFamily: theme.typography.fontFamily,
      background: "transparent",
      overflow: "hidden",
    },
    "body::before": {
      content: '""',
      position: "fixed",
      inset: 0,
      backgroundImage: [
        `linear-gradient(${alpha(lineBase, 0.05)} 0.0625rem, transparent 0.0625rem)`,
        `linear-gradient(90deg, ${alpha(lineBase, 0.05)} 0.0625rem, transparent 0.0625rem)`,
      ].join(", "),
      backgroundSize: "1.75rem 1.75rem",
      maskImage:
        "linear-gradient(180deg, rgba(0, 0, 0, 0.48), transparent 80%)",
      pointerEvents: "none",
    },
    "button, input, select": {
      font: "inherit",
    },
    "#root": {
      height: "100vh",
      overflow: "hidden",
    },
    [`.${APP_INTERACTIVE_PIXEL_CANVAS_CLASS_NAME}`]: {
      display: "block",
      touchAction: "none",
      imageRendering: "pixelated",
    },
    [`.${BACKGROUND_TILE_PREVIEW_CANVAS_CLASS_NAME}`]: {
      display: "block",
      imageRendering: "pixelated",
      backgroundImage:
        "repeating-conic-gradient(#cbd5e1 0% 25%, #f8fafc 0% 50%)",
      backgroundSize: "0.5rem 0.5rem",
    },
    [`.${MENU_BAR_ROOT_CLASS_NAME}`]: {
      width: "100%",
      overflowX: "auto",
      overflowY: "hidden",
      borderRadius: "var(--menu-radius)",
      border: "0.0625rem solid var(--menu-border-root)",
      background:
        "linear-gradient(180deg, var(--menu-bg-root-top) 0%, var(--menu-bg-root-bottom) 100%)",
      padding: "var(--menu-space-05)",
      minHeight: "var(--menu-size-root-height)",
      boxShadow: "var(--menu-shadow-root)",
      backdropFilter: "blur(1rem)",
    },
    [`.${MENU_ROOT_CLASS_NAME}`]: {
      display: "inline-flex",
      alignItems: "center",
      gap: "var(--menu-space-025)",
      width: "max-content",
      minWidth: 0,
    },
    [`.${MENU_TRIGGER_CLASS_NAME}`]: {
      border: "0.0625rem solid var(--menu-border-transparent)",
      background: "transparent",
      color: "var(--menu-color-text-primary)",
      borderRadius: "var(--menu-radius)",
      fontFamily: "var(--menu-font-family)",
      fontSize: "var(--menu-font-size-body2)",
      lineHeight: "var(--menu-line-height-body2)",
      fontWeight: "var(--menu-font-weight-button)",
      padding: "var(--menu-space-0875) var(--menu-space-125)",
      userSelect: "none",
      cursor: "pointer",
      outline: "none",
      transition:
        "background-color var(--menu-transition-shortest) ease, border-color var(--menu-transition-shortest) ease, box-shadow var(--menu-transition-shortest) ease, color var(--menu-transition-shortest) ease",
      "&:hover": {
        borderColor: "var(--menu-border-hover)",
        background: "var(--menu-bg-hover)",
      },
      "&[data-state='open']": {
        color: "var(--menu-color-primary-dark)",
        borderColor: "var(--menu-border-open)",
        background:
          "linear-gradient(180deg, var(--menu-bg-root-top) 0%, var(--menu-bg-open) 100%)",
        boxShadow: "var(--menu-shadow-open)",
      },
      "&:focus-visible": {
        borderColor: "var(--menu-border-focus)",
        boxShadow: "0 0 0 0.125rem var(--menu-color-focus-ring)",
      },
    },
    [`.${MENU_CONTENT_CLASS_NAME}`]: {
      minWidth: "15rem",
      borderRadius: "var(--menu-radius-surface)",
      border: "0.0625rem solid var(--menu-border-surface)",
      background:
        "linear-gradient(180deg, var(--menu-bg-surface-top) 0%, var(--menu-bg-surface-bottom) 100%)",
      boxShadow: "var(--menu-shadow-surface)",
      padding: "var(--menu-space-075)",
      zIndex: "var(--menu-z-index)",
      display: "flex",
      flexDirection: "column",
      gap: "var(--menu-space-025)",
      backdropFilter: "blur(1rem)",
    },
    [`.${MENU_SEPARATOR_CLASS_NAME}`]: {
      height: "0.0625rem",
      margin: "var(--menu-space-05) var(--menu-space-025)",
      background: "var(--menu-border-divider)",
    },
    [`.${MENU_ITEM_CLASS_NAME}`]: {
      borderRadius: "var(--menu-radius)",
      minHeight: "var(--menu-size-item-height)",
      padding: "var(--menu-space-075) var(--menu-space-1)",
      fontSize: "var(--menu-font-size-body2)",
      lineHeight: "var(--menu-line-height-body2)",
      color: "var(--menu-color-text-primary)",
      outline: "none",
      userSelect: "none",
      cursor: "pointer",
      transition:
        "background-color var(--menu-transition-shortest) ease, color var(--menu-transition-shortest) ease",
      "&[data-highlighted]": {
        background: "var(--menu-bg-highlight)",
        color: "var(--menu-color-primary-dark)",
      },
      "&[data-disabled]": {
        color: "var(--menu-color-text-secondary)",
        opacity: 0.56,
        cursor: "not-allowed",
      },
    },
    [`.${MENU_SUB_TRIGGER_CLASS_NAME}`]: {
      borderRadius: "var(--menu-radius)",
      minHeight: "var(--menu-size-item-height)",
      padding: "var(--menu-space-075) var(--menu-space-1)",
      fontSize: "var(--menu-font-size-body2)",
      lineHeight: "var(--menu-line-height-body2)",
      color: "var(--menu-color-text-primary)",
      outline: "none",
      userSelect: "none",
      cursor: "pointer",
      transition:
        "background-color var(--menu-transition-shortest) ease, color var(--menu-transition-shortest) ease",
      "&[data-highlighted], &[data-state='open']": {
        background: "var(--menu-bg-highlight)",
        color: "var(--menu-color-primary-dark)",
      },
      "&[data-disabled]": {
        color: "var(--menu-color-text-secondary)",
        opacity: 0.56,
        cursor: "not-allowed",
      },
      display: "block",
    },
    [`.${MENU_ITEM_CONTENT_LAYOUT_CLASS_NAME}`]: {
      width: "100%",
      minWidth: 0,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "var(--menu-space-1)",
    },
    [`.${MENU_ITEM_LABEL_LAYOUT_CLASS_NAME}`]: {
      minWidth: 0,
      flex: "1 1 auto",
      flexDirection: "row",
      alignItems: "center",
      gap: "var(--menu-space-1)",
    },
    [`.${MENU_ITEM_ICON_SLOT_CLASS_NAME}`]: {
      color: "currentColor",
      opacity: 0.78,
    },
    [`.${MENU_ITEM_TEXT_CLASS_NAME}`]: {
      minWidth: 0,
      flex: "1 1 auto",
    },
    [`.${MENU_ITEM_META_CLASS_NAME}`]: {
      color: "currentColor",
      opacity: 0.72,
    },
    [`.${MENU_ITEM_SHORTCUT_TEXT_CLASS_NAME}`]: {
      fontSize: "var(--menu-font-size-caption)",
      lineHeight: "var(--menu-line-height-caption)",
      whiteSpace: "nowrap",
      fontVariantNumeric: "tabular-nums",
    },
    [`.${MENU_ABOUT_ICON_IMAGE_CLASS_NAME}`]: {
      width: "4.5rem",
      height: "4.5rem",
      borderRadius: "var(--menu-radius)",
    },
    [`.${MENU_ABOUT_APP_NAME_CLASS_NAME}`]: {
      fontSize: "var(--menu-font-size-subtitle1)",
      fontWeight: 700,
      lineHeight: "var(--menu-line-height-subtitle1)",
      color: "var(--menu-color-text-primary)",
    },
    [`.${MENU_ABOUT_VERSION_TEXT_CLASS_NAME}`]: {
      fontSize: "var(--menu-font-size-body2)",
      lineHeight: "var(--menu-line-height-body2)",
      color: "var(--menu-color-text-secondary)",
    },
    "::selection": {
      background: alpha(theme.palette.secondary.main, 0.32),
    },
  };
}
