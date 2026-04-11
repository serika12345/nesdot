import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  ActionMenu,
  Badge,
  CanvasViewport,
  CollapseToggle,
  DetailRow,
  Eyebrow,
  FieldLabel,
  IconActionButton,
  ModeSwitcherTitle,
  Panel,
  PanelDescription,
  ToolButton,
} from "./App.styles";
import {
  PreviewCanvasWrap,
  PreviewViewport,
  ScreenModeEditorContent,
} from "./components/screenMode/ui/primitives/ScreenModePrimitives";
import {
  APP_ACTION_MENU_CLASS_NAME,
  APP_CANVAS_VIEWPORT_CLASS_NAME,
  APP_DETAIL_ROW_CLASS_NAME,
  APP_EYEBROW_CLASS_NAME,
  APP_FIELD_LABEL_CLASS_NAME,
  APP_MODE_SWITCHER_TITLE_CLASS_NAME,
  APP_PANEL_CLASS_NAME,
  APP_PANEL_DESCRIPTION_CLASS_NAME,
  BADGE_CLASS_NAME,
  COLLAPSE_TOGGLE_CLASS_NAME,
  ICON_ACTION_BUTTON_CLASS_NAME,
  SCREEN_EDITOR_CONTENT_CLASS_NAME,
  SCREEN_PREVIEW_CANVAS_WRAP_CLASS_NAME,
  SCREEN_PREVIEW_VIEWPORT_CLASS_NAME,
  TOOL_BUTTON_CLASS_NAME,
} from "./styleClassNames";

describe("App style primitives", () => {
  it("maps tool button state props to data attributes", () => {
    const markup = renderToStaticMarkup(
      <ToolButton active={true} tone="primary" type="button">
        Zoom
      </ToolButton>,
    );

    expect(markup).toContain("<button");
    expect(markup).toContain('data-active="true"');
    expect(markup).toContain('data-tone="primary"');
    expect(markup).toContain(TOOL_BUTTON_CLASS_NAME);
    expect(markup).not.toMatch(/\sactive="/);
    expect(markup).not.toMatch(/\stone="/);
  });

  it("maps collapse and icon button state props to data attributes", () => {
    const collapseMarkup = renderToStaticMarkup(
      <CollapseToggle open={true} type="button">
        Open
      </CollapseToggle>,
    );
    const iconMarkup = renderToStaticMarkup(
      <IconActionButton active={false} type="button">
        Toggle
      </IconActionButton>,
    );

    expect(collapseMarkup).toContain('data-open="true"');
    expect(collapseMarkup).toContain(COLLAPSE_TOGGLE_CLASS_NAME);
    expect(collapseMarkup).not.toMatch(/\sopen="/);
    expect(iconMarkup).toContain('data-active="false"');
    expect(iconMarkup).toContain(ICON_ACTION_BUTTON_CLASS_NAME);
    expect(iconMarkup).not.toMatch(/\sactive="/);
  });

  it("maps badge tone to a data attribute", () => {
    const markup = renderToStaticMarkup(<Badge tone="danger">Warning</Badge>);

    expect(markup).toContain("<span");
    expect(markup).toContain('data-tone="danger"');
    expect(markup).toContain(BADGE_CLASS_NAME);
    expect(markup).not.toMatch(/\stone="/);
  });

  it("merges shared layout primitive class names", () => {
    const actionMenuMarkup = renderToStaticMarkup(
      <ActionMenu className="custom-menu">Action</ActionMenu>,
    );
    const canvasViewportMarkup = renderToStaticMarkup(
      <CanvasViewport className="custom-viewport">Preview</CanvasViewport>,
    );
    const detailRowMarkup = renderToStaticMarkup(
      <DetailRow className="custom-detail">Detail</DetailRow>,
    );
    const panelMarkup = renderToStaticMarkup(
      <Panel className="custom-panel">Panel</Panel>,
    );

    expect(actionMenuMarkup).toContain(APP_ACTION_MENU_CLASS_NAME);
    expect(actionMenuMarkup).toContain("custom-menu");
    expect(canvasViewportMarkup).toContain(APP_CANVAS_VIEWPORT_CLASS_NAME);
    expect(canvasViewportMarkup).toContain("custom-viewport");
    expect(detailRowMarkup).toContain(APP_DETAIL_ROW_CLASS_NAME);
    expect(detailRowMarkup).toContain("custom-detail");
    expect(panelMarkup).toContain(APP_PANEL_CLASS_NAME);
    expect(panelMarkup).toContain("custom-panel");
  });

  it("merges text primitive class names", () => {
    const eyebrowMarkup = renderToStaticMarkup(
      <Eyebrow className="custom-eyebrow">Alpha</Eyebrow>,
    );
    const titleMarkup = renderToStaticMarkup(
      <ModeSwitcherTitle className="custom-mode-title">
        Title
      </ModeSwitcherTitle>,
    );
    const descriptionMarkup = renderToStaticMarkup(
      <PanelDescription className="custom-description">Desc</PanelDescription>,
    );
    const fieldLabelMarkup = renderToStaticMarkup(
      <FieldLabel className="custom-field-label">Field</FieldLabel>,
    );

    expect(eyebrowMarkup).toContain(APP_EYEBROW_CLASS_NAME);
    expect(eyebrowMarkup).toContain("custom-eyebrow");
    expect(titleMarkup).toContain(APP_MODE_SWITCHER_TITLE_CLASS_NAME);
    expect(titleMarkup).toContain("custom-mode-title");
    expect(descriptionMarkup).toContain(APP_PANEL_DESCRIPTION_CLASS_NAME);
    expect(descriptionMarkup).toContain("custom-description");
    expect(fieldLabelMarkup).toContain(APP_FIELD_LABEL_CLASS_NAME);
    expect(fieldLabelMarkup).toContain("custom-field-label");
  });
});

describe("PreviewViewport", () => {
  it("maps the active state to a data attribute", () => {
    const markup = renderToStaticMarkup(
      <PreviewViewport active={true}>Preview</PreviewViewport>,
    );

    expect(markup).toContain('data-active="true"');
    expect(markup).toContain(SCREEN_PREVIEW_VIEWPORT_CLASS_NAME);
    expect(markup).not.toMatch(/\sactive="/);
  });

  it("merges screen primitive class names", () => {
    const editorContentMarkup = renderToStaticMarkup(
      <ScreenModeEditorContent className="custom-editor-content">
        Content
      </ScreenModeEditorContent>,
    );
    const previewWrapMarkup = renderToStaticMarkup(
      <PreviewCanvasWrap className="custom-preview-wrap">
        Wrap
      </PreviewCanvasWrap>,
    );

    expect(editorContentMarkup).toContain(SCREEN_EDITOR_CONTENT_CLASS_NAME);
    expect(editorContentMarkup).toContain("custom-editor-content");
    expect(previewWrapMarkup).toContain(SCREEN_PREVIEW_CANVAS_WRAP_CLASS_NAME);
    expect(previewWrapMarkup).toContain("custom-preview-wrap");
  });
});
