import { describe, expect, it, vi } from "vitest";
import {
  getHexArrayForSpriteTile,
  type PaletteIndex,
  type ProjectStoreState,
  useProjectState,
} from "../../../../../application/state/projectStore";
import { createDefaultProjectState } from "../../../../../domain/project/project";
import { makeTile } from "../../../../../domain/tiles/utils";
import { createSpriteModeProjectActions } from "./useSpriteModeState";

const createProjectStateWithSprite = (
  spriteIndex: number,
  fill: 0 | 1 | 2 | 3,
  paletteIndex: PaletteIndex,
  spriteSize: 8 | 16,
): ProjectStoreState => {
  const baseState = createDefaultProjectState(spriteSize);
  const sprite = makeTile(spriteSize, paletteIndex, fill);

  return {
    ...baseState,
    sprites: baseState.sprites.map((tile, index) =>
      index === spriteIndex ? sprite : tile,
    ),
  };
};

describe("createSpriteModeProjectActions", () => {
  it("reads the latest selected sprite state when an action runs", () => {
    const initialProjectState = createProjectStateWithSprite(0, 1, 0, 8);
    const nextProjectState = createProjectStateWithSprite(2, 3, 2, 16);
    const expectedSprite = makeTile(16, 2, 3);

    useProjectState.setState(initialProjectState);

    const exportChr = vi.fn();
    const exportPng = vi.fn();
    const exportSvgSimple = vi.fn();
    const exportJSON = vi.fn();

    const projectActions = createSpriteModeProjectActions({
      exportChr,
      exportJSON,
      exportPng,
      exportSvgSimple,
      getActivePalette: () =>
        useProjectState.getState().spriteSize === 8 ? 0 : 2,
      getActiveSprite: () =>
        useProjectState.getState().spriteSize === 8 ? 0 : 2,
      getProjectState: useProjectState.getState,
    });

    useProjectState.setState(nextProjectState);

    const [shareExportChr, shareExportPng, shareExportSvg, shareSaveProject] =
      projectActions;

    expect(shareExportChr?.id).toBe("share-export-chr");
    expect(shareExportPng?.id).toBe("share-export-png");
    expect(shareExportSvg?.id).toBe("share-export-svg");
    expect(shareSaveProject?.id).toBe("share-save-project");

    shareExportChr?.onSelect();
    shareExportPng?.onSelect();
    shareExportSvg?.onSelect();
    shareSaveProject?.onSelect();

    expect(exportChr).toHaveBeenCalledWith(expectedSprite, 2);
    expect(exportPng).toHaveBeenCalledWith(
      getHexArrayForSpriteTile(expectedSprite),
    );
    expect(exportSvgSimple).toHaveBeenCalledWith(
      getHexArrayForSpriteTile(expectedSprite),
    );
    expect(exportJSON).toHaveBeenCalledWith(useProjectState.getState());
  });
});
