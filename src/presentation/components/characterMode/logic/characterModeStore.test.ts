import * as O from "fp-ts/Option";
import { afterEach, describe, expect, it } from "vitest";
import { useCharacterState } from "../../../../application/state/characterStore";
import { useProjectState } from "../../../../application/state/projectStore";
import { createDefaultProjectState } from "../../../../domain/project/project";
import {
  selectActiveSet,
  selectActiveSetId,
  selectActiveSetName,
  selectActiveSetSpriteCount,
  selectDecompositionCanvasCursor,
  selectIsLibraryDraggable,
  selectIsStageDropActive,
  selectProjectSpriteSizeLocked,
  selectSelectedSpriteStageMetadata,
  selectStageScale,
} from "./characterModeSelectors";
import { useCharacterModeStore } from "./characterModeStore";

const resetStores = () => {
  useCharacterModeStore.setState(useCharacterModeStore.getInitialState());
  useCharacterState.setState({
    characterSets: [],
    selectedCharacterId: O.none,
  });
  useProjectState.setState({
    ...createDefaultProjectState(),
    _hydrated: false,
  });
};

afterEach(resetStores);

describe("characterModeStore", () => {
  describe("project actions", () => {
    it("handleCreateSet creates a set and clears compose/decomposition selections", () => {
      useCharacterModeStore.setState({
        selectedSpriteEditorIndex: O.some(2),
        selectedRegionId: O.some("region-1"),
      });

      useCharacterModeStore.getState().handleCreateSet();

      const modeState = useCharacterModeStore.getState();
      expect(O.isNone(modeState.selectedSpriteEditorIndex)).toBe(true);
      expect(O.isNone(modeState.selectedRegionId)).toBe(true);

      const charState = useCharacterState.getState();
      expect(charState.characterSets).toHaveLength(1);
    });

    it("handleSelectSet updates character store selection and clears compose state", () => {
      useCharacterState.getState().createSet({ name: "Set A" });
      const setId = useCharacterState.getState().characterSets[0]?.id ?? "";

      useCharacterModeStore.setState({
        selectedSpriteEditorIndex: O.some(0),
      });

      useCharacterModeStore.getState().handleSelectSet(setId);

      const charState = useCharacterState.getState();
      expect(O.isSome(charState.selectedCharacterId)).toBe(true);

      const modeState = useCharacterModeStore.getState();
      expect(O.isNone(modeState.selectedSpriteEditorIndex)).toBe(true);
    });

    it("handleSelectSet with empty string clears selection", () => {
      useCharacterState.getState().createSet({ name: "Set A" });

      useCharacterModeStore.getState().handleSelectSet("");

      const charState = useCharacterState.getState();
      expect(O.isNone(charState.selectedCharacterId)).toBe(true);
    });

    it("handleDeleteSet removes set and clears selections", () => {
      useCharacterState.getState().createSet({ name: "Set A" });
      const setId = useCharacterState.getState().characterSets[0]?.id ?? "";

      useCharacterModeStore.setState({
        selectedSpriteEditorIndex: O.some(0),
        selectedRegionId: O.some("r-1"),
      });

      useCharacterModeStore.getState().handleDeleteSet(setId);

      const charState = useCharacterState.getState();
      expect(charState.characterSets).toHaveLength(0);

      const modeState = useCharacterModeStore.getState();
      expect(O.isNone(modeState.selectedSpriteEditorIndex)).toBe(true);
      expect(O.isNone(modeState.selectedRegionId)).toBe(true);
    });

    it("handleEditorModeChange closes context menus", () => {
      useCharacterModeStore.setState({
        spriteContextMenuState: O.some({
          clientX: 10,
          clientY: 10,
          spriteEditorIndex: 0,
        }),
        decompositionRegionContextMenuState: O.some({
          clientX: 20,
          clientY: 20,
          regionId: "r-1",
        }),
      });

      useCharacterModeStore.getState().handleEditorModeChange("decompose");

      const state = useCharacterModeStore.getState();
      expect(state.editorMode).toBe("decompose");
      expect(O.isNone(state.spriteContextMenuState)).toBe(true);
      expect(O.isNone(state.decompositionRegionContextMenuState)).toBe(true);
    });
  });

  describe("stage actions", () => {
    it("handleStageWidthChange clamps value and resizes decomposition canvas", () => {
      useCharacterModeStore.getState().handleStageWidthChange("64");

      const state = useCharacterModeStore.getState();
      expect(state.stageWidth).toBe(64);
      expect(state.decompositionCanvas.width).toBe(64);
    });

    it("handleStageWidthChange ignores non-integer input", () => {
      useCharacterModeStore.getState().handleStageWidthChange("abc");

      const state = useCharacterModeStore.getState();
      expect(state.stageWidth).toBe(16);
    });

    it("handleZoomIn and handleZoomOut clamp zoom levels", () => {
      useCharacterModeStore.setState({ stageZoomLevel: 5 });

      useCharacterModeStore.getState().handleZoomIn();
      expect(useCharacterModeStore.getState().stageZoomLevel).toBe(6);

      useCharacterModeStore.getState().handleZoomIn();
      expect(useCharacterModeStore.getState().stageZoomLevel).toBe(6);

      useCharacterModeStore.setState({ stageZoomLevel: 2 });
      useCharacterModeStore.getState().handleZoomOut();
      expect(useCharacterModeStore.getState().stageZoomLevel).toBe(1);

      useCharacterModeStore.getState().handleZoomOut();
      expect(useCharacterModeStore.getState().stageZoomLevel).toBe(1);
    });
  });

  describe("compose actions", () => {
    it("clearSelectionAndDrag resets compose interaction state", () => {
      useCharacterModeStore.setState({
        selectedSpriteEditorIndex: O.some(3),
        libraryDragState: O.some({
          spriteIndex: 0,
          pointerId: 1,
          clientX: 0,
          clientY: 0,
          isOverStage: false,
          stageX: 0,
          stageY: 0,
        }),
        spriteContextMenuState: O.some({
          clientX: 10,
          clientY: 10,
          spriteEditorIndex: 0,
        }),
      });

      useCharacterModeStore.getState().clearSelectionAndDrag();

      const state = useCharacterModeStore.getState();
      expect(O.isNone(state.selectedSpriteEditorIndex)).toBe(true);
      expect(O.isNone(state.libraryDragState)).toBe(true);
      expect(O.isNone(state.spriteContextMenuState)).toBe(true);
    });

    it("handleDropSpriteOnStage adds sprite and selects it", () => {
      useCharacterState.getState().createSet({ name: "Set A" });

      useCharacterModeStore.getState().handleDropSpriteOnStage(5, 10, 12);

      const charState = useCharacterState.getState();
      const set = charState.characterSets[0];

      expect(set?.sprites).toHaveLength(1);
      expect(set?.sprites[0]?.spriteIndex).toBe(5);
      expect(set?.sprites[0]?.x).toBe(10);
      expect(set?.sprites[0]?.y).toBe(12);

      const modeState = useCharacterModeStore.getState();
      expect(O.isSome(modeState.selectedSpriteEditorIndex)).toBe(true);
    });

    it("handleShiftContextMenuSpriteLayer increments sprite layer", () => {
      useCharacterState.getState().createSet({ name: "Set Layer" });

      useCharacterModeStore.getState().handleDropSpriteOnStage(0, 5, 4);
      useCharacterModeStore.getState().handleDropSpriteOnStage(0, 8, 8);

      const charStateBefore = useCharacterState.getState();
      const setBefore = charStateBefore.characterSets[0];
      expect(setBefore?.sprites).toHaveLength(2);
      expect(setBefore?.sprites[0]?.layer).toBe(0);
      expect(setBefore?.sprites[1]?.layer).toBe(1);

      useCharacterModeStore.getState().handleShiftContextMenuSpriteLayer(0, 1);

      const charStateAfter = useCharacterState.getState();
      const setAfter = charStateAfter.characterSets[0];
      expect(setAfter?.sprites[0]?.layer).toBe(1);
    });
  });

  describe("decomposition actions", () => {
    it("handleDecompositionPaletteSelect accepts valid palette indices", () => {
      useCharacterModeStore.getState().handleDecompositionPaletteSelect(2);
      expect(useCharacterModeStore.getState().decompositionPaletteIndex).toBe(
        2,
      );

      useCharacterModeStore.getState().handleDecompositionPaletteSelect("3");
      expect(useCharacterModeStore.getState().decompositionPaletteIndex).toBe(
        3,
      );

      useCharacterModeStore.getState().handleDecompositionPaletteSelect(99);
      expect(useCharacterModeStore.getState().decompositionPaletteIndex).toBe(
        3,
      );
    });

    it("handleDecompositionColorSlotSelect sets color and switches to pen", () => {
      useCharacterModeStore.setState({ decompositionTool: "eraser" });

      useCharacterModeStore.getState().handleDecompositionColorSlotSelect(2);

      const state = useCharacterModeStore.getState();
      expect(state.decompositionColorIndex).toBe(2);
      expect(state.decompositionTool).toBe("pen");
    });

    it("handlePlaceDecompositionRegion adds a region and selects it", () => {
      useCharacterModeStore.getState().handlePlaceDecompositionRegion(4, 4);

      const state = useCharacterModeStore.getState();
      expect(state.decompositionRegions).toHaveLength(1);
      expect(O.isSome(state.selectedRegionId)).toBe(true);
    });

    it("handleDeleteContextMenuRegion removes region and updates selection", () => {
      useCharacterModeStore.getState().handlePlaceDecompositionRegion(0, 0);
      const regionId =
        useCharacterModeStore.getState().decompositionRegions[0]?.id ?? "";

      useCharacterModeStore.getState().handleDeleteContextMenuRegion(regionId);

      const state = useCharacterModeStore.getState();
      expect(state.decompositionRegions).toHaveLength(0);
      expect(O.isNone(state.selectedRegionId)).toBe(true);
    });

    it("handlePaintDecompositionPixel paints with pen settings", () => {
      useCharacterModeStore.setState({
        decompositionTool: "pen",
        decompositionPaletteIndex: 1,
        decompositionColorIndex: 2,
      });

      useCharacterModeStore.getState().handlePaintDecompositionPixel(0, 0);

      const pixel =
        useCharacterModeStore.getState().decompositionCanvas.pixels[0]?.[0];
      expect(pixel).toEqual({
        kind: "color",
        paletteIndex: 1,
        colorIndex: 2,
      });
    });

    it("handlePaintDecompositionPixel erases with eraser", () => {
      useCharacterModeStore.setState({ decompositionTool: "pen" });
      useCharacterModeStore.getState().handlePaintDecompositionPixel(0, 0);

      useCharacterModeStore.setState({ decompositionTool: "eraser" });
      useCharacterModeStore.getState().handlePaintDecompositionPixel(0, 0);

      const pixel =
        useCharacterModeStore.getState().decompositionCanvas.pixels[0]?.[0];
      expect(pixel).toEqual({ kind: "transparent" });
    });

    it("clearRegionsAndSelection resets both regions and selection", () => {
      useCharacterModeStore.getState().handlePlaceDecompositionRegion(0, 0);
      useCharacterModeStore.getState().clearRegionsAndSelection();

      const state = useCharacterModeStore.getState();
      expect(state.decompositionRegions).toHaveLength(0);
      expect(O.isNone(state.selectedRegionId)).toBe(true);
    });
  });

  describe("workspace actions", () => {
    it("handleWorkspacePointerDownCapture closes menus when target is not inside a context menu", () => {
      useCharacterModeStore.setState({
        spriteContextMenuState: O.some({
          clientX: 10,
          clientY: 10,
          spriteEditorIndex: 0,
        }),
        decompositionRegionContextMenuState: O.some({
          clientX: 20,
          clientY: 20,
          regionId: "r-1",
        }),
      });

      useCharacterModeStore.getState().handleWorkspacePointerDownCapture(false);

      const state = useCharacterModeStore.getState();
      expect(O.isNone(state.spriteContextMenuState)).toBe(true);
      expect(O.isNone(state.decompositionRegionContextMenuState)).toBe(true);
    });

    it("handleWorkspacePointerDownCapture keeps menus when inside a context menu", () => {
      const spriteMenu = O.some({
        clientX: 10,
        clientY: 10,
        spriteEditorIndex: 0,
      });
      useCharacterModeStore.setState({
        spriteContextMenuState: spriteMenu,
      });

      useCharacterModeStore.getState().handleWorkspacePointerDownCapture(true);

      const state = useCharacterModeStore.getState();
      expect(O.isSome(state.spriteContextMenuState)).toBe(true);
    });
  });
});

describe("characterModeSelectors", () => {
  it("selectActiveSet finds the matching set", () => {
    const sets = [
      { id: "a", name: "A", sprites: [] },
      { id: "b", name: "B", sprites: [] },
    ];

    expect(O.isSome(selectActiveSet(sets, O.some("b")))).toBe(true);
    expect(O.isNone(selectActiveSet(sets, O.some("z")))).toBe(true);
    expect(O.isNone(selectActiveSet(sets, O.none))).toBe(true);
  });

  it("selectActiveSetId returns empty string for none", () => {
    expect(selectActiveSetId(O.none)).toBe("");
    expect(selectActiveSetId(O.some({ id: "x", name: "X", sprites: [] }))).toBe(
      "x",
    );
  });

  it("selectActiveSetName returns empty string for none", () => {
    expect(selectActiveSetName(O.none)).toBe("");
    expect(
      selectActiveSetName(O.some({ id: "x", name: "Hero", sprites: [] })),
    ).toBe("Hero");
  });

  it("selectActiveSetSpriteCount returns 0 for none", () => {
    expect(selectActiveSetSpriteCount(O.none)).toBe(0);
  });

  it("selectStageScale returns a positive number", () => {
    const scale = selectStageScale(16, 16, 2);
    expect(scale).toBeGreaterThan(0);
  });

  it("selectProjectSpriteSizeLocked detects when sprites exist", () => {
    expect(selectProjectSpriteSizeLocked([], 0, [])).toBe(false);
    expect(
      selectProjectSpriteSizeLocked([], 0, [
        {
          id: "a",
          name: "A",
          sprites: [{ spriteIndex: 0, x: 0, y: 0, layer: 0 }],
        },
      ]),
    ).toBe(true);
  });

  it("selectIsStageDropActive detects active drop", () => {
    expect(selectIsStageDropActive(O.none)).toBe(false);
    expect(
      selectIsStageDropActive(
        O.some({
          spriteIndex: 0,
          pointerId: 1,
          clientX: 0,
          clientY: 0,
          isOverStage: true,
          stageX: 0,
          stageY: 0,
        }),
      ),
    ).toBe(true);
    expect(
      selectIsStageDropActive(
        O.some({
          spriteIndex: 0,
          pointerId: 1,
          clientX: 0,
          clientY: 0,
          isOverStage: false,
          stageX: 0,
          stageY: 0,
        }),
      ),
    ).toBe(false);
  });

  it("selectIsLibraryDraggable requires compose mode and active set", () => {
    expect(
      selectIsLibraryDraggable(
        "compose",
        O.some({ id: "a", name: "A", sprites: [] }),
      ),
    ).toBe(true);
    expect(
      selectIsLibraryDraggable(
        "decompose",
        O.some({ id: "a", name: "A", sprites: [] }),
      ),
    ).toBe(false);
    expect(selectIsLibraryDraggable("compose", O.none)).toBe(false);
  });

  it("selectSelectedSpriteStageMetadata returns empty strings when no selection", () => {
    const meta = selectSelectedSpriteStageMetadata(O.none, O.none);
    expect(meta).toEqual({ index: "", layer: "", x: "", y: "" });
  });

  it("selectDecompositionCanvasCursor maps tool to cursor", () => {
    expect(selectDecompositionCanvasCursor("pen")).toBe("crosshair");
    expect(selectDecompositionCanvasCursor("eraser")).toBe("cell");
    expect(selectDecompositionCanvasCursor("region")).toBe("copy");
  });
});
