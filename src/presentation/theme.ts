import { alpha, createTheme, type Theme } from "@mui/material/styles";
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
  APP_INTERACTIVE_PIXEL_CANVAS_CLASS_NAME,
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
  BACKGROUND_TILE_PREVIEW_CANVAS_CLASS_NAME,
  BADGE_CLASS_NAME,
  CHARACTER_DECOMPOSITION_CANVAS_CLASS_NAME,
  CHARACTER_DECOMPOSITION_PALETTE_SLOT_BUTTON_CLASS_NAME,
  CHARACTER_DECOMPOSITION_TOOL_CARD_CLASS_NAME,
  CHARACTER_EDITOR_CARD_CLASS_NAME,
  CHARACTER_EMPTY_TILE_PREVIEW_CLASS_NAME,
  CHARACTER_FLOATING_LIBRARY_PREVIEW_CLASS_NAME,
  CHARACTER_LIBRARY_INTERACTION_ROOT_CLASS_NAME,
  CHARACTER_LIBRARY_SCROLL_AREA_CLASS_NAME,
  CHARACTER_LIBRARY_SPRITE_BUTTON_CLASS_NAME,
  CHARACTER_LIBRARY_SPRITE_PREVIEW_FRAME_CLASS_NAME,
  CHARACTER_LIBRARY_SPRITE_TITLE_CLASS_NAME,
  CHARACTER_PIXEL_PREVIEW_CELL_CLASS_NAME,
  CHARACTER_PORTAL_OVERLAY_CLASS_NAME,
  CHARACTER_POSITIONED_ACTION_MENU_BUTTON_CLASS_NAME,
  CHARACTER_POSITIONED_ACTION_MENU_CLASS_NAME,
  CHARACTER_REGION_OVERLAY_BUTTON_CLASS_NAME,
  CHARACTER_SELECTED_REGION_PREVIEW_SURFACE_ROOT_CLASS_NAME,
  CHARACTER_SELECTED_REGION_WIDE_TOOL_BUTTON_CLASS_NAME,
  CHARACTER_SET_DRAFT_ACTION_CONTAINER_CLASS_NAME,
  CHARACTER_SIDEBAR_CLASS_NAME,
  CHARACTER_STAGE_CANVAS_CLASS_NAME,
  CHARACTER_STAGE_DRAG_PREVIEW_CLASS_NAME,
  CHARACTER_STAGE_SURFACE_CLASS_NAME,
  CHARACTER_STAGE_VIEWPORT_CLASS_NAME,
  COLLAPSE_TOGGLE_CLASS_NAME,
  ICON_ACTION_BUTTON_CLASS_NAME,
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
  SCREEN_EDITOR_CONTENT_CLASS_NAME,
  SCREEN_FLIP_TOOL_BUTTON_CLASS_NAME,
  SCREEN_FLOATING_DRAG_PREVIEW_CLASS_NAME,
  SCREEN_GROUP_ACTION_BUTTON_CLASS_NAME,
  SCREEN_LIBRARY_PREVIEW_BUTTON_CLASS_NAME,
  SCREEN_LIBRARY_SCROLL_AREA_CLASS_NAME,
  SCREEN_LIBRARY_SECTION_CLASS_NAME,
  SCREEN_PREVIEW_LABEL_CLASS_NAME,
  SCREEN_PREVIEW_VIEWPORT_CLASS_NAME,
  SCREEN_READ_ONLY_DETAIL_ROW_CLASS_NAME,
  SCREEN_SPRITE_LIBRARY_SCROLL_AREA_CLASS_NAME,
  SCREEN_STAGE_GUIDE_CLASS_NAME,
  SCREEN_STAGE_INTERACTION_LAYER_CLASS_NAME,
  SCREEN_STAGE_MARQUEE_CLASS_NAME,
  SCREEN_STAGE_SPRITE_INDEX_CLASS_NAME,
  SCREEN_STAGE_SPRITE_OUTLINE_CLASS_NAME,
  SCREEN_STAGE_SURFACE_CLASS_NAME,
  SCREEN_SUMMARY_METRIC_CARD_CLASS_NAME,
  SCREEN_TALL_TOOL_BUTTON_CLASS_NAME,
  SCREEN_WIDE_TALL_TOOL_BUTTON_CLASS_NAME,
  TOOL_BUTTON_CLASS_NAME,
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
    [`.${APP_CONTAINER_CLASS_NAME}`]: {
      position: "relative",
      zIndex: 1,
      height: "100vh",
      overflow: "hidden",
    },
    [`.${APP_EYEBROW_CLASS_NAME}`]: {
      fontSize: "0.6875rem",
      fontWeight: 700,
      letterSpacing: "0.18em",
      color: "rgba(148, 163, 184, 0.92)",
    },
    [`.${APP_MODE_SWITCHER_CARD_CLASS_NAME}`]: {
      borderRadius: "1.25rem",
      background:
        "linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(248, 250, 252, 0.9))",
      border: "0.0625rem solid var(--panel-border)",
      boxShadow: "var(--panel-shadow)",
      backdropFilter: "blur(1.125rem)",
    },
    [`.${APP_MODE_SWITCHER_TITLE_CLASS_NAME}`]: {
      margin: 0,
      fontSize: "1.125rem",
      lineHeight: 1.05,
      letterSpacing: "-0.02em",
      color: "var(--ink-strong)",
    },
    [`.${APP_PANEL_CLASS_NAME}`]: {
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
    },
    [`.${APP_PANEL_TITLE_CLASS_NAME}`]: {
      margin: 0,
      fontSize: "1.5rem",
      lineHeight: 1.1,
      letterSpacing: "-0.03em",
      color: "var(--ink-strong)",
    },
    [`.${APP_PANEL_DESCRIPTION_CLASS_NAME}`]: {
      margin: 0,
      fontSize: "0.875rem",
      lineHeight: 1.6,
      color: "var(--ink-soft)",
    },
    [`.${APP_H3_CLASS_NAME}`]: {
      margin: 0,
    },
    [`.${APP_ACTION_MENU_CLASS_NAME}`]: {
      borderRadius: "1.125rem",
      background: "rgba(255, 255, 255, 0.98)",
      border: "0.0625rem solid rgba(148, 163, 184, 0.2)",
      boxShadow: "0 1.375rem 2.5rem rgba(15, 23, 42, 0.16)",
      backdropFilter: "blur(1.125rem)",
    },
    [`.${APP_ACTION_MENU_OVERLAY_CLASS_NAME}`]: {
      position: "fixed",
      inset: 0,
      zIndex: 9998,
    },
    [`.${APP_FIELD_LABEL_CLASS_NAME}`]: {
      fontSize: "0.75rem",
      fontWeight: 700,
      letterSpacing: "0.08em",
      color: "var(--ink-soft)",
    },
    [`.${APP_CANVAS_VIEWPORT_CLASS_NAME}`]: {
      position: "relative",
      zIndex: 1,
      borderRadius: "1.5rem",
      background:
        "radial-gradient(circle at top, rgba(30, 41, 59, 0.3), transparent 40%), linear-gradient(180deg, var(--canvas-shell-alt), var(--canvas-shell))",
      border: "0.0625rem solid rgba(148, 163, 184, 0.16)",
      boxShadow: "inset 0 0.0625rem 0 rgba(255, 255, 255, 0.03)",
      scrollbarGutter: "stable both-edges",
    },
    [`.${APP_SCROLL_COLUMN_CLASS_NAME}`]: {
      scrollbarGutter: "stable",
      marginRight: "-1.125rem",
      paddingRight: "1.125rem",
    },
    [`.${APP_SCROLL_AREA_CLASS_NAME}`]: {
      scrollbarGutter: "stable",
      marginRight: "-1.125rem",
      paddingRight: "1.125rem",
    },
    [`.${APP_METRIC_CARD_CLASS_NAME}`]: {
      borderRadius: "1.25rem",
      background: "rgba(248, 250, 252, 0.84)",
      border: "0.0625rem solid rgba(148, 163, 184, 0.16)",
    },
    [`.${APP_METRIC_LABEL_CLASS_NAME}`]: {
      fontSize: "0.6875rem",
      fontWeight: 700,
      letterSpacing: "0.1em",
      color: "var(--ink-soft)",
    },
    [`.${APP_METRIC_VALUE_CLASS_NAME}`]: {
      fontSize: "1.375rem",
      fontWeight: 700,
      letterSpacing: "-0.03em",
      color: "var(--ink-strong)",
    },
    [`.${APP_DETAIL_ROW_CLASS_NAME}`]: {
      borderRadius: "1.125rem",
      background: "rgba(248, 250, 252, 0.84)",
      border: "0.0625rem solid rgba(148, 163, 184, 0.16)",
    },
    [`.${APP_DETAIL_KEY_CLASS_NAME}`]: {
      fontSize: "0.8125rem",
      fontWeight: 600,
      color: "var(--ink-soft)",
    },
    [`.${APP_DETAIL_VALUE_CLASS_NAME}`]: {
      fontSize: "0.875rem",
      fontWeight: 700,
      color: "var(--ink-strong)",
      textAlign: "right",
    },
    [`.${APP_HELPER_TEXT_CLASS_NAME}`]: {
      fontSize: "0.8125rem",
      lineHeight: 1.7,
      color: "var(--ink-soft)",
    },
    [`.${APP_DIVIDER_CLASS_NAME}`]: {
      background:
        "linear-gradient(90deg, rgba(148, 163, 184, 0.18), rgba(148, 163, 184, 0.02))",
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
      borderRadius: "var(--menu-radius)",
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
    [`.MuiButtonBase-root.${TOOL_BUTTON_CLASS_NAME}`]: {
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
      "&[data-tone='neutral'][data-active='false']": {
        color: "var(--ink-strong)",
        background:
          "linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(241, 245, 249, 0.92))",
        border: "0.0625rem solid rgba(148, 163, 184, 0.24)",
        boxShadow: "0 0.625rem 1.25rem rgba(15, 23, 42, 0.08)",
      },
      "&[data-tone='neutral'][data-active='true'], &[data-tone='primary']": {
        color: "#f0fdfa",
        background: "linear-gradient(135deg, #0f766e 0%, #155e75 100%)",
        border: "0.0625rem solid rgba(21, 94, 117, 0.35)",
        boxShadow: "0 0.875rem 1.625rem rgba(15, 118, 110, 0.22)",
      },
      "&[data-tone='danger']": {
        color: "#fff1f2",
        background: "linear-gradient(135deg, #be123c 0%, #9f1239 100%)",
        border: "0.0625rem solid rgba(159, 18, 57, 0.4)",
        boxShadow: "0 0.75rem 1.5rem rgba(190, 24, 93, 0.2)",
      },
      "&:hover:not(:disabled)": {
        transform: "translateY(-0.0625rem)",
      },
      "&:disabled": {
        opacity: 0.45,
        cursor: "not-allowed",
        transform: "none",
        boxShadow: "none",
      },
    },
    [`.MuiButtonBase-root.${COLLAPSE_TOGGLE_CLASS_NAME}`]: {
      appearance: "none",
      gap: "0.5rem",
      borderRadius: "62.4375rem",
      padding: "0.5625rem 0.75rem",
      fontSize: "0.75rem",
      fontWeight: 700,
      letterSpacing: "0.06em",
      cursor: "pointer",
      transition:
        "transform 160ms ease, background 160ms ease, border-color 160ms ease",
      "&[data-open='false']": {
        border: "0.0625rem solid rgba(148, 163, 184, 0.18)",
        background: "rgba(248, 250, 252, 0.88)",
        color: "var(--ink-soft)",
      },
      "&[data-open='true']": {
        border: "0.0625rem solid rgba(15, 118, 110, 0.2)",
        background: "rgba(15, 118, 110, 0.1)",
        color: "#0f766e",
      },
      "&:hover": {
        transform: "translateY(-0.0625rem)",
      },
    },
    [`.MuiButtonBase-root.${ICON_ACTION_BUTTON_CLASS_NAME}`]: {
      appearance: "none",
      gap: "0.625rem",
      minHeight: "2.625rem",
      padding: "0.625rem 0.875rem",
      borderRadius: "1rem",
      whiteSpace: "nowrap",
      boxShadow: "0 0.625rem 1.25rem rgba(15, 23, 42, 0.08)",
      cursor: "pointer",
      fontSize: "0.8125rem",
      fontWeight: 700,
      letterSpacing: "0.01em",
      transition:
        "transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease",
      "&[data-active='false']": {
        border: "0.0625rem solid rgba(148, 163, 184, 0.2)",
        background:
          "linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.92))",
        color: "var(--ink-strong)",
      },
      "&[data-active='true']": {
        border: "0.0625rem solid rgba(15, 118, 110, 0.22)",
        background:
          "linear-gradient(180deg, rgba(240, 253, 250, 0.98), rgba(236, 253, 245, 0.9))",
        color: "#0f766e",
      },
      "&:hover": {
        transform: "translateY(-0.0625rem)",
      },
    },
    [`.MuiButtonBase-root.${ACTION_MENU_BUTTON_CLASS_NAME}`]: {
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
    },
    [`.${BADGE_CLASS_NAME}`]: {
      width: "fit-content",
      padding: "0.4375rem 0.75rem",
      borderRadius: "62.4375rem",
      fontSize: "0.75rem",
      fontWeight: 700,
      letterSpacing: "0.06em",
      "&[data-tone='neutral']": {
        color: "var(--ink-soft)",
        background: "rgba(148, 163, 184, 0.12)",
        border: "0.0625rem solid rgba(148, 163, 184, 0.18)",
      },
      "&[data-tone='accent']": {
        color: "#0f766e",
        background: "rgba(15, 118, 110, 0.12)",
        border: "0.0625rem solid rgba(15, 118, 110, 0.18)",
      },
      "&[data-tone='danger']": {
        color: "#be123c",
        background: "rgba(190, 24, 93, 0.1)",
        border: "0.0625rem solid rgba(190, 24, 93, 0.16)",
      },
    },
    [`.${SCREEN_TALL_TOOL_BUTTON_CLASS_NAME}`]: {
      minHeight: "3rem",
    },
    [`.${SCREEN_EDITOR_CONTENT_CLASS_NAME}`]: {
      position: "relative",
      zIndex: 1,
      "& > * + *": {
        marginTop: "1rem",
        paddingTop: "1rem",
        borderTop: "0.0625rem solid rgba(148, 163, 184, 0.16)",
      },
    },
    [`.${SCREEN_WIDE_TALL_TOOL_BUTTON_CLASS_NAME}`]: {
      width: "100%",
    },
    [`.${SCREEN_READ_ONLY_DETAIL_ROW_CLASS_NAME}`]: {
      background: "transparent",
      border: "none",
      boxShadow: "none",
      padding: 0,
      borderRadius: 0,
    },
    [`.${SCREEN_FLIP_TOOL_BUTTON_CLASS_NAME}`]: {
      flex: 1,
    },
    [`.${SCREEN_GROUP_ACTION_BUTTON_CLASS_NAME}`]: {
      width: "100%",
    },
    [`.${SCREEN_PREVIEW_VIEWPORT_CLASS_NAME}`]: {
      "&[data-active='false']": {
        cursor: "default",
      },
      "&[data-active='true']": {
        cursor: "grabbing",
      },
    },
    [`.${SCREEN_SUMMARY_METRIC_CARD_CLASS_NAME}`]: {
      background: "transparent",
      border: "none",
      boxShadow: "none",
    },
    [`.${SCREEN_STAGE_GUIDE_CLASS_NAME}`]: {
      marginTop: "0.25rem",
    },
    [`.${SCREEN_LIBRARY_SECTION_CLASS_NAME}`]: {
      borderRadius: "1rem",
      border: "0.0625rem solid rgba(148, 163, 184, 0.18)",
      background:
        "linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(241, 245, 249, 0.92))",
    },
    [`.${SCREEN_LIBRARY_SCROLL_AREA_CLASS_NAME}`]: {
      maxHeight: "15.5rem",
      overflowY: "auto",
      overflowX: "hidden",
      paddingRight: "0.25rem",
      scrollbarGutter: "stable",
    },
    [`.${SCREEN_SPRITE_LIBRARY_SCROLL_AREA_CLASS_NAME}`]: {
      maxHeight: "13.5rem",
    },
    [`.MuiButtonBase-root.${SCREEN_LIBRARY_PREVIEW_BUTTON_CLASS_NAME}`]: {
      appearance: "none",
      width: "100%",
      minWidth: 0,
      minHeight: "6rem",
      borderRadius: "0.875rem",
      padding: "0.5rem",
      cursor: "grab",
      touchAction: "none",
      userSelect: "none",
      transition: "transform 160ms ease, border-color 160ms ease",
      "&[data-dragging-state='false']": {
        border: "0.0625rem solid rgba(148, 163, 184, 0.2)",
        background:
          "linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.94))",
        boxShadow: "0 0.5rem 1rem rgba(15, 23, 42, 0.08)",
      },
      "&[data-dragging-state='true']": {
        border: "0.0625rem solid rgba(15, 118, 110, 0.46)",
        background: "rgba(240, 253, 250, 0.96)",
        boxShadow: "0 0.5rem 1rem rgba(15, 23, 42, 0.08)",
      },
      "&:active": {
        cursor: "grabbing",
      },
    },
    [`.${SCREEN_PREVIEW_LABEL_CLASS_NAME}`]: {
      fontSize: "0.625rem",
      fontWeight: 700,
      letterSpacing: "0.08em",
      color: "var(--ink-soft)",
    },
    [`.${SCREEN_FLOATING_DRAG_PREVIEW_CLASS_NAME}`]: {
      position: "fixed",
      zIndex: 9997,
      pointerEvents: "none",
      borderRadius: "0.875rem",
      border: "0.0625rem solid rgba(15, 118, 110, 0.36)",
      background: "rgba(240, 253, 250, 0.96)",
      boxShadow: "0 1rem 1.75rem rgba(15, 118, 110, 0.2)",
      padding: "0.5rem",
      minWidth: "4.25rem",
    },
    [`.${SCREEN_STAGE_SURFACE_CLASS_NAME}`]: {
      position: "relative",
      touchAction: "none",
      userSelect: "none",
      "&[data-dragging-state='false']": {
        cursor: "default",
      },
      "&[data-dragging-state='true']": {
        cursor: "grabbing",
      },
    },
    [`.${SCREEN_STAGE_INTERACTION_LAYER_CLASS_NAME}`]: {
      position: "absolute",
      inset: 0,
      zIndex: 3,
    },
    [`.${SCREEN_STAGE_SPRITE_OUTLINE_CLASS_NAME}`]: {
      position: "absolute",
      borderRadius: 0,
      pointerEvents: "none",
      "&[data-outline-visible-state='false']": {
        border: "none",
        background: "transparent",
      },
      "&[data-outline-visible-state='true'][data-selected-state='false']": {
        border: "0.0625rem solid rgba(148, 163, 184, 0.68)",
        background: "rgba(255, 255, 255, 0.02)",
      },
      "&[data-outline-visible-state='true'][data-selected-state='true']": {
        border: "0.125rem solid rgba(20, 184, 166, 0.92)",
        background: "rgba(45, 212, 191, 0.1)",
      },
    },
    [`.${SCREEN_STAGE_SPRITE_INDEX_CLASS_NAME}`]: {
      position: "absolute",
      left: "0.1875rem",
      top: "0.1875rem",
      borderRadius: "999px",
      padding: "0.125rem 0.375rem",
      fontSize: "0.625rem",
      fontWeight: 700,
      letterSpacing: "0.04em",
      color: "#f8fafc",
      background: "rgba(15, 23, 42, 0.66)",
      lineHeight: 1.2,
    },
    [`.${SCREEN_STAGE_MARQUEE_CLASS_NAME}`]: {
      position: "absolute",
      border: "0.0625rem solid rgba(45, 212, 191, 0.9)",
      background: "rgba(45, 212, 191, 0.12)",
      borderRadius: "0.375rem",
      pointerEvents: "none",
    },
    [`.${CHARACTER_EDITOR_CARD_CLASS_NAME}`]: {
      position: "relative",
      zIndex: 1,
      borderRadius: "1.375rem",
      background: "rgba(248, 250, 252, 0.84)",
      border: "0.0625rem solid rgba(148, 163, 184, 0.16)",
      boxShadow: "inset 0 0.0625rem 0 rgba(255, 255, 255, 0.72)",
    },
    [`.${CHARACTER_SIDEBAR_CLASS_NAME} > *`]: {
      flexShrink: 0,
    },
    [`.${CHARACTER_LIBRARY_SCROLL_AREA_CLASS_NAME}`]: {
      scrollbarGutter: "stable",
    },
    [`.MuiButtonBase-root.${CHARACTER_LIBRARY_SPRITE_BUTTON_CLASS_NAME}`]: {
      appearance: "none",
      minHeight: "7.375rem",
      padding: "0.75rem",
      borderRadius: "1.125rem",
      color: "var(--ink-strong)",
      cursor: "inherit",
      userSelect: "none",
      touchAction: "none",
      transition:
        "transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease",
      "&[data-dragging-state='false']": {
        border: "0.0625rem solid rgba(148, 163, 184, 0.2)",
        background:
          "linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(241, 245, 249, 0.94))",
        boxShadow: "0 0.625rem 1.125rem rgba(15, 23, 42, 0.08)",
      },
      "&[data-dragging-state='true']": {
        border: "0.0625rem solid rgba(15, 118, 110, 0.42)",
        background: "rgba(240, 253, 250, 0.96)",
        boxShadow: "0 1rem 1.875rem rgba(15, 118, 110, 0.16)",
      },
    },
    [`.${CHARACTER_LIBRARY_SPRITE_TITLE_CLASS_NAME}`]: {
      fontSize: "0.6875rem",
      fontWeight: 800,
      letterSpacing: "0.08em",
      color: "var(--ink-soft)",
    },
    [`.${CHARACTER_LIBRARY_SPRITE_PREVIEW_FRAME_CLASS_NAME}`]: {
      width: "5.5rem",
      minHeight: "4rem",
      borderRadius: "0.875rem",
      background:
        "linear-gradient(180deg, rgba(15, 23, 42, 0.06), rgba(148, 163, 184, 0.08))",
    },
    [`.${CHARACTER_LIBRARY_INTERACTION_ROOT_CLASS_NAME}`]: {
      "&[data-interactive-state='false']": {
        cursor: "default",
      },
      "&[data-interactive-state='true']": {
        cursor: "grab",
      },
    },
    [`.${CHARACTER_DECOMPOSITION_TOOL_CARD_CLASS_NAME}`]: {
      borderRadius: "1.125rem",
      background:
        "linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(241, 245, 249, 0.9))",
      border: "0.0625rem solid rgba(148, 163, 184, 0.18)",
    },
    [`.MuiButtonBase-root.${CHARACTER_DECOMPOSITION_PALETTE_SLOT_BUTTON_CLASS_NAME}`]:
      {
        width: "2.625rem",
        height: "2.625rem",
        borderRadius: "0.875rem",
        "&[data-selected-state='false']": {
          border: "0.0625rem solid rgba(148, 163, 184, 0.28)",
          boxShadow: "0 0.5rem 1rem rgba(15, 23, 42, 0.06)",
        },
        "&[data-selected-state='true']": {
          border: "0.1875rem solid #0f766e",
          boxShadow: "0 0.75rem 1.5rem rgba(15, 118, 110, 0.16)",
        },
      },
    [`.${CHARACTER_SELECTED_REGION_PREVIEW_SURFACE_ROOT_CLASS_NAME}`]: {
      borderRadius: "1.125rem",
      background:
        "linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(241, 245, 249, 0.92))",
      border: "0.0625rem solid rgba(148, 163, 184, 0.18)",
    },
    [`.MuiButtonBase-root.${CHARACTER_SELECTED_REGION_WIDE_TOOL_BUTTON_CLASS_NAME}`]:
      {
        width: "100%",
      },
    [`.${CHARACTER_STAGE_VIEWPORT_CLASS_NAME}`]: {
      "&[data-dragging-state='false']": {
        cursor: "default",
      },
      "&[data-dragging-state='true']": {
        cursor: "grabbing",
      },
    },
    [`.${CHARACTER_STAGE_CANVAS_CLASS_NAME}`]: {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
    },
    [`.${CHARACTER_DECOMPOSITION_CANVAS_CLASS_NAME}`]: {
      imageRendering: "pixelated",
    },
    [`.${CHARACTER_STAGE_DRAG_PREVIEW_CLASS_NAME}`]: {
      position: "absolute",
      opacity: 0.6,
      pointerEvents: "none",
      outline: "0.125rem dashed rgba(15, 118, 110, 0.72)",
      borderRadius: "0.5rem",
      boxShadow: "0 0 0 0.375rem rgba(15, 118, 110, 0.12)",
      background: "rgba(255, 255, 255, 0.72)",
      padding: "0.125rem",
    },
    [`.MuiButtonBase-root.${CHARACTER_REGION_OVERLAY_BUTTON_CLASS_NAME}`]: {
      position: "absolute",
      padding: "0.375rem",
      "&[data-issue-state='false']": {
        border: "0.125rem solid rgba(15, 118, 110, 0.92)",
        background: "rgba(240, 253, 250, 0.18)",
      },
      "&[data-issue-state='true']": {
        border: "0.125rem solid rgba(190, 24, 93, 0.92)",
        background: "rgba(255, 241, 242, 0.18)",
      },
      "&[data-selected-state='false']": {
        boxShadow: "none",
      },
      "&[data-selected-state='true']": {
        boxShadow: "0 0 0 0.375rem rgba(190, 24, 93, 0.12)",
      },
      "&[data-tool-mode='eraser'], &[data-tool-mode='pen']": {
        cursor: "default",
        pointerEvents: "none",
      },
      "&[data-tool-mode='region']": {
        cursor: "grab",
        pointerEvents: "auto",
      },
    },
    [`.${CHARACTER_POSITIONED_ACTION_MENU_CLASS_NAME}`]: {
      "&[data-ready='false']": {
        visibility: "hidden",
      },
      "&[data-ready='true']": {
        visibility: "visible",
      },
    },
    [`.${CHARACTER_FLOATING_LIBRARY_PREVIEW_CLASS_NAME}`]: {
      position: "fixed",
      zIndex: 200,
      pointerEvents: "none",
      width: "4rem",
      minHeight: "4rem",
      padding: "0.625rem",
      borderRadius: "1.125rem",
      background:
        "linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(241, 245, 249, 0.92))",
      border: "0.0625rem solid rgba(148, 163, 184, 0.18)",
      boxShadow: "0 1.125rem 2.125rem rgba(15, 23, 42, 0.18)",
      opacity: 0.92,
    },
    [`.${CHARACTER_PORTAL_OVERLAY_CLASS_NAME}`]: {
      position: "fixed",
      inset: 0,
      zIndex: 320,
    },
    [`.MuiButtonBase-root.${CHARACTER_POSITIONED_ACTION_MENU_BUTTON_CLASS_NAME}`]:
      {
        "&[data-danger='false']": {
          color: "var(--ink-strong)",
          background: "rgba(248, 250, 252, 0.96)",
        },
        "&[data-danger='true']": {
          color: "rgb(190, 24, 93)",
          background: "rgba(255, 241, 242, 0.96)",
        },
      },
    [`.${CHARACTER_EMPTY_TILE_PREVIEW_CLASS_NAME}`]: {
      borderRadius: "0.5rem",
      background:
        "linear-gradient(180deg, rgba(15, 23, 42, 0.08), rgba(15, 23, 42, 0.02))",
      border: "0.0625rem dashed rgba(148, 163, 184, 0.34)",
    },
    [`.${CHARACTER_PIXEL_PREVIEW_CELL_CLASS_NAME}`]: {
      flexShrink: 0,
    },
    [`.${CHARACTER_STAGE_SURFACE_CLASS_NAME}`]: {
      position: "relative",
      overflow: "hidden",
      background:
        "linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(241, 245, 249, 0.98))",
      boxShadow:
        "0 1.75rem 3.75rem rgba(15, 23, 42, 0.22), inset 0 0.0625rem 0 rgba(255, 255, 255, 0.92)",
      transition:
        "transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease",
      "&[data-active-drop='false']": {
        border: "0.0625rem solid rgba(148, 163, 184, 0.22)",
        transform: "none",
      },
      "&[data-active-drop='true']": {
        border: "0.0625rem solid rgba(45, 212, 191, 0.72)",
        transform: "scale(1.01)",
      },
      "&:focus-visible": {
        outline: "0.125rem solid rgba(15, 118, 110, 0.92)",
        outlineOffset: "0.25rem",
      },
      "&::before": {
        content: '""',
        position: "absolute",
        inset: 0,
        backgroundImage: [
          "linear-gradient(rgba(148, 163, 184, 0.18) 0.0625rem, transparent 0.0625rem)",
          "linear-gradient(90deg, rgba(148, 163, 184, 0.18) 0.0625rem, transparent 0.0625rem)",
          "linear-gradient(rgba(148, 163, 184, 0.15) 0.0625rem, transparent 0.0625rem)",
          "linear-gradient(90deg, rgba(148, 163, 184, 0.15) 0.0625rem, transparent 0.0625rem)",
        ].join(", "),
        backgroundSize: [
          "var(--stage-cell-size) var(--stage-cell-size)",
          "var(--stage-cell-size) var(--stage-cell-size)",
          "var(--stage-grid-size) var(--stage-grid-size)",
          "var(--stage-grid-size) var(--stage-grid-size)",
        ].join(", "),
        opacity: 0.95,
        pointerEvents: "none",
      },
      "&::after": {
        content: '""',
        position: "absolute",
        inset: 0,
        backgroundImage: [
          "linear-gradient(rgba(15, 118, 110, 0.12), rgba(15, 118, 110, 0.12))",
          "linear-gradient(90deg, rgba(15, 118, 110, 0.12), rgba(15, 118, 110, 0.12))",
        ].join(", "),
        backgroundSize:
          "0.0625rem var(--stage-height-px), var(--stage-width-px) 0.0625rem",
        backgroundPosition: "var(--stage-mid-x) 0, 0 var(--stage-mid-y)",
        backgroundRepeat: "no-repeat",
        pointerEvents: "none",
      },
    },
    [`.${CHARACTER_SET_DRAFT_ACTION_CONTAINER_CLASS_NAME}`]: {
      flexShrink: 0,
    },
    "::selection": {
      background: alpha(theme.palette.secondary.main, 0.32),
    },
  };
}
