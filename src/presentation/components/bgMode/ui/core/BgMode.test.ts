import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockedModules = vi.hoisted(() => {
  return {
    useBgModeWorkspaceEditingState: vi.fn(),
  };
});

vi.mock("../../logic/bgModeWorkspaceEditingState", () => {
  return {
    useBgModeWorkspaceEditingState:
      mockedModules.useBgModeWorkspaceEditingState,
  };
});

vi.mock("../panels/BgModeWorkspacePanel", () => {
  return {
    BgModeWorkspacePanel: () => React.createElement("div", {}, "bg-panel"),
  };
});

import { BgMode } from "./BgMode";

describe("BgMode", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockedModules.useBgModeWorkspaceEditingState.mockReturnValue({});
  });

  it("renders the workspace panel", () => {
    const markup = renderToStaticMarkup(React.createElement(BgMode));

    expect(markup).toContain("bg-panel");
  });
});
