import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  beginGlobalUndoPointerInteraction,
  cancelGlobalUndoPointerInteraction,
  endGlobalUndoPointerInteraction,
  initializeGlobalUndoTracking,
  redoLatestGlobalChange,
  undoLatestGlobalChange,
} from "../application/state/undoHistory";
import { useDesktopAutoUpdate } from "../infrastructure/browser/useDesktopAutoUpdate";
import { usePwaUpdate } from "../infrastructure/browser/usePwaUpdate";
import { BgMode } from "./components/bgMode/ui/core/BgMode";
import { CharacterMode } from "./components/characterMode/ui/core/CharacterMode";
import {
  emptyFileMenuState,
  type FileMenuState,
  type FileShareAction,
  type FileShareActionId,
} from "./components/common/logic/state/fileMenuState";
import { DesktopAutoUpdateDialog } from "./components/common/ui/dialogs/DesktopAutoUpdateDialog";
import { PwaUpdateDialog } from "./components/common/ui/dialogs/PwaUpdateDialog";
import { MenuBar, type WorkMode } from "./components/common/ui/menu/MenuBar";
import { PalettePicker } from "./components/common/ui/pickers/PalettePicker";
import { ScreenMode } from "./components/screenMode/ui/core/ScreenMode";
import { SpriteMode } from "./components/spriteMode/ui/core/SpriteMode";
import { APP_PANEL_CLASS_NAME } from "./styleClassNames";

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

/**
 * アプリ全体の編集モード切り替えと共通レイアウトを描画します。
 * 各モード画面と共有パレットを束ね、最上位の画面構成責務だけを持つコンポーネントです。
 */
export const App: React.FC = () => {
  const desktopAutoUpdate = useDesktopAutoUpdate();
  const pwaUpdate = usePwaUpdate();
  const handleDesktopAutoUpdateCheck = desktopAutoUpdate.onCheckNow;

  const [editMode, setEditMode] = useState<WorkMode>("sprite");
  const [fileMenuState, setFileMenuState] =
    useState<FileMenuState>(emptyFileMenuState);
  const isNativeMacMenu = useMemo(() => isMacNativeMenuRuntime(), []);

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

  useEffect(() => {
    if (isNativeMacMenu !== true) {
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
              runShareActionById(fileMenuState.shareActions, actionId);
            }),
          ),
        );
        const modeUnlistenCallbacks = await Promise.all(
          NATIVE_MODE_EVENT_BINDINGS.map(({ eventName, mode }) =>
            eventModule.listen(eventName, () => {
              setEditMode(mode);
            }),
          ),
        );

        const restoreUnlistenCallback = await eventModule.listen(
          NATIVE_RESTORE_EVENT_NAME,
          () => {
            runRestoreAction(fileMenuState);
          },
        );

        const undoUnlistenCallback = await eventModule.listen(
          NATIVE_UNDO_EVENT_NAME,
          () => {
            handleUndoSelect();
          },
        );

        const redoUnlistenCallback = await eventModule.listen(
          NATIVE_REDO_EVENT_NAME,
          () => {
            handleRedoSelect();
          },
        );

        const updateCheckUnlistenCallback = await eventModule.listen(
          NATIVE_UPDATE_CHECK_EVENT_NAME,
          () => {
            handleDesktopAutoUpdateCheck();
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
  }, [
    fileMenuState,
    handleDesktopAutoUpdateCheck,
    handleRedoSelect,
    handleUndoSelect,
    isNativeMacMenu,
  ]);

  const handleFileMenuStateChange = useCallback(
    (nextFileMenuState: FileMenuState): void => {
      setFileMenuState(nextFileMenuState);
    },
    [],
  );

  const handleEditModeSelect = useCallback((nextEditMode: WorkMode): void => {
    setEditMode(nextEditMode);
  }, []);

  const mainPanel = (() => {
    if (editMode === "sprite") {
      return <SpriteMode onFileMenuStateChange={handleFileMenuStateChange} />;
    }
    if (editMode === "bg") {
      return <BgMode onFileMenuStateChange={handleFileMenuStateChange} />;
    }
    if (editMode === "character") {
      return (
        <CharacterMode onFileMenuStateChange={handleFileMenuStateChange} />
      );
    }
    return <ScreenMode onFileMenuStateChange={handleFileMenuStateChange} />;
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
            {mainPanel}
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
              component="div"
              className={APP_PANEL_CLASS_NAME}
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
                <PalettePicker />
              </Box>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </>
  );
};
