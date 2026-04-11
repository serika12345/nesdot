import { describe, expect, it, vi } from "vitest";
import {
  getHexArrayForScreen,
  type ProjectStoreState,
  useProjectState,
} from "../../../../../application/state/projectStore";
import {
  createDefaultProjectState,
  type SpriteInScreen,
} from "../../../../../domain/project/project";
import { makeTile } from "../../../../../domain/tiles/utils";
import { createScreenModeProjectActions } from "./useScreenModeProjectActions";

const createProjectStateWithScreenSprite = (
  fill: 0 | 1 | 2 | 3,
  paletteIndex: 0 | 1 | 2 | 3,
): ProjectStoreState => {
  const baseState = createDefaultProjectState();
  const sprite = makeTile(8, paletteIndex, fill);
  const screenSprite: SpriteInScreen = {
    ...sprite,
    x: 0,
    y: 0,
    spriteIndex: 0,
    priority: "front",
    flipH: false,
    flipV: false,
  };

  return {
    ...baseState,
    sprites: baseState.sprites.map((tile, index) =>
      index === 0 ? sprite : tile,
    ),
    screen: {
      ...baseState.screen,
      sprites: [screenSprite],
    },
  };
};

describe("createScreenModeProjectActions", () => {
  it("reads the latest screen state when an action runs", () => {
    const initialProjectState = createProjectStateWithScreenSprite(1, 0);
    const nextProjectState = createProjectStateWithScreenSprite(3, 2);

    useProjectState.setState(initialProjectState);

    const exportPng = vi.fn();
    const exportSvgSimple = vi.fn();
    const exportJSON = vi.fn();

    const projectActions = createScreenModeProjectActions({
      exportJSON,
      exportPng,
      exportSvgSimple,
      getProjectState: useProjectState.getState,
    });

    useProjectState.setState(nextProjectState);

    const [shareExportPng, shareExportSvg, shareSaveProject] = projectActions;

    expect(shareExportPng?.id).toBe("share-export-png");
    expect(shareExportSvg?.id).toBe("share-export-svg");
    expect(shareSaveProject?.id).toBe("share-save-project");

    shareExportPng?.onSelect();
    shareExportSvg?.onSelect();
    shareSaveProject?.onSelect();

    expect(exportPng).toHaveBeenCalledWith(
      getHexArrayForScreen(nextProjectState.screen),
    );
    expect(exportSvgSimple).toHaveBeenCalledWith(
      getHexArrayForScreen(nextProjectState.screen),
    );
    expect(exportJSON).toHaveBeenCalledWith(useProjectState.getState());
  });
});
