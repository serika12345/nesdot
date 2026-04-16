import * as O from "fp-ts/Option";
import { afterEach, describe, expect, it } from "vitest";
import { useCharacterState } from "../../../../application/state/characterStore";
import { useProjectState } from "../../../../application/state/projectStore";
import { createDefaultProjectState } from "../../../../domain/project/project";
import { useCharacterModeComposeStore } from "./characterModeComposeStore";
import { useCharacterModeDecompositionStore } from "./characterModeDecompositionStore";
import { useCharacterModeProjectStore } from "./characterModeProjectStore";

const resetStores = () => {
  useCharacterModeProjectStore.setState(
    useCharacterModeProjectStore.getInitialState(),
  );
  useCharacterModeComposeStore.setState(
    useCharacterModeComposeStore.getInitialState(),
  );
  useCharacterModeDecompositionStore.setState(
    useCharacterModeDecompositionStore.getInitialState(),
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

describe("characterModeProjectStore", () => {
  it("handleCreateSet creates a set and clears transient selections", () => {
    useCharacterModeComposeStore.setState({
      selectedSpriteEditorIndex: O.some(2),
    });
    useCharacterModeDecompositionStore.setState({
      selectedRegionId: O.some("region-1"),
    });

    useCharacterModeProjectStore.getState().handleCreateSet();

    expect(
      O.isNone(
        useCharacterModeComposeStore.getState().selectedSpriteEditorIndex,
      ),
    ).toBe(true);
    expect(
      O.isNone(useCharacterModeDecompositionStore.getState().selectedRegionId),
    ).toBe(true);
    expect(useCharacterState.getState().characterSets).toHaveLength(1);
  });

  it("handleSelectSet updates selection and clears compose state", () => {
    useCharacterState.getState().createSet({ name: "Set A" });
    const setId = useCharacterState.getState().characterSets[0]?.id ?? "";

    useCharacterModeComposeStore.setState({
      selectedSpriteEditorIndex: O.some(0),
    });

    useCharacterModeProjectStore.getState().handleSelectSet(setId);

    expect(O.isSome(useCharacterState.getState().selectedCharacterId)).toBe(
      true,
    );
    expect(
      O.isNone(
        useCharacterModeComposeStore.getState().selectedSpriteEditorIndex,
      ),
    ).toBe(true);
  });

  it("handleDeleteSet removes the set and clears selections", () => {
    useCharacterState.getState().createSet({ name: "Set A" });
    const setId = useCharacterState.getState().characterSets[0]?.id ?? "";

    useCharacterModeComposeStore.setState({
      selectedSpriteEditorIndex: O.some(0),
    });
    useCharacterModeDecompositionStore.setState({
      selectedRegionId: O.some("r-1"),
    });

    useCharacterModeProjectStore.getState().handleDeleteSet(setId);

    expect(useCharacterState.getState().characterSets).toHaveLength(0);
    expect(
      O.isNone(
        useCharacterModeComposeStore.getState().selectedSpriteEditorIndex,
      ),
    ).toBe(true);
    expect(
      O.isNone(useCharacterModeDecompositionStore.getState().selectedRegionId),
    ).toBe(true);
  });

  it("handleEditorModeChange closes both context menus", () => {
    useCharacterModeComposeStore.setState({
      spriteContextMenuState: O.some({
        clientX: 10,
        clientY: 10,
        spriteEditorIndex: 0,
      }),
    });
    useCharacterModeDecompositionStore.setState({
      decompositionRegionContextMenuState: O.some({
        clientX: 20,
        clientY: 20,
        regionId: "r-1",
      }),
    });

    useCharacterModeProjectStore.getState().handleEditorModeChange("decompose");

    expect(useCharacterModeProjectStore.getState().editorMode).toBe(
      "decompose",
    );
    expect(
      O.isNone(useCharacterModeComposeStore.getState().spriteContextMenuState),
    ).toBe(true);
    expect(
      O.isNone(
        useCharacterModeDecompositionStore.getState()
          .decompositionRegionContextMenuState,
      ),
    ).toBe(true);
  });
});
