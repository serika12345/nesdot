const isDefinedClassName = (value: false | string): value is string =>
  value !== false && value !== "";

export const TOOL_BUTTON_CLASS_NAME = "app-tool-button";
export const COLLAPSE_TOGGLE_CLASS_NAME = "app-collapse-toggle";
export const ACTION_MENU_BUTTON_CLASS_NAME = "app-action-menu-button";
export const BADGE_CLASS_NAME = "app-badge";
export const APP_PANEL_CLASS_NAME = "app-panel";
export const APP_PANEL_TITLE_CLASS_NAME = "app-panel-title";
export const APP_ACTION_MENU_CLASS_NAME = "app-action-menu";
export const APP_FIELD_LABEL_CLASS_NAME = "app-field-label";
export const APP_CANVAS_VIEWPORT_CLASS_NAME = "app-canvas-viewport";
export const APP_SCROLL_AREA_CLASS_NAME = "app-scroll-area";
export const APP_HELPER_TEXT_CLASS_NAME = "app-helper-text";
export const APP_INTERACTIVE_PIXEL_CANVAS_CLASS_NAME =
  "app-interactive-pixel-canvas";

export const BACKGROUND_TILE_PREVIEW_CANVAS_CLASS_NAME =
  "background-tile-preview-canvas";

export const MENU_BAR_ROOT_CLASS_NAME = "menu-bar-root";
export const MENU_ROOT_CLASS_NAME = "menu-root";
export const MENU_TRIGGER_CLASS_NAME = "menu-trigger";
export const MENU_CONTENT_CLASS_NAME = "menu-content";
export const MENU_SEPARATOR_CLASS_NAME = "menu-separator";
export const MENU_ITEM_CLASS_NAME = "menu-item";
export const MENU_SUB_TRIGGER_CLASS_NAME = "menu-sub-trigger";
export const MENU_ITEM_CONTENT_LAYOUT_CLASS_NAME = "menu-item-content-layout";
export const MENU_ITEM_LABEL_LAYOUT_CLASS_NAME = "menu-item-label-layout";
export const MENU_ITEM_ICON_SLOT_CLASS_NAME = "menu-item-icon-slot";
export const MENU_ITEM_TEXT_CLASS_NAME = "menu-item-text";
export const MENU_ITEM_META_CLASS_NAME = "menu-item-meta";
export const MENU_MODE_SELECTION_MARKER_CLASS_NAME =
  "menu-mode-selection-marker";
export const MENU_ITEM_SHORTCUT_TEXT_CLASS_NAME = "menu-item-shortcut-text";
export const MENU_ABOUT_ICON_IMAGE_CLASS_NAME = "menu-about-icon-image";
export const MENU_ABOUT_APP_NAME_CLASS_NAME = "menu-about-app-name";
export const MENU_ABOUT_VERSION_TEXT_CLASS_NAME = "menu-about-version-text";

export const SCREEN_EDITOR_CONTENT_CLASS_NAME = "screen-mode-editor-content";
export const SCREEN_PREVIEW_VIEWPORT_CLASS_NAME =
  "screen-mode-preview-viewport";
export const SCREEN_SUMMARY_METRIC_CARD_CLASS_NAME =
  "screen-summary-metric-card";
export const SCREEN_STAGE_SURFACE_CLASS_NAME = "screen-stage-surface";
export const SCREEN_STAGE_INTERACTION_LAYER_CLASS_NAME =
  "screen-stage-interaction-layer";
export const SCREEN_STAGE_SPRITE_OUTLINE_CLASS_NAME =
  "screen-stage-sprite-outline";
export const SCREEN_STAGE_SPRITE_INDEX_CLASS_NAME = "screen-stage-sprite-index";
export const SCREEN_STAGE_MARQUEE_CLASS_NAME = "screen-stage-marquee";
export const SCREEN_STAGE_GUIDE_CLASS_NAME = "screen-stage-guide";
export const SCREEN_LIBRARY_SECTION_CLASS_NAME = "screen-library-section";
export const SCREEN_LIBRARY_SCROLL_AREA_CLASS_NAME =
  "screen-library-scroll-area";
export const SCREEN_SPRITE_LIBRARY_SCROLL_AREA_CLASS_NAME =
  "screen-sprite-library-scroll-area";
export const SCREEN_LIBRARY_PREVIEW_BUTTON_CLASS_NAME =
  "screen-library-preview-button";
export const SCREEN_PREVIEW_LABEL_CLASS_NAME = "screen-preview-label";
export const SCREEN_FLOATING_DRAG_PREVIEW_CLASS_NAME =
  "screen-floating-drag-preview";

export const CHARACTER_DECOMPOSITION_PALETTE_SLOT_BUTTON_CLASS_NAME =
  "character-decomposition-palette-slot-button";
export const CHARACTER_STAGE_VIEWPORT_CLASS_NAME = "character-stage-viewport";
export const CHARACTER_STAGE_CANVAS_CLASS_NAME = "character-stage-canvas";
export const CHARACTER_DECOMPOSITION_CANVAS_CLASS_NAME =
  "character-decomposition-canvas";
export const CHARACTER_SELECTED_REGION_FIELD_GRID_CLASS_NAME =
  "character-selected-region-field-grid";
export const CHARACTER_STAGE_DRAG_PREVIEW_CLASS_NAME =
  "character-stage-drag-preview";
export const CHARACTER_FLOATING_LIBRARY_PREVIEW_CLASS_NAME =
  "character-floating-library-preview";
export const CHARACTER_PORTAL_OVERLAY_CLASS_NAME = "character-portal-overlay";
export const CHARACTER_LIBRARY_GRID_CLASS_NAME = "character-library-grid";
export const CHARACTER_LIBRARY_SPRITE_BUTTON_CLASS_NAME =
  "character-library-sprite-button";
export const CHARACTER_LIBRARY_SPRITE_TITLE_CLASS_NAME =
  "character-library-sprite-title";
export const CHARACTER_LIBRARY_SPRITE_PREVIEW_FRAME_CLASS_NAME =
  "character-library-sprite-preview-frame";
export const CHARACTER_LIBRARY_INTERACTION_ROOT_CLASS_NAME =
  "character-library-interaction-root";
export const CHARACTER_EMPTY_TILE_PREVIEW_CLASS_NAME =
  "character-empty-tile-preview";
export const CHARACTER_PIXEL_PREVIEW_CELL_CLASS_NAME =
  "character-pixel-preview-cell";
export const CHARACTER_STAGE_SURFACE_CLASS_NAME = "character-stage-surface";
export const CHARACTER_REGION_OVERLAY_BUTTON_CLASS_NAME =
  "character-region-overlay-button";
export const CHARACTER_POSITIONED_ACTION_MENU_CLASS_NAME =
  "character-positioned-action-menu";
export const CHARACTER_POSITIONED_ACTION_MENU_BUTTON_CLASS_NAME =
  "character-positioned-action-menu-button";

export const mergeClassNames = (
  ...classNames: ReadonlyArray<false | string>
): string => {
  const mergedClassName = classNames.filter(isDefinedClassName).join(" ");

  return mergedClassName;
};
