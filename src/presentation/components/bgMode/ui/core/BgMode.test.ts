import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("./BgModeScreen", () => {
  return {
    BgModeScreen: () => React.createElement("div", {}, "bg-screen"),
  };
});

import { BgMode } from "./BgMode";

describe("BgMode", () => {
  it("renders the bg mode screen", () => {
    const markup = renderToStaticMarkup(React.createElement(BgMode));

    expect(markup).toContain("bg-screen");
  });
});
