import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockedHooks = vi.hoisted(() => {
  return {
    useScreenModeState: vi.fn(),
  };
});

vi.mock("../../logic/useScreenModeState", () => {
  return {
    useScreenModeState: mockedHooks.useScreenModeState,
  };
});

vi.mock("../panels/ScreenModeWorkspacePanel", () => {
  return {
    ScreenModeWorkspacePanel: () =>
      React.createElement("div", {}, "screen-mode-panel"),
  };
});

import { ScreenMode } from "./ScreenMode";

describe("ScreenMode", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockedHooks.useScreenModeState.mockReturnValue({});
  });

  it("renders the workspace panel", () => {
    const markup = renderToStaticMarkup(React.createElement(ScreenMode));

    expect(markup).toContain("screen-mode-panel");
  });
});
