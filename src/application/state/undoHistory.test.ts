import * as O from "fp-ts/Option";
import { beforeEach, describe, expect, it } from "vitest";
import { createDefaultProjectState } from "../../domain/project/project";
import { useCharacterState } from "./characterStore";
import { useProjectState } from "./projectStore";
import {
  beginGlobalUndoPointerInteraction,
  cancelGlobalUndoPointerInteraction,
  endGlobalUndoPointerInteraction,
  initializeGlobalUndoTracking,
  redoLatestGlobalChange,
  resetGlobalUndoHistoryForTest,
  undoLatestGlobalChange,
} from "./undoHistory";

const flushMicrotasks = async (): Promise<void> => {
  await Promise.resolve();
};

const resetStores = (): void => {
  useProjectState.setState(
    {
      ...createDefaultProjectState(),
      _hydrated: false,
    },
    true,
  );

  useCharacterState.setState({
    characterSets: [],
    selectedCharacterId: O.none,
  });
};

describe("undoHistory", () => {
  beforeEach(() => {
    resetGlobalUndoHistoryForTest();
    cancelGlobalUndoPointerInteraction();
    resetStores();
  });

  it("restores previous project state on undo", async () => {
    const stopTracking = initializeGlobalUndoTracking();

    useProjectState.setState((state) => ({
      ...state,
      nes: {
        ...state.nes,
        universalBackgroundColor: 12,
      },
    }));

    await flushMicrotasks();

    expect(useProjectState.getState().nes.universalBackgroundColor).toBe(12);
    expect(undoLatestGlobalChange()).toBe(true);
    expect(useProjectState.getState().nes.universalBackgroundColor).toBe(0);

    stopTracking();
  });

  it("undoes synchronous project and character updates as one step", async () => {
    const stopTracking = initializeGlobalUndoTracking();

    useProjectState.setState((state) => ({
      ...state,
      nes: {
        ...state.nes,
        universalBackgroundColor: 9,
      },
    }));

    useCharacterState.setState({
      characterSets: [
        {
          id: "character-1",
          name: "Character 1",
          sprites: [],
        },
      ],
      selectedCharacterId: O.some("character-1"),
    });

    await flushMicrotasks();

    expect(useProjectState.getState().nes.universalBackgroundColor).toBe(9);
    expect(useCharacterState.getState().characterSets).toHaveLength(1);

    expect(undoLatestGlobalChange()).toBe(true);

    expect(useProjectState.getState().nes.universalBackgroundColor).toBe(0);
    expect(useCharacterState.getState().characterSets).toEqual([]);
    expect(O.isNone(useCharacterState.getState().selectedCharacterId)).toBe(
      true,
    );

    stopTracking();
  });

  it("returns false when there is no undo history", () => {
    expect(undoLatestGlobalChange()).toBe(false);
  });

  it("does not create extra history entries while applying undo", async () => {
    const stopTracking = initializeGlobalUndoTracking();

    useProjectState.setState((state) => ({
      ...state,
      nes: {
        ...state.nes,
        universalBackgroundColor: 3,
      },
    }));

    await flushMicrotasks();

    expect(undoLatestGlobalChange()).toBe(true);
    expect(undoLatestGlobalChange()).toBe(false);

    stopTracking();
  });

  it("records only one undo snapshot while pointer interaction is active", async () => {
    const stopTracking = initializeGlobalUndoTracking();

    beginGlobalUndoPointerInteraction();

    useProjectState.setState((state) => ({
      ...state,
      nes: {
        ...state.nes,
        universalBackgroundColor: 6,
      },
    }));

    await flushMicrotasks();

    useProjectState.setState((state) => ({
      ...state,
      nes: {
        ...state.nes,
        universalBackgroundColor: 14,
      },
    }));

    await flushMicrotasks();

    endGlobalUndoPointerInteraction();

    expect(useProjectState.getState().nes.universalBackgroundColor).toBe(14);
    expect(undoLatestGlobalChange()).toBe(true);
    expect(useProjectState.getState().nes.universalBackgroundColor).toBe(0);
    expect(undoLatestGlobalChange()).toBe(false);

    stopTracking();
  });

  it("starts a new undo snapshot after pointer interaction ends", async () => {
    const stopTracking = initializeGlobalUndoTracking();

    beginGlobalUndoPointerInteraction();

    useProjectState.setState((state) => ({
      ...state,
      nes: {
        ...state.nes,
        universalBackgroundColor: 7,
      },
    }));

    await flushMicrotasks();

    endGlobalUndoPointerInteraction();

    useProjectState.setState((state) => ({
      ...state,
      nes: {
        ...state.nes,
        universalBackgroundColor: 11,
      },
    }));

    await flushMicrotasks();

    expect(useProjectState.getState().nes.universalBackgroundColor).toBe(11);

    expect(undoLatestGlobalChange()).toBe(true);
    expect(useProjectState.getState().nes.universalBackgroundColor).toBe(7);

    expect(undoLatestGlobalChange()).toBe(true);
    expect(useProjectState.getState().nes.universalBackgroundColor).toBe(0);

    stopTracking();
  });

  it("restores the undone state with redo", async () => {
    const stopTracking = initializeGlobalUndoTracking();

    useProjectState.setState((state) => ({
      ...state,
      nes: {
        ...state.nes,
        universalBackgroundColor: 22,
      },
    }));

    await flushMicrotasks();

    expect(undoLatestGlobalChange()).toBe(true);
    expect(useProjectState.getState().nes.universalBackgroundColor).toBe(0);

    expect(redoLatestGlobalChange()).toBe(true);
    expect(useProjectState.getState().nes.universalBackgroundColor).toBe(22);

    stopTracking();
  });

  it("clears redo history after a new change", async () => {
    const stopTracking = initializeGlobalUndoTracking();

    useProjectState.setState((state) => ({
      ...state,
      nes: {
        ...state.nes,
        universalBackgroundColor: 18,
      },
    }));

    await flushMicrotasks();

    expect(undoLatestGlobalChange()).toBe(true);

    useProjectState.setState((state) => ({
      ...state,
      nes: {
        ...state.nes,
        universalBackgroundColor: 4,
      },
    }));

    await flushMicrotasks();

    expect(redoLatestGlobalChange()).toBe(false);
    expect(useProjectState.getState().nes.universalBackgroundColor).toBe(4);

    stopTracking();
  });
});
