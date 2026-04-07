import * as O from "fp-ts/Option";
import { pipe } from "fp-ts/function";
import { type CharacterSet } from "../../domain/characters/characterSet";
import { useCharacterState } from "./characterStore";
import { type ProjectStoreState, useProjectState } from "./projectStore";

const HISTORY_LIMIT = 100;

interface CharacterUndoSnapshot {
  characterSets: CharacterSet[];
  selectedCharacterId: O.Option<string>;
}

interface UndoSnapshot {
  project: ProjectStoreState;
  character: CharacterUndoSnapshot;
}

interface UndoRuntimeState {
  undoSnapshots: ReadonlyArray<UndoSnapshot>;
  redoSnapshots: ReadonlyArray<UndoSnapshot>;
  isApplyingHistoryChange: boolean;
  isCoalescing: boolean;
  activePointerInteractionCount: number;
  hasRecordedPointerSnapshot: boolean;
}

const INITIAL_UNDO_RUNTIME_STATE: UndoRuntimeState = {
  undoSnapshots: [],
  redoSnapshots: [],
  isApplyingHistoryChange: false,
  isCoalescing: false,
  activePointerInteractionCount: 0,
  hasRecordedPointerSnapshot: false,
};

const undoRuntimeRef: { current: UndoRuntimeState } = {
  current: INITIAL_UNDO_RUNTIME_STATE,
};

const cloneProjectSnapshot = (
  projectSnapshot: ProjectStoreState,
): ProjectStoreState => structuredClone(projectSnapshot);

const cloneCharacterSnapshot = (
  characterSnapshot: CharacterUndoSnapshot,
): CharacterUndoSnapshot => ({
  characterSets: structuredClone(characterSnapshot.characterSets),
  selectedCharacterId: structuredClone(characterSnapshot.selectedCharacterId),
});

const cloneUndoSnapshot = (snapshot: UndoSnapshot): UndoSnapshot => ({
  project: cloneProjectSnapshot(snapshot.project),
  character: cloneCharacterSnapshot(snapshot.character),
});

const captureCurrentCharacterSnapshot = (): CharacterUndoSnapshot => {
  const state = useCharacterState.getState();

  return cloneCharacterSnapshot({
    characterSets: state.characterSets,
    selectedCharacterId: state.selectedCharacterId,
  });
};

const captureCurrentUndoSnapshot = (): UndoSnapshot => ({
  project: cloneProjectSnapshot(useProjectState.getState()),
  character: captureCurrentCharacterSnapshot(),
});

const scheduleCoalescingReset = (): void => {
  queueMicrotask(() => {
    undoRuntimeRef.current = {
      ...undoRuntimeRef.current,
      isCoalescing: false,
    };
  });
};

const appendSnapshot = (
  snapshots: ReadonlyArray<UndoSnapshot>,
  snapshot: UndoSnapshot,
): ReadonlyArray<UndoSnapshot> => {
  const nextSnapshots = [...snapshots, cloneUndoSnapshot(snapshot)];
  const trimmedSnapshots =
    nextSnapshots.length > HISTORY_LIMIT
      ? nextSnapshots.slice(nextSnapshots.length - HISTORY_LIMIT)
      : nextSnapshots;

  return trimmedSnapshots;
};

const pushUndoSnapshot = (
  runtime: UndoRuntimeState,
  snapshot: UndoSnapshot,
): void => {
  const trimmedUndoSnapshots = appendSnapshot(runtime.undoSnapshots, snapshot);

  undoRuntimeRef.current = {
    ...runtime,
    undoSnapshots: trimmedUndoSnapshots,
    redoSnapshots: [],
    isCoalescing: true,
  };

  scheduleCoalescingReset();
};

const pushPointerUndoSnapshot = (
  runtime: UndoRuntimeState,
  snapshot: UndoSnapshot,
): void => {
  const trimmedUndoSnapshots = appendSnapshot(runtime.undoSnapshots, snapshot);

  undoRuntimeRef.current = {
    ...runtime,
    undoSnapshots: trimmedUndoSnapshots,
    redoSnapshots: [],
    hasRecordedPointerSnapshot: true,
  };
};

const isPointerInteractionActive = (runtime: UndoRuntimeState): boolean =>
  runtime.activePointerInteractionCount > 0;

const beginPointerInteraction = (
  runtime: UndoRuntimeState,
): UndoRuntimeState => {
  const nextActivePointerInteractionCount =
    runtime.activePointerInteractionCount + 1;

  return {
    ...runtime,
    activePointerInteractionCount: nextActivePointerInteractionCount,
    hasRecordedPointerSnapshot:
      runtime.activePointerInteractionCount === 0
        ? false
        : runtime.hasRecordedPointerSnapshot,
  };
};

const endPointerInteraction = (runtime: UndoRuntimeState): UndoRuntimeState => {
  const nextActivePointerInteractionCount = Math.max(
    0,
    runtime.activePointerInteractionCount - 1,
  );

  return {
    ...runtime,
    activePointerInteractionCount: nextActivePointerInteractionCount,
    hasRecordedPointerSnapshot:
      nextActivePointerInteractionCount === 0
        ? false
        : runtime.hasRecordedPointerSnapshot,
  };
};

const clearPointerInteraction = (
  runtime: UndoRuntimeState,
): UndoRuntimeState => ({
  ...runtime,
  activePointerInteractionCount: 0,
  hasRecordedPointerSnapshot: false,
});

const recordUndoSnapshot = (snapshot: UndoSnapshot): void => {
  const runtime = undoRuntimeRef.current;

  if (runtime.isApplyingHistoryChange === true) {
    return;
  }

  if (isPointerInteractionActive(runtime) === true) {
    if (runtime.hasRecordedPointerSnapshot === true) {
      return;
    }

    pushPointerUndoSnapshot(runtime, snapshot);
    return;
  }

  if (runtime.isCoalescing === true) {
    return;
  }

  pushUndoSnapshot(runtime, snapshot);
};

const applyUndoSnapshot = (snapshot: UndoSnapshot): void => {
  const snapshotToApply = cloneUndoSnapshot(snapshot);

  useProjectState.setState(snapshotToApply.project, true);
  useCharacterState.setState({
    characterSets: snapshotToApply.character.characterSets,
    selectedCharacterId: snapshotToApply.character.selectedCharacterId,
  });
};

const handleProjectStoreChange = (
  nextProjectState: ProjectStoreState,
  previousProjectState: ProjectStoreState,
): void => {
  if (Object.is(nextProjectState, previousProjectState) === true) {
    return;
  }

  recordUndoSnapshot({
    project: cloneProjectSnapshot(previousProjectState),
    character: captureCurrentCharacterSnapshot(),
  });
};

const handleCharacterStoreChange = (
  nextCharacterState: ReturnType<typeof useCharacterState.getState>,
  previousCharacterState: ReturnType<typeof useCharacterState.getState>,
): void => {
  const hasCharacterSetsChanged =
    Object.is(
      nextCharacterState.characterSets,
      previousCharacterState.characterSets,
    ) === false;
  const hasSelectionChanged =
    Object.is(
      nextCharacterState.selectedCharacterId,
      previousCharacterState.selectedCharacterId,
    ) === false;

  if (hasCharacterSetsChanged === false && hasSelectionChanged === false) {
    return;
  }

  recordUndoSnapshot({
    project: cloneProjectSnapshot(useProjectState.getState()),
    character: cloneCharacterSnapshot({
      characterSets: previousCharacterState.characterSets,
      selectedCharacterId: previousCharacterState.selectedCharacterId,
    }),
  });
};

/**
 * グローバル Undo 用に project/character ストアの変更履歴を記録します。
 * 同期的に連続した更新は 1 ステップとして扱い、Cmd/Ctrl+Z で意図どおり戻せるようにします。
 */
export const initializeGlobalUndoTracking = (): (() => void) => {
  const unsubscribeProject = useProjectState.subscribe(
    handleProjectStoreChange,
  );
  const unsubscribeCharacter = useCharacterState.subscribe(
    handleCharacterStoreChange,
  );

  return () => {
    unsubscribeProject();
    unsubscribeCharacter();
  };
};

/**
 * ポインタ操作の開始を Undo 履歴へ通知します。
 * 押下中は最初の変更のみ履歴に積み、ドラッグ中の連続更新を 1 操作にまとめます。
 */
export const beginGlobalUndoPointerInteraction = (): void => {
  undoRuntimeRef.current = beginPointerInteraction(undoRuntimeRef.current);
};

/**
 * ポインタ操作の終了を Undo 履歴へ通知します。
 */
export const endGlobalUndoPointerInteraction = (): void => {
  undoRuntimeRef.current = endPointerInteraction(undoRuntimeRef.current);
};

/**
 * ポインタ操作状態を強制解除します。
 * 終了イベント取りこぼし時の復旧を想定しています。
 */
export const cancelGlobalUndoPointerInteraction = (): void => {
  undoRuntimeRef.current = clearPointerInteraction(undoRuntimeRef.current);
};

/**
 * 直前の編集スナップショットを復元します。
 * 履歴が空なら false を返して何もしません。
 */
export const undoLatestGlobalChange = (): boolean => {
  const runtime = undoRuntimeRef.current;
  const snapshotOption = O.fromNullable(
    runtime.undoSnapshots[runtime.undoSnapshots.length - 1],
  );

  return pipe(
    snapshotOption,
    O.match(
      () => false,
      (snapshot) => {
        const currentSnapshot = captureCurrentUndoSnapshot();
        const trimmedRedoSnapshots = appendSnapshot(
          runtime.redoSnapshots,
          currentSnapshot,
        );

        undoRuntimeRef.current = {
          ...runtime,
          undoSnapshots: runtime.undoSnapshots.slice(
            0,
            runtime.undoSnapshots.length - 1,
          ),
          redoSnapshots: trimmedRedoSnapshots,
          isApplyingHistoryChange: true,
        };

        applyUndoSnapshot(snapshot);

        undoRuntimeRef.current = {
          ...undoRuntimeRef.current,
          isApplyingHistoryChange: false,
        };

        return true;
      },
    ),
  );
};

/**
 * 直前に取り消した編集スナップショットを再適用します。
 * 再適用できる履歴が空なら false を返して何もしません。
 */
export const redoLatestGlobalChange = (): boolean => {
  const runtime = undoRuntimeRef.current;
  const snapshotOption = O.fromNullable(
    runtime.redoSnapshots[runtime.redoSnapshots.length - 1],
  );

  return pipe(
    snapshotOption,
    O.match(
      () => false,
      (snapshot) => {
        const currentSnapshot = captureCurrentUndoSnapshot();
        const trimmedUndoSnapshots = appendSnapshot(
          runtime.undoSnapshots,
          currentSnapshot,
        );

        undoRuntimeRef.current = {
          ...runtime,
          undoSnapshots: trimmedUndoSnapshots,
          redoSnapshots: runtime.redoSnapshots.slice(
            0,
            runtime.redoSnapshots.length - 1,
          ),
          isApplyingHistoryChange: true,
        };

        applyUndoSnapshot(snapshot);

        undoRuntimeRef.current = {
          ...undoRuntimeRef.current,
          isApplyingHistoryChange: false,
        };

        return true;
      },
    ),
  );
};

export const resetGlobalUndoHistoryForTest = (): void => {
  undoRuntimeRef.current = INITIAL_UNDO_RUNTIME_STATE;
};
