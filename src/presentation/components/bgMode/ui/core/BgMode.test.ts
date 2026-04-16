import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("../panels/BgModeWorkspacePanel", () => {
  return {
    BgModeWorkspacePanel: () => React.createElement("div", {}, "bg-panel"),
  };
});

import { BgMode } from "./BgMode";

describe("BgMode", () => {
  it("renders the workspace panel", () => {
    const markup = renderToStaticMarkup(React.createElement(BgMode));

    expect(markup).toContain("bg-panel");
  });
});
