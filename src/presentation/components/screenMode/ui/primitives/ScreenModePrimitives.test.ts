import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  PreviewCanvasWrap,
  PreviewViewport,
  ScreenModeEditorContent,
} from "./ScreenModePrimitives";

describe("ScreenModePrimitives", () => {
  it("maps the preview viewport active state to a data attribute", () => {
    const markup = renderToStaticMarkup(
      React.createElement(PreviewViewport, { active: true }, "Preview"),
    );

    expect(markup).toContain('data-active="true"');
    expect(markup).toContain("cursor:grabbing");
    expect(markup).not.toContain("screen-mode-preview-viewport");
    expect(markup).not.toContain("app-canvas-viewport");
    expect(markup).not.toMatch(/\sactive="/);
  });

  it("merges screen primitive class names", () => {
    const editorContentMarkup = renderToStaticMarkup(
      React.createElement(
        ScreenModeEditorContent,
        { className: "custom-editor-content" },
        "Content",
      ),
    );
    const previewWrapMarkup = renderToStaticMarkup(
      React.createElement(
        PreviewCanvasWrap,
        { className: "custom-preview-wrap" },
        "Wrap",
      ),
    );

    expect(editorContentMarkup).toContain("custom-editor-content");
    expect(editorContentMarkup).not.toContain("screen-mode-editor-content");
    expect(previewWrapMarkup).toContain("custom-preview-wrap");
  });
});
