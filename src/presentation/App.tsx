import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
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
import { useDesktopAutoUpdate } from "../infrastructure/browser/useDesktopAutoUpdate";
import { usePwaUpdate } from "../infrastructure/browser/usePwaUpdate";
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

const NATIVE_RESTORE_EVENT_NAME = "file-menu://restore-import";
const NATIVE_UNDO_EVENT_NAME = "edit-menu://undo";
const NATIVE_REDO_EVENT_NAME = "edit-menu://redo";
const NATIVE_UPDATE_CHECK_EVENT_NAME = "help-menu://check-for-updates";

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
  enabled: boolean;
  fileMenuState: FileMenuState;
  onEditModeSelect: (nextEditMode: WorkMode) => void;
  onRedoSelect: () => void;
  onUndoSelect: () => void;
  onUpdateCheck: () => void;
}

const NativeMenuBindings: React.FC<NativeMenuBindingsProps> = ({
  enabled,
  fileMenuState,
  onEditModeSelect,
  onRedoSelect,
  onUndoSelect,
  onUpdateCheck,
}) => {
  const runtimeRef = React.useRef({
    fileMenuState,
    onEditModeSelect,
    onRedoSelect,
    onUndoSelect,
    onUpdateCheck,
  });

  runtimeRef.current = {
    fileMenuState,
    onEditModeSelect,
    onRedoSelect,
    onUndoSelect,
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

  return <></>;
};

/**
 * アプリ全体の編集モード切り替えと共通レイアウトを描画します。
 * 各モード画面と共有パレットを束ね、最上位の画面構成責務だけを持つコンポーネントです。
 */
const AppBody: React.FC = () => {
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
        enabled={isNativeMacMenu}
        fileMenuState={fileMenuState}
        onEditModeSelect={handleEditModeSelect}
        onRedoSelect={handleRedoSelect}
        onUndoSelect={handleUndoSelect}
        onUpdateCheck={handleDesktopAutoUpdateCheck}
      />
      <Stack
        component="div"
        spacing={{ xs: "0.75rem", md: "1rem" }}
        p={{ xs: "1rem", md: "1.5rem" }}
        position="relative"
        zIndex={1}
        height="100vh"
        overflow="hidden"
        useFlexGap
      >
        {isNativeMacMenu === true ? (
          <></>
        ) : (
          <MenuBar
            fileMenuState={fileMenuState}
            editMode={editMode}
            onEditModeSelect={handleEditModeSelect}
            onUndoSelect={handleUndoSelect}
            onRedoSelect={handleRedoSelect}
          />
        )}

        <Stack
          useFlexGap
          direction={{ xs: "column", lg: "row" }}
          spacing={{ xs: "1rem", xl: "1.25rem" }}
          flex={1}
          minHeight={0}
          overflow={{ xs: "auto", lg: "visible" }}
        >
          <Stack
            component="section"
            flex={1}
            height="100%"
            minWidth={0}
            minHeight={0}
            overflow="hidden"
            useFlexGap
          >
            {appPanel}
          </Stack>

          <Stack
            component="aside"
            spacing="1rem"
            width={{ xs: "100%", lg: "20rem", xl: "22.5rem" }}
            flexShrink={0}
            height="100%"
            minHeight={{ xs: "auto", lg: 0 }}
            overflow="hidden"
            useFlexGap
          >
            <Stack
              component={Paper}
              variant="outlined"
              spacing="0.875rem"
              p="1.125rem"
              flex={1}
              minHeight={0}
            >
              <Stack
                position="relative"
                zIndex={1}
                spacing="0.3125rem"
                useFlexGap
              >
                <Typography component="h2" variant="h2" color="text.primary">
                  NES パレット
                </Typography>
              </Stack>
              <Box
                flex={1}
                minHeight={0}
                overflow="auto"
                mr={-2.25}
                pr={2.25}
                style={{ scrollbarGutter: "stable" }}
              >
                <PalettePicker palettePickerState={palettePickerState} />
              </Box>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </>
  );
};

export const App: React.FC = () => {
  return <AppBody />;
};
