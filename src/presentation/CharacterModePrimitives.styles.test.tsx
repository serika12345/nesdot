import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  CharacterStageViewport,
  DecompositionCanvasElement,
  EmptyTilePreview,
  FloatingLibraryPreview,
  PixelPreviewCell,
  PositionedActionMenu,
  PositionedActionMenuButton,
  StageDragPreview,
  StageSurface,
} from "./components/characterMode/ui/primitives/CharacterModePrimitives";
import {
  CHARACTER_DECOMPOSITION_CANVAS_CLASS_NAME,
  CHARACTER_EMPTY_TILE_PREVIEW_CLASS_NAME,
  CHARACTER_FLOATING_LIBRARY_PREVIEW_CLASS_NAME,
  CHARACTER_PIXEL_PREVIEW_CELL_CLASS_NAME,
  CHARACTER_POSITIONED_ACTION_MENU_CLASS_NAME,
  CHARACTER_STAGE_DRAG_PREVIEW_CLASS_NAME,
  CHARACTER_STAGE_SURFACE_CLASS_NAME,
  CHARACTER_STAGE_VIEWPORT_CLASS_NAME,
} from "./styleClassNames";

describe("CharacterModePrimitives", () => {
  it("maps boolean state props to data attributes", () => {
    const viewportMarkup = renderToStaticMarkup(
      <CharacterStageViewport dragging={true}>Preview</CharacterStageViewport>,
    );
    const menuMarkup = renderToStaticMarkup(
      <PositionedActionMenu
        menuLeft={12}
        menuTop={24}
        menuWidth={200}
        ready={false}
      >
        Menu
      </PositionedActionMenu>,
    );
    const buttonMarkup = renderToStaticMarkup(
      <PositionedActionMenuButton danger={true} type="button">
        Delete
      </PositionedActionMenuButton>,
    );

    expect(viewportMarkup).toContain('data-dragging-state="true"');
    expect(viewportMarkup).toContain(CHARACTER_STAGE_VIEWPORT_CLASS_NAME);
    expect(viewportMarkup).not.toMatch(/\sdragging="/);
    expect(menuMarkup).toContain('data-ready="false"');
    expect(menuMarkup).toContain(CHARACTER_POSITIONED_ACTION_MENU_CLASS_NAME);
    expect(menuMarkup).not.toMatch(/\smenuLeft="/);
    expect(menuMarkup).not.toMatch(/\smenuTop="/);
    expect(menuMarkup).not.toMatch(/\smenuWidth="/);
    expect(menuMarkup).not.toMatch(/\sready="/);
    expect(buttonMarkup).toContain("MuiButton-root");
    expect(buttonMarkup).toContain("MuiButton-contained");
    expect(buttonMarkup).not.toContain("app-action-menu-button");
    expect(buttonMarkup).not.toContain(
      "character-positioned-action-menu-button",
    );
    expect(buttonMarkup).not.toMatch(/\sdanger="/);
  });

  it("moves geometry props into style attributes", () => {
    const stageMarkup = renderToStaticMarkup(
      <StageSurface
        activeDrop={true}
        stageWidthPx={64}
        stageHeightPx={32}
        stageScale={2}
      />,
    );
    const dragPreviewMarkup = renderToStaticMarkup(
      <StageDragPreview previewLeft={12} previewTop={34} />,
    );
    const floatingPreviewMarkup = renderToStaticMarkup(
      <FloatingLibraryPreview dragClientX={10} dragClientY={20} />,
    );
    const emptyPreviewMarkup = renderToStaticMarkup(
      <EmptyTilePreview previewWidth={8} previewHeight={16} />,
    );
    const pixelMarkup = renderToStaticMarkup(
      <PixelPreviewCell pixelSize={3} colorHex="#123456" />,
    );

    expect(stageMarkup).toContain('data-active-drop="true"');
    expect(stageMarkup).toContain(CHARACTER_STAGE_SURFACE_CLASS_NAME);
    expect(stageMarkup).not.toMatch(/\sactiveDrop="/);
    expect(stageMarkup).not.toMatch(/\sstageWidthPx="/);
    expect(stageMarkup).not.toMatch(/\sstageHeightPx="/);
    expect(stageMarkup).not.toMatch(/\sstageScale="/);
    expect(stageMarkup).toContain("width:64px");
    expect(stageMarkup).toContain("height:32px");
    expect(stageMarkup).toContain("--stage-cell-size:2px");
    expect(dragPreviewMarkup).toContain(
      CHARACTER_STAGE_DRAG_PREVIEW_CLASS_NAME,
    );
    expect(dragPreviewMarkup).not.toMatch(/\spreviewLeft="/);
    expect(dragPreviewMarkup).not.toMatch(/\spreviewTop="/);
    expect(dragPreviewMarkup).toContain("left:12px");
    expect(dragPreviewMarkup).toContain("top:34px");
    expect(floatingPreviewMarkup).toContain(
      CHARACTER_FLOATING_LIBRARY_PREVIEW_CLASS_NAME,
    );
    expect(floatingPreviewMarkup).not.toMatch(/\sdragClientX="/);
    expect(floatingPreviewMarkup).not.toMatch(/\sdragClientY="/);
    expect(floatingPreviewMarkup).toContain("left:28px");
    expect(floatingPreviewMarkup).toContain("top:38px");
    expect(emptyPreviewMarkup).toContain(
      CHARACTER_EMPTY_TILE_PREVIEW_CLASS_NAME,
    );
    expect(emptyPreviewMarkup).not.toMatch(/\spreviewWidth="/);
    expect(emptyPreviewMarkup).not.toMatch(/\spreviewHeight="/);
    expect(emptyPreviewMarkup).toContain("width:8px");
    expect(emptyPreviewMarkup).toContain("height:16px");
    expect(pixelMarkup).toContain(CHARACTER_PIXEL_PREVIEW_CELL_CLASS_NAME);
    expect(pixelMarkup).not.toMatch(/\spixelSize="/);
    expect(pixelMarkup).not.toMatch(/\scolorHex="/);
    expect(pixelMarkup).toContain("width:3px");
    expect(pixelMarkup).toContain("height:3px");
    expect(pixelMarkup).toContain("background-color:#123456");
  });

  it("moves cursor props into style attributes", () => {
    const markup = renderToStaticMarkup(
      <DecompositionCanvasElement
        cursorStyle="crosshair"
        width={8}
        height={8}
      />,
    );

    expect(markup).not.toMatch(/\scursorStyle="/);
    expect(markup).toContain(CHARACTER_DECOMPOSITION_CANVAS_CLASS_NAME);
    expect(markup).toContain("cursor:crosshair");
  });
});
