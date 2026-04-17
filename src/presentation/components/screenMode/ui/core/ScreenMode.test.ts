import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("../panels/ScreenModeWorkspacePanel", () => {
  return {
    ScreenModeWorkspacePanel: () =>
      React.createElement("div", {}, "screen-mode-panel"),
  };
});

import { ScreenMode } from "./ScreenMode";

describe("ScreenMode", () => {
  it("renders the workspace panel", () => {
    const markup = renderToStaticMarkup(React.createElement(ScreenMode));

    expect(markup).toContain("screen-mode-panel");
  });
});
