const isDefinedClassName = (value: false | string): value is string =>
  value !== false && value !== "";

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

export const mergeClassNames = (
  ...classNames: ReadonlyArray<false | string>
): string => {
  const mergedClassName = classNames.filter(isDefinedClassName).join(" ");

  return mergedClassName;
};
