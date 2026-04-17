import * as O from "fp-ts/Option";
import { afterEach, describe, expect, it } from "vitest";
import { useCharacterState } from "../../../../application/state/characterStore";
import { useProjectState } from "../../../../application/state/projectStore";
import { createDefaultProjectState } from "../../../../domain/project/project";
import { useCharacterModeDecompositionStore } from "./characterModeDecompositionStore";
import { useCharacterModeStageStore } from "./characterModeStageStore";

const resetStores = () => {
  useCharacterModeDecompositionStore.setState(
    useCharacterModeDecompositionStore.getInitialState(),
  );
  useCharacterModeStageStore.setState(
    useCharacterModeStageStore.getInitialState(),
  );
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

describe("characterModeDecompositionStore", () => {
  it("handleDecompositionPaletteSelect accepts valid palette indices", () => {
    useCharacterModeDecompositionStore
      .getState()
      .handleDecompositionPaletteSelect(2);
    expect(
      useCharacterModeDecompositionStore.getState().decompositionPaletteIndex,
    ).toBe(2);

    useCharacterModeDecompositionStore
      .getState()
      .handleDecompositionPaletteSelect("3");
    expect(
      useCharacterModeDecompositionStore.getState().decompositionPaletteIndex,
    ).toBe(3);

    useCharacterModeDecompositionStore
      .getState()
      .handleDecompositionPaletteSelect(99);
    expect(
      useCharacterModeDecompositionStore.getState().decompositionPaletteIndex,
    ).toBe(3);
  });

  it("handleDecompositionColorSlotSelect sets color and switches to pen", () => {
    useCharacterModeDecompositionStore.setState({
      decompositionTool: "eraser",
    });

    useCharacterModeDecompositionStore
      .getState()
      .handleDecompositionColorSlotSelect(2);

    expect(
      useCharacterModeDecompositionStore.getState().decompositionColorIndex,
    ).toBe(2);
    expect(
      useCharacterModeDecompositionStore.getState().decompositionTool,
    ).toBe("pen");
  });

  it("handlePlaceDecompositionRegion adds a region and selects it", () => {
    useCharacterModeDecompositionStore
      .getState()
      .handlePlaceDecompositionRegion(4, 4);

    expect(
      useCharacterModeDecompositionStore.getState().decompositionRegions,
    ).toHaveLength(1);
    expect(
      O.isSome(useCharacterModeDecompositionStore.getState().selectedRegionId),
    ).toBe(true);
  });

  it("handleDeleteContextMenuRegion removes the region and updates selection", () => {
    useCharacterModeDecompositionStore
      .getState()
      .handlePlaceDecompositionRegion(0, 0);
    const regionId =
      useCharacterModeDecompositionStore.getState().decompositionRegions[0]
        ?.id ?? "";

    useCharacterModeDecompositionStore
      .getState()
      .handleDeleteContextMenuRegion(regionId);

    expect(
      useCharacterModeDecompositionStore.getState().decompositionRegions,
    ).toHaveLength(0);
    expect(
      O.isNone(useCharacterModeDecompositionStore.getState().selectedRegionId),
    ).toBe(true);
  });

  it("handlePaintDecompositionPixel paints with pen settings", () => {
    useCharacterModeDecompositionStore.setState({
      decompositionTool: "pen",
      decompositionPaletteIndex: 1,
      decompositionColorIndex: 2,
    });

    useCharacterModeDecompositionStore
      .getState()
      .handlePaintDecompositionPixel(0, 0);

    expect(
      useCharacterModeDecompositionStore.getState().decompositionCanvas
        .pixels[0]?.[0],
    ).toEqual({
      kind: "color",
      paletteIndex: 1,
      colorIndex: 2,
    });
  });

  it("handlePaintDecompositionPixel erases with eraser", () => {
    useCharacterModeDecompositionStore.setState({ decompositionTool: "pen" });
    useCharacterModeDecompositionStore
      .getState()
      .handlePaintDecompositionPixel(0, 0);

    useCharacterModeDecompositionStore.setState({
      decompositionTool: "eraser",
    });
    useCharacterModeDecompositionStore
      .getState()
      .handlePaintDecompositionPixel(0, 0);

    expect(
      useCharacterModeDecompositionStore.getState().decompositionCanvas
        .pixels[0]?.[0],
    ).toEqual({ kind: "transparent" });
  });

  it("clearRegionsAndSelection resets both regions and selection", () => {
    useCharacterModeDecompositionStore
      .getState()
      .handlePlaceDecompositionRegion(0, 0);
    useCharacterModeDecompositionStore.getState().clearRegionsAndSelection();

    expect(
      useCharacterModeDecompositionStore.getState().decompositionRegions,
    ).toHaveLength(0);
    expect(
      O.isNone(useCharacterModeDecompositionStore.getState().selectedRegionId),
    ).toBe(true);
  });
});
