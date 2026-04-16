import * as O from "fp-ts/Option";
import { describe, expect, it } from "vitest";
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
