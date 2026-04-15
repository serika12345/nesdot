import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  SCREEN_EDITOR_CONTENT_CLASS_NAME,
  SCREEN_PREVIEW_CANVAS_WRAP_CLASS_NAME,
  SCREEN_PREVIEW_VIEWPORT_CLASS_NAME,
} from "../../../../styleClassNames";
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
    expect(markup).toContain(SCREEN_PREVIEW_VIEWPORT_CLASS_NAME);
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

    expect(editorContentMarkup).toContain(SCREEN_EDITOR_CONTENT_CLASS_NAME);
    expect(editorContentMarkup).toContain("custom-editor-content");
    expect(previewWrapMarkup).toContain(SCREEN_PREVIEW_CANVAS_WRAP_CLASS_NAME);
    expect(previewWrapMarkup).toContain("custom-preview-wrap");
  });
});
