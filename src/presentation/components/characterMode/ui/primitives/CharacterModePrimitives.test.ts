import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  CharacterStageViewport,
  StageEditorCard,
} from "./CharacterModePrimitives";

describe("CharacterModePrimitives", () => {
  it("renders StageEditorCard with a plain Paper shell", () => {
    const markup = renderToStaticMarkup(
      React.createElement(
        StageEditorCard,
        {
          flex: 1,
          minWidth: 0,
        },
        React.createElement("div", {}, "stage"),
      ),
    );

    expect(markup).toContain("stage");
    expect(markup).toContain("MuiPaper-outlined");
    expect(markup).not.toContain("app-panel");
  });

  it("renders CharacterStageViewport with a plain Paper shell", () => {
    const markup = renderToStaticMarkup(
      React.createElement(
        CharacterStageViewport,
        {
          dragging: true,
        },
        React.createElement("div", {}, "viewport"),
      ),
    );

    expect(markup).toContain('data-dragging-state="true"');
    expect(markup).toContain("viewport");
    expect(markup).toContain("MuiPaper-outlined");
    expect(markup).not.toContain("app-canvas-viewport");
  });
});
