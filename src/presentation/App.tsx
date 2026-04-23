import { Heading } from "@radix-ui/themes";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React, { useCallback, useEffect, useMemo } from "react";
import {
  beginGlobalUndoPointerInteraction,
  cancelGlobalUndoPointerInteraction,
  endGlobalUndoPointerInteraction,
  initializeGlobalUndoTracking,
  redoLatestGlobalChange,
  undoLatestGlobalChange,
} from "../application/state/undoHistory";
import {
  useWorkbenchState,
  type WorkMode,
} from "../application/state/workbenchStore";
import { type ThemePreference } from "../infrastructure/browser/themePreference";
import { useDesktopAutoUpdate } from "../infrastructure/browser/useDesktopAutoUpdate";
import { usePwaUpdate } from "../infrastructure/browser/usePwaUpdate";
import styles from "./App.module.css";
import { useBgModeFileMenuState } from "./components/bgMode/logic/useBgModeFileMenuState";
import { BgMode } from "./components/bgMode/ui/core/BgMode";
import { useCharacterModeProjectActions } from "./components/characterMode/logic/characterModeProjectActions";
import { CharacterMode } from "./components/characterMode/ui/core/CharacterMode";
import { usePalettePickerState } from "./components/common/logic/palettePickerState";
import {
  emptyFileMenuState,
  type FileMenuState,
  type FileShareAction,
  type FileShareActionId,
} from "./components/common/logic/state/fileMenuState";
import { SurfaceCard } from "./components/common/ui/chrome/SurfaceCard";
import { DesktopAutoUpdateDialog } from "./components/common/ui/dialogs/DesktopAutoUpdateDialog";
import { PwaUpdateDialog } from "./components/common/ui/dialogs/PwaUpdateDialog";
import { MenuBar } from "./components/common/ui/menu/MenuBar";
import { PalettePicker } from "./components/common/ui/pickers/PalettePicker";
import { useScreenModeFileMenuState } from "./components/screenMode/logic/useScreenModeFileMenuState";
import { ScreenMode } from "./components/screenMode/ui/core/ScreenMode";
import { useSpriteModeProjectActions } from "./components/spriteMode/logic/spriteModeProjectActions";
import { SpriteMode } from "./components/spriteMode/ui/core/SpriteMode";

const NATIVE_SHARE_EVENT_BINDINGS: ReadonlyArray<{
  eventName: string;
  actionId: FileShareActionId;
}> = [
  {
    eventName: "file-menu://share-export-chr",
    actionId: "share-export-chr",
  },
  {
    eventName: "file-menu://share-export-png",
    actionId: "share-export-png",
  },
  {
    eventName: "file-menu://share-export-svg",
    actionId: "share-export-svg",
  },
  {
    eventName: "file-menu://share-save-project",
    actionId: "share-save-project",
  },
  {
    eventName: "file-menu://share-export-character-json",
    actionId: "share-export-character-json",
  },
];

const NATIVE_MODE_EVENT_BINDINGS: ReadonlyArray<{
  eventName: string;
  mode: WorkMode;
}> = [
  {
    eventName: "mode-menu://switch-sprite",
    mode: "sprite",
  },
  {
    eventName: "mode-menu://switch-character",
    mode: "character",
  },
  {
    eventName: "mode-menu://switch-bg",
    mode: "bg",
  },
  {
    eventName: "mode-menu://switch-screen",
    mode: "screen",
  },
];

const NATIVE_THEME_EVENT_BINDINGS: ReadonlyArray<{
  eventName: string;
  themePreference: ThemePreference;
}> = [
  {
    eventName: "view-menu://set-theme-light",
    themePreference: "light",
  },
  {
    eventName: "view-menu://set-theme-dark",
    themePreference: "dark",
  },
  {
    eventName: "view-menu://set-theme-system",
    themePreference: "system",
  },
];

const NATIVE_RESTORE_EVENT_NAME = "file-menu://restore-import";
const NATIVE_UNDO_EVENT_NAME = "edit-menu://undo";
const NATIVE_REDO_EVENT_NAME = "edit-menu://redo";
const NATIVE_UPDATE_CHECK_EVENT_NAME = "help-menu://check-for-updates";

interface NativeMenuSelectionState {
  readonly editMode: WorkMode;
  readonly themePreference: ThemePreference;
}

const isEditableTarget = (target: EventTarget): boolean => {
  if (target instanceof HTMLInputElement) {
    return true;
  }

  if (target instanceof HTMLTextAreaElement) {
    return true;
  }

  if (target instanceof HTMLSelectElement) {
    return true;
  }

  if (target instanceof HTMLElement) {
    return target.isContentEditable;
  }

  return false;
};

const shouldHandleGlobalUndoShortcut = (event: KeyboardEvent): boolean => {
  const pressedUndoKey = event.key.toLowerCase() === "z";
  const hasUndoModifier = event.metaKey === true || event.ctrlKey === true;
  const hasOnlyUndoModifiers =
    event.altKey === false && event.shiftKey === false;
  const isEditable = pipe(
    O.fromNullable(event.target),
    O.match(
      () => false,
      (target) => isEditableTarget(target),
    ),
  );

  if (pressedUndoKey === false) {
    return false;
  }

  if (hasUndoModifier === false) {
    return false;
  }

  if (hasOnlyUndoModifiers === false) {
    return false;
  }

  if (isEditable === true) {
    return false;
  }

  if (event.isComposing === true) {
    return false;
  }

  return true;
};

const shouldHandleGlobalRedoShortcut = (event: KeyboardEvent): boolean => {
  const lowerKey = event.key.toLowerCase();
  const hasUndoModifier = event.metaKey === true || event.ctrlKey === true;
  const isRedoByShiftZ = lowerKey === "z" && event.shiftKey === true;
  const isRedoByCtrlY = lowerKey === "y" && event.shiftKey === false;
  const isEditable = pipe(
    O.fromNullable(event.target),
    O.match(
      () => false,
      (target) => isEditableTarget(target),
    ),
  );

  if (hasUndoModifier === false) {
    return false;
  }

  if (event.altKey === true) {
    return false;
  }

  if (isRedoByShiftZ === false && isRedoByCtrlY === false) {
    return false;
  }

  if (isEditable === true) {
    return false;
  }

  if (event.isComposing === true) {
    return false;
  }

  return true;
};

const hasTauriRuntime = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  return Reflect.has(window, "__TAURI_INTERNALS__");
};

const isMacNativeMenuRuntime = (): boolean => {
  if (hasTauriRuntime() !== true) {
    return false;
  }

  if (typeof navigator === "undefined") {
    return false;
  }

  return navigator.userAgent.includes("Mac");
};

const runShareActionById = (
  shareActions: ReadonlyArray<FileShareAction>,
  actionId: FileShareActionId,
): void => {
  pipe(
    O.fromNullable(shareActions.find((action) => action.id === actionId)),
    O.match(
      () => {
        return;
      },
      (action) => {
        action.onSelect();
      },
    ),
  );
};

const runRestoreAction = (fileMenuState: FileMenuState): void => {
  pipe(
    fileMenuState.restoreAction,
    O.match(
      () => {
        return;
      },
      (restoreAction) => {
        void restoreAction.onSelect();
      },
    ),
  );
};

interface NativeMenuBindingsProps {
  editMode: WorkMode;
  enabled: boolean;
  fileMenuState: FileMenuState;
  onEditModeSelect: (nextEditMode: WorkMode) => void;
  onRedoSelect: () => void;
  onThemePreferenceSelect: (themePreference: ThemePreference) => void;
  onUndoSelect: () => void;
  themePreference: ThemePreference;
  onUpdateCheck: () => void;
}

const syncNativeMenuSelectionState = async (
  selectionState: NativeMenuSelectionState,
): Promise<void> => {
  try {
    const coreModule = await import("@tauri-apps/api/core");
    await coreModule.invoke("sync_native_menu_selection_state", {
      state: selectionState,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.info(`[menu] native menu sync skipped: ${message}`);
  }
};

const NativeMenuBindings: React.FC<NativeMenuBindingsProps> = ({
  editMode,
  enabled,
  fileMenuState,
  onEditModeSelect,
  onRedoSelect,
  onThemePreferenceSelect,
  onUndoSelect,
  themePreference,
  onUpdateCheck,
}) => {
  const runtimeRef = React.useRef({
    editMode,
    fileMenuState,
    onEditModeSelect,
    onRedoSelect,
    onThemePreferenceSelect,
    onUndoSelect,
    themePreference,
    onUpdateCheck,
  });

  runtimeRef.current = {
    editMode,
    fileMenuState,
    onEditModeSelect,
    onRedoSelect,
    onThemePreferenceSelect,
    onUndoSelect,
    themePreference,
    onUpdateCheck,
  };

  useEffect(() => {
    if (enabled !== true) {
      return;
    }

    const registerNativeMenuListeners = async (): Promise<
      ReadonlyArray<() => void>
    > => {
      try {
        const eventModule = await import("@tauri-apps/api/event");
        const shareUnlistenCallbacks = await Promise.all(
          NATIVE_SHARE_EVENT_BINDINGS.map(({ eventName, actionId }) =>
            eventModule.listen(eventName, () => {
              runShareActionById(
                runtimeRef.current.fileMenuState.shareActions,
                actionId,
              );
            }),
          ),
        );
        const modeUnlistenCallbacks = await Promise.all(
          NATIVE_MODE_EVENT_BINDINGS.map(({ eventName, mode }) =>
            eventModule.listen(eventName, () => {
              runtimeRef.current.onEditModeSelect(mode);
              void syncNativeMenuSelectionState({
                editMode: mode,
                themePreference: runtimeRef.current.themePreference,
              });
            }),
          ),
        );
        const themeUnlistenCallbacks = await Promise.all(
          NATIVE_THEME_EVENT_BINDINGS.map(({ eventName, themePreference }) =>
            eventModule.listen(eventName, () => {
              runtimeRef.current.onThemePreferenceSelect(themePreference);
              void syncNativeMenuSelectionState({
                editMode: runtimeRef.current.editMode,
                themePreference,
              });
            }),
          ),
        );

        const restoreUnlistenCallback = await eventModule.listen(
          NATIVE_RESTORE_EVENT_NAME,
          () => {
            runRestoreAction(runtimeRef.current.fileMenuState);
          },
        );

        const undoUnlistenCallback = await eventModule.listen(
          NATIVE_UNDO_EVENT_NAME,
          () => {
            runtimeRef.current.onUndoSelect();
          },
        );

        const redoUnlistenCallback = await eventModule.listen(
          NATIVE_REDO_EVENT_NAME,
          () => {
            runtimeRef.current.onRedoSelect();
          },
        );

        const updateCheckUnlistenCallback = await eventModule.listen(
          NATIVE_UPDATE_CHECK_EVENT_NAME,
          () => {
            runtimeRef.current.onUpdateCheck();
          },
        );

        return [
          ...shareUnlistenCallbacks,
          ...modeUnlistenCallbacks,
          ...themeUnlistenCallbacks,
          restoreUnlistenCallback,
          undoUnlistenCallback,
          redoUnlistenCallback,
          updateCheckUnlistenCallback,
        ];
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.info(`[menu] native menu listener skipped: ${message}`);
        return [];
      }
    };

    const unlistenCallbacksPromise = registerNativeMenuListeners();

    return () => {
      void unlistenCallbacksPromise.then((unlistenCallbacks) => {
        unlistenCallbacks.forEach((unlisten) => {
          unlisten();
        });
      });
    };
  }, [enabled]);

  useEffect(() => {
    if (enabled !== true) {
      return;
    }

    void syncNativeMenuSelectionState({
      editMode,
      themePreference,
    });
  }, [editMode, enabled, themePreference]);

  return <></>;
};

/**
 * アプリ全体の編集モード切り替えと共通レイアウトを描画します。
 * 各モード画面と共有パレットを束ね、最上位の画面構成責務だけを持つコンポーネントです。
 */
interface AppBodyProps {
  readonly onThemePreferenceSelect: (themePreference: ThemePreference) => void;
  readonly themePreference: ThemePreference;
}

const AppBody: React.FC<AppBodyProps> = ({
  onThemePreferenceSelect,
  themePreference,
}) => {
  const desktopAutoUpdate = useDesktopAutoUpdate();
  const pwaUpdate = usePwaUpdate();
  const handleDesktopAutoUpdateCheck = desktopAutoUpdate.onCheckNow;
  const editMode = useWorkbenchState((state) => state.editMode);
  const handleEditModeSelect = useWorkbenchState((state) => state.setEditMode);
  const isNativeMacMenu = useMemo(() => isMacNativeMenuRuntime(), []);
  const spriteProjectActions: Readonly<{
    handleImport: () => Promise<void>;
    projectActions: ReadonlyArray<FileShareAction>;
  }> = useSpriteModeProjectActions();
  const { projectActions: characterProjectActions } =
    useCharacterModeProjectActions();
  const bgFileMenuState = useBgModeFileMenuState();
  const palettePickerState = usePalettePickerState();
  const screenFileMenuState = useScreenModeFileMenuState();

  const spriteFileMenuState = useMemo<FileMenuState>(
    () => ({
      ...emptyFileMenuState,
      shareActions: spriteProjectActions.projectActions,
      restoreAction: O.some({
        label: "復元",
        onSelect: spriteProjectActions.handleImport,
      }),
    }),
    [spriteProjectActions.handleImport, spriteProjectActions.projectActions],
  );
  const characterFileMenuState = useMemo<FileMenuState>(
    () => ({
      ...emptyFileMenuState,
      shareActions: characterProjectActions,
      restoreAction: O.none,
    }),
    [characterProjectActions],
  );
  const fileMenuState = useMemo<FileMenuState>(() => {
    if (editMode === "sprite") {
      return spriteFileMenuState;
    }
    if (editMode === "bg") {
      return bgFileMenuState;
    }
    if (editMode === "character") {
      return characterFileMenuState;
    }
    return screenFileMenuState;
  }, [
    bgFileMenuState,
    characterFileMenuState,
    editMode,
    screenFileMenuState,
    spriteFileMenuState,
  ]);

  const handleUndoSelect = useCallback((): void => {
    undoLatestGlobalChange();
  }, []);

  const handleRedoSelect = useCallback((): void => {
    redoLatestGlobalChange();
  }, []);

  useEffect(() => {
    const stopUndoTracking = initializeGlobalUndoTracking();

    const handleWindowKeyDown = (event: KeyboardEvent): void => {
      if (shouldHandleGlobalUndoShortcut(event) === true) {
        const didUndo = undoLatestGlobalChange();
        if (didUndo === true) {
          event.preventDefault();
        }
        return;
      }

      if (shouldHandleGlobalRedoShortcut(event) === true) {
        const didRedo = redoLatestGlobalChange();
        if (didRedo === true) {
          event.preventDefault();
        }
        return;
      }
    };

    const handlePointerDown = (): void => {
      beginGlobalUndoPointerInteraction();
    };

    const handlePointerEnd = (): void => {
      endGlobalUndoPointerInteraction();
    };

    const handleWindowBlur = (): void => {
      cancelGlobalUndoPointerInteraction();
    };

    window.addEventListener("keydown", handleWindowKeyDown);
    window.addEventListener("pointerdown", handlePointerDown, true);
    window.addEventListener("pointerup", handlePointerEnd, true);
    window.addEventListener("pointercancel", handlePointerEnd, true);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      window.removeEventListener("keydown", handleWindowKeyDown);
      window.removeEventListener("pointerdown", handlePointerDown, true);
      window.removeEventListener("pointerup", handlePointerEnd, true);
      window.removeEventListener("pointercancel", handlePointerEnd, true);
      window.removeEventListener("blur", handleWindowBlur);
      cancelGlobalUndoPointerInteraction();
      stopUndoTracking();
    };
  }, []);

  const appPanel = (() => {
    if (editMode === "sprite") {
      return <SpriteMode />;
    }
    if (editMode === "bg") {
      return <BgMode />;
    }
    if (editMode === "character") {
      return <CharacterMode />;
    }
    return <ScreenMode />;
  })();

  return (
    <>
      <DesktopAutoUpdateDialog
        state={desktopAutoUpdate.dialogState}
        progressPercent={desktopAutoUpdate.progressPercent}
        onDialogClose={desktopAutoUpdate.onDialogClose}
        onUpdateNow={desktopAutoUpdate.onUpdateNow}
        onRestartNow={desktopAutoUpdate.onRestartNow}
      />
      <PwaUpdateDialog
        state={pwaUpdate.dialogState}
        onDialogClose={pwaUpdate.onDialogClose}
        onUpdateNow={pwaUpdate.onUpdateNow}
      />
      <NativeMenuBindings
        editMode={editMode}
        enabled={isNativeMacMenu}
        fileMenuState={fileMenuState}
        onEditModeSelect={handleEditModeSelect}
        onRedoSelect={handleRedoSelect}
        onThemePreferenceSelect={onThemePreferenceSelect}
        onUndoSelect={handleUndoSelect}
        themePreference={themePreference}
        onUpdateCheck={handleDesktopAutoUpdateCheck}
      />
      <div className={styles.root}>
        {isNativeMacMenu === true ? (
          <></>
        ) : (
          <header>
            <MenuBar
              fileMenuState={fileMenuState}
              modeMenuState={{
                editMode,
                onEditModeSelect: handleEditModeSelect,
              }}
              onRedoSelect={handleRedoSelect}
              onUndoSelect={handleUndoSelect}
              themeMenuState={{
                onThemePreferenceSelect,
                themePreference,
              }}
            />
          </header>
        )}

        <main className={styles.content}>
          <section className={styles.panel}>{appPanel}</section>

          <aside className={styles.sidebar}>
            <SurfaceCard className={styles.paletteCard}>
              <div className={styles.paletteHeader}>
                <Heading as="h2" size="5">
                  NES パレット
                </Heading>
              </div>
              <div className={styles.paletteScroll}>
                <PalettePicker palettePickerState={palettePickerState} />
              </div>
            </SurfaceCard>
          </aside>
        </main>
      </div>
    </>
  );
};

interface AppProps {
  readonly onThemePreferenceSelect: (themePreference: ThemePreference) => void;
  readonly themePreference: ThemePreference;
}

export const App: React.FC<AppProps> = ({
  onThemePreferenceSelect,
  themePreference,
}) => {
  return (
    <AppBody
      onThemePreferenceSelect={onThemePreferenceSelect}
      themePreference={themePreference}
    />
  );
};
