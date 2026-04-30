import type { CSSProperties, ForwardedRef } from "react";

const UNITLESS_CSS_PROPERTIES = new Set([
  "flexGrow",
  "flexShrink",
  "fontWeight",
  "lineHeight",
  "opacity",
  "zIndex",
]);

const toCssPropertyName = (propertyName: string): string => {
  if (propertyName.startsWith("--")) {
    return propertyName;
  }

  return propertyName.replace(/[A-Z]/g, (character) => {
    return `-${character.toLowerCase()}`;
  });
};

const toCssPropertyValue = (
  propertyName: string,
  propertyValue: string | number,
): string => {
  if (typeof propertyValue === "string") {
    return propertyValue;
  }

  if (propertyValue === 0) {
    return "0";
  }

  return UNITLESS_CSS_PROPERTIES.has(propertyName)
    ? String(propertyValue)
    : `${propertyValue}px`;
};

export const assignForwardedRef = <T>(
  forwardedRef: ForwardedRef<T>,
  value: T | null,
): void => {
  if (typeof forwardedRef === "function") {
    forwardedRef(value);
    return;
  }

  if (forwardedRef instanceof Object) {
    Object.assign(forwardedRef, {
      current: value,
    });
  }
};

export const applyRuntimeStyle = <T extends HTMLElement>(
  element: T | null,
  style: CSSProperties,
): void => {
  if (element instanceof HTMLElement === false) {
    return;
  }

  Object.entries(style).forEach(([propertyName, propertyValue]) => {
    if (
      typeof propertyValue !== "string" &&
      typeof propertyValue !== "number"
    ) {
      return;
    }

    element.style.setProperty(
      toCssPropertyName(propertyName),
      toCssPropertyValue(propertyName, propertyValue),
    );
  });
};
