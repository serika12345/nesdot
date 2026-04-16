const isDefinedClassName = (value: false | string): value is string =>
  value !== false && value !== "";

export const APP_INTERACTIVE_PIXEL_CANVAS_CLASS_NAME =
  "app-interactive-pixel-canvas";

export const BACKGROUND_TILE_PREVIEW_CANVAS_CLASS_NAME =
  "background-tile-preview-canvas";

export const mergeClassNames = (
  ...classNames: ReadonlyArray<false | string>
): string => {
  const mergedClassName = classNames.filter(isDefinedClassName).join(" ");

  return mergedClassName;
};
