import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  Badge,
  CollapseToggle,
  IconActionButton,
  ToolButton,
} from "./App.styles";
import { PreviewViewport } from "./components/screenMode/primitives/ScreenModePrimitives";

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
    expect(collapseMarkup).not.toMatch(/\sopen="/);
    expect(iconMarkup).toContain('data-active="false"');
    expect(iconMarkup).not.toMatch(/\sactive="/);
  });

  it("maps badge tone to a data attribute", () => {
    const markup = renderToStaticMarkup(<Badge tone="danger">Warning</Badge>);

    expect(markup).toContain("<span");
    expect(markup).toContain('data-tone="danger"');
    expect(markup).not.toMatch(/\stone="/);
  });
});

describe("PreviewViewport", () => {
  it("maps the active state to a data attribute", () => {
    const markup = renderToStaticMarkup(
      <PreviewViewport active={true}>Preview</PreviewViewport>,
    );

    expect(markup).toContain('data-active="true"');
    expect(markup).not.toMatch(/\sactive="/);
  });
});
