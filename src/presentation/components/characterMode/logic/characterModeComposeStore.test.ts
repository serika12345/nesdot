import * as O from "fp-ts/Option";
import { afterEach, describe, expect, it } from "vitest";
import { useCharacterState } from "../../../../application/state/characterStore";
import { useCharacterModeComposeStore } from "./characterModeComposeStore";
import { useCharacterModeProjectStore } from "./characterModeProjectStore";
import { useCharacterModeStageStore } from "./characterModeStageStore";

const resetStores = () => {
  useCharacterModeComposeStore.setState(
    useCharacterModeComposeStore.getInitialState(),
  );
  useCharacterModeProjectStore.setState(
    useCharacterModeProjectStore.getInitialState(),
  );
  useCharacterModeStageStore.setState(
    useCharacterModeStageStore.getInitialState(),
  );
  useCharacterState.setState({
    characterSets: [],
    selectedCharacterId: O.none,
  });
};

afterEach(resetStores);

describe("characterModeComposeStore", () => {
  it("clearSelectionAndDrag resets compose interaction state", () => {
    useCharacterModeComposeStore.setState({
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

    useCharacterModeComposeStore.getState().clearSelectionAndDrag();

    expect(
      O.isNone(
        useCharacterModeComposeStore.getState().selectedSpriteEditorIndex,
      ),
    ).toBe(true);
    expect(
      O.isNone(useCharacterModeComposeStore.getState().libraryDragState),
    ).toBe(true);
    expect(
      O.isNone(useCharacterModeComposeStore.getState().spriteContextMenuState),
    ).toBe(true);
  });

  it("handleDropSpriteOnStage adds a sprite and selects it", () => {
    useCharacterState.getState().createSet({ name: "Set A" });

    useCharacterModeComposeStore.getState().handleDropSpriteOnStage(5, 10, 12);

    const characterSet = useCharacterState.getState().characterSets[0];

    expect(characterSet?.sprites).toHaveLength(1);
    expect(characterSet?.sprites[0]?.spriteIndex).toBe(5);
    expect(characterSet?.sprites[0]?.x).toBe(10);
    expect(characterSet?.sprites[0]?.y).toBe(12);
    expect(
      O.isSome(
        useCharacterModeComposeStore.getState().selectedSpriteEditorIndex,
      ),
    ).toBe(true);
  });

  it("handleShiftContextMenuSpriteLayer increments the sprite layer", () => {
    useCharacterState.getState().createSet({ name: "Set Layer" });

    useCharacterModeComposeStore.getState().handleDropSpriteOnStage(0, 5, 4);
    useCharacterModeComposeStore.getState().handleDropSpriteOnStage(0, 8, 8);

    expect(
      useCharacterState.getState().characterSets[0]?.sprites[0]?.layer,
    ).toBe(0);
    expect(
      useCharacterState.getState().characterSets[0]?.sprites[1]?.layer,
    ).toBe(1);

    useCharacterModeComposeStore
      .getState()
      .handleShiftContextMenuSpriteLayer(0, 1);

    expect(
      useCharacterState.getState().characterSets[0]?.sprites[0]?.layer,
    ).toBe(1);
  });
});
