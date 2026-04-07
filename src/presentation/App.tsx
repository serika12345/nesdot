import { GlobalStyles } from "@mui/material";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDesktopAutoUpdate } from "../infrastructure/browser/useDesktopAutoUpdate";
import {
  Container,
  LeftPane,
  Panel,
  PanelHeader,
  PanelTitle,
  RightPane,
  ScrollArea,
  WorkspaceGrid,
} from "./App.styles";
import { CharacterMode } from "./components/characterMode/CharacterMode";
import { FileMenuBar, type WorkMode } from "./components/common/FileMenuBar";
import {
  emptyFileMenuState,
  type FileMenuState,
  type FileShareAction,
  type FileShareActionId,
} from "./components/common/fileMenuState";
import { PalettePicker } from "./components/common/PalettePicker";
import { ScreenMode } from "./components/screenMode/ScreenMode";
import { SpriteMode } from "./components/spriteMode/SpriteMode";
import { getAppGlobalStyles } from "./theme";

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
    eventName: "mode-menu://switch-screen",
    mode: "screen",
  },
];

const NATIVE_RESTORE_EVENT_NAME = "file-menu://restore-import";

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
  useDesktopAutoUpdate();

  const [editMode, setEditMode] = useState<WorkMode>("sprite");
  const [fileMenuState, setFileMenuState] =
    useState<FileMenuState>(emptyFileMenuState);
  const isNativeMacMenu = useMemo(() => isMacNativeMenuRuntime(), []);

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

        return [
          ...shareUnlistenCallbacks,
          ...modeUnlistenCallbacks,
          restoreUnlistenCallback,
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
  }, [fileMenuState, isNativeMacMenu]);

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
    if (editMode === "character") {
      return (
        <CharacterMode onFileMenuStateChange={handleFileMenuStateChange} />
      );
    }
    return <ScreenMode onFileMenuStateChange={handleFileMenuStateChange} />;
  })();

  return (
    <>
      <GlobalStyles styles={getAppGlobalStyles} />

      <Container spacing={{ xs: "0.75rem", md: "1rem" }}>
        <FileMenuBar
          fileMenuState={fileMenuState}
          editMode={editMode}
          onEditModeSelect={handleEditModeSelect}
          hidden={isNativeMacMenu}
        />

        <WorkspaceGrid flex={1} minHeight={0}>
          <LeftPane>{mainPanel}</LeftPane>

          <RightPane>
            <Panel flex={1} minHeight={0}>
              <PanelHeader>
                <PanelTitle>NES パレット</PanelTitle>
              </PanelHeader>
              <ScrollArea flex={1} minHeight={0}>
                <PalettePicker />
              </ScrollArea>
            </Panel>
          </RightPane>
        </WorkspaceGrid>
      </Container>
    </>
  );
};
