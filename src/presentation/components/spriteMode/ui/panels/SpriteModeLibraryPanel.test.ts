import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@radix-ui/themes", () => {
  const Badge = ({
    children,
    ...props
  }: React.PropsWithChildren<React.ComponentPropsWithoutRef<"span">>) =>
    React.createElement("span", props, children);

  const Button = ({
    children,
    ...props
  }: React.PropsWithChildren<React.ComponentPropsWithoutRef<"button">>) =>
    React.createElement("button", props, children);

  return {
    Badge,
    Button,
  };
});

vi.mock("../../../common/ui/chrome/SurfaceCard", () => {
  return {
    SurfaceCard: ({
      children,
      ...props
    }: React.PropsWithChildren<React.ComponentPropsWithoutRef<"div">>) =>
      React.createElement("div", props, children),
  };
});

vi.mock("../../../common/ui/preview/LibraryPreviewCard", () => {
  return {
    LibraryPreviewCard: ({
      badge,
      children,
      interactive,
      label,
      preview,
      selected,
      ...props
    }: React.PropsWithChildren<
      React.ComponentPropsWithoutRef<"button"> & {
        badge?: React.ReactNode;
        label?: React.ReactNode;
        interactive?: boolean;
        preview?: React.ReactNode;
        selected?: boolean;
      }
    >) => {
      return React.createElement(
        "button",
        {
          ...props,
          "data-selected-state": selected === true ? "true" : "false",
          "data-interactive-state": interactive === true ? "true" : "false",
        },
        children,
        preview,
        label,
        badge,
      );
    },
  };
});

vi.mock("../../../characterMode/ui/preview/CharacterModeTilePreview", () => {
  return {
    CharacterModeTilePreview: () => React.createElement("div", {}, "preview"),
  };
});

import { SpriteModeLibraryPanel } from "./SpriteModeLibraryPanel";

describe("SpriteModeLibraryPanel", () => {
  it("renders the sprite library and marks the active sprite", () => {
    const markup = renderToStaticMarkup(
      React.createElement(SpriteModeLibraryPanel, {
        libraryPanelState: {
          activeSprite: 1,
          handleSpriteSelect: vi.fn(),
          projectSpriteSize: 8,
          spritePalettes: [
            [0, 1, 2, 3],
            [0, 1, 2, 3],
            [0, 1, 2, 3],
            [0, 1, 2, 3],
          ],
          sprites: [
            {
              height: 8,
              paletteIndex: 0,
              pixels: [[0]],
              width: 8,
            },
            {
              height: 16,
              paletteIndex: 1,
              pixels: [[0]],
              width: 8,
            },
          ],
        },
      }),
    );

    expect(markup).toContain("スプライトライブラリ");
    expect(markup).toContain("preview");
    expect(markup).toContain("Sprite 0");
    expect(markup).toContain("Sprite 1");
    expect(markup).toContain('data-selected-state="true"');
    expect(markup).toContain('data-selected-state="false"');
  });
});
