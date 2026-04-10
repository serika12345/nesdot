import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ScreenModeBackgroundPlacementMockOverlay } from "./components/screenMode/overlays/ScreenModeBackgroundPlacementMockOverlay";

describe("ScreenModeBackgroundPlacementMockOverlay", () => {
  it("moves overlay geometry props into style attributes", () => {
    const markup = renderToStaticMarkup(
      <ScreenModeBackgroundPlacementMockOverlay
        placement={{ height: 16, width: 8, x: 1, y: 2 }}
        preview={{ kind: "none" }}
        screenZoomLevel={2}
      />,
    );

    expect(markup).toContain('aria-label="BG配置プレビュー"');
    expect(markup).not.toMatch(/\soverlayLeft="/);
    expect(markup).not.toMatch(/\soverlayTop="/);
    expect(markup).not.toMatch(/\soverlayWidth="/);
    expect(markup).not.toMatch(/\soverlayHeight="/);
    expect(markup).toContain("left:2px");
    expect(markup).toContain("top:4px");
    expect(markup).toContain("width:16px");
    expect(markup).toContain("height:32px");
  });
});
