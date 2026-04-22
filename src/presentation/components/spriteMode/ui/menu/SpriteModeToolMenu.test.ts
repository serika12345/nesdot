import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@radix-ui/themes", () => {
  const Button = ({
    children,
    ...props
  }: React.PropsWithChildren<React.ComponentPropsWithoutRef<"button">>) =>
    React.createElement("button", props, children);

  return {
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

import { SpriteModeToolMenu } from "./SpriteModeToolMenu";

describe("SpriteModeToolMenu", () => {
  it("exposes the drawing tools as a labelled toolbar with pressed state", () => {
    const markup = renderToStaticMarkup(
      React.createElement(SpriteModeToolMenu, {
        toolMenu: {
          handleClearSprite: vi.fn(),
          handleToggleChangeOrderMode: vi.fn(),
          handleToolChange: vi.fn(),
          isChangeOrderMode: false,
          tool: "pen",
        },
      }),
    );

    expect(markup).toContain('aria-label="スプライト編集ツールメニュー"');
    expect(markup).toContain('role="toolbar"');
    expect(markup).toContain('aria-label="描画ツール"');
    expect(markup).toContain('aria-label="ペンツール"');
    expect(markup).toContain('aria-pressed="true"');
    expect(markup).toContain('aria-label="消しゴムツール"');
    expect(markup).toContain('aria-label="並べ替え"');
  });

  it("marks change-order mode as pressed and disables drawing actions", () => {
    const markup = renderToStaticMarkup(
      React.createElement(SpriteModeToolMenu, {
        toolMenu: {
          handleClearSprite: vi.fn(),
          handleToggleChangeOrderMode: vi.fn(),
          handleToolChange: vi.fn(),
          isChangeOrderMode: true,
          tool: "eraser",
        },
      }),
    );

    expect(markup).toContain('aria-label="並べ替え終了"');
    expect(markup).toContain('aria-pressed="true"');
    expect(markup).toContain("disabled");
  });
});
