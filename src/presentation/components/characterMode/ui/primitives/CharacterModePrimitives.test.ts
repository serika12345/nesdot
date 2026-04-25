import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  CharacterStageViewport,
  StageEditorCard,
} from "./CharacterModePrimitives";

describe("CharacterModePrimitives", () => {
  it("renders StageEditorCard with the shared surface shell", () => {
    const markup = renderToStaticMarkup(
      React.createElement(
        StageEditorCard,
        {},
        React.createElement("div", {}, "stage"),
      ),
    );

    expect(markup).toContain("stage");
    expect(markup).toContain("stageEditorCard");
    expect(markup).not.toContain("MuiPaper-outlined");
  });

  it("renders CharacterStageViewport with local drag state styling", () => {
    const markup = renderToStaticMarkup(
      React.createElement(
        CharacterStageViewport,
        {
          dragging: true,
        },
        React.createElement("div", {}, "viewport"),
      ),
    );

    expect(markup).toContain("viewport");
    expect(markup).toContain("characterStageViewport");
    expect(markup).toContain("characterStageViewportDragging");
    expect(markup).not.toContain("data-dragging-state=");
    expect(markup).not.toContain("MuiPaper-outlined");
  });
});
