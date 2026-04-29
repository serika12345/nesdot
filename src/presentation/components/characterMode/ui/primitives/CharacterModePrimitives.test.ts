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
  });

  it("renders CharacterStageViewport with a drag state class", () => {
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
    expect(markup).not.toContain("data-dragging");
  });
});
