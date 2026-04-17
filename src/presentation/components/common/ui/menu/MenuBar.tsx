import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CodeRoundedIcon from "@mui/icons-material/CodeRounded";
import DashboardCustomizeRoundedIcon from "@mui/icons-material/DashboardCustomizeRounded";
import DrawRoundedIcon from "@mui/icons-material/DrawRounded";
import FileUploadRoundedIcon from "@mui/icons-material/FileUploadRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import RedoRoundedIcon from "@mui/icons-material/RedoRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import ShareRoundedIcon from "@mui/icons-material/ShareRounded";
import TextureRoundedIcon from "@mui/icons-material/TextureRounded";
import UndoRoundedIcon from "@mui/icons-material/UndoRounded";
import UpdateRoundedIcon from "@mui/icons-material/UpdateRounded";
import WallpaperRoundedIcon from "@mui/icons-material/WallpaperRounded";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import * as Menubar from "@radix-ui/react-menubar";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React from "react";
import { type WorkMode } from "../../../../../application/state/workbenchStore";
import {
  canRequestAvailableUpdateCheck,
  requestAvailableUpdateCheck,
} from "../../../../../infrastructure/browser/updateCheck";
import {
  type FileMenuState,
  type FileShareActionId,
} from "../../logic/state/fileMenuState";
import {
  MenuAboutAppName,
  MenuAboutIconImage,
  MenuAboutVersionText,
  MenuBarSurface,
  MenuContentSurface,
  MenuItemAction,
  MenuItemIconSlotRoot,
  MenuItemMetaRoot,
  MenuItemShortcutText,
  MenuItemTextLabel,
  MenuModeSelectionMarkerRoot,
  MenuSeparatorLine,
  MenuSubContentSurface,
  MenuSubTriggerAction,
  MenuTriggerAction,
} from "./MenuBarStyle";

interface MenuBarProps {
  fileMenuState: FileMenuState;
  editMode: WorkMode;
  onEditModeSelect: (mode: WorkMode) => void;
  onUndoSelect: () => void;
  onRedoSelect: () => void;
}

const WORK_MODE_ITEMS: ReadonlyArray<{
  value: WorkMode;
  label: string;
  icon: React.ReactNode;
}> = [
  {
    value: "sprite",
    label: "スプライト編集",
    icon: <DrawRoundedIcon fontSize="small" />,
  },
  {
    value: "character",
    label: "キャラクター編集",
    icon: <DashboardCustomizeRoundedIcon fontSize="small" />,
  },
  {
    value: "bg",
    label: "BG編集",
    icon: <TextureRoundedIcon fontSize="small" />,
  },
  {
    value: "screen",
    label: "画面配置",
    icon: <WallpaperRoundedIcon fontSize="small" />,
  },
];

const MenuItemContent: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <Stack
    direction="row"
    alignItems="center"
    justifyContent="space-between"
    spacing={1}
    useFlexGap
    width="100%"
    minWidth={0}
  >
    {children}
  </Stack>
);

const MenuItemLabel: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <Stack
    direction="row"
    alignItems="center"
    spacing={1}
    useFlexGap
    minWidth={0}
    flex="1 1 auto"
  >
    {children}
  </Stack>
);

const MenuItemIconSlot: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <MenuItemIconSlotRoot>{children}</MenuItemIconSlotRoot>;

const MenuItemMeta: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <MenuItemMetaRoot>{children}</MenuItemMetaRoot>;

const MenuModeSelectionMarker: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <MenuModeSelectionMarkerRoot>{children}</MenuModeSelectionMarkerRoot>;

const getShareActionIcon = (actionId: FileShareActionId): React.JSX.Element => {
  if (actionId === "share-save-project") {
    return <SaveRoundedIcon fontSize="small" />;
  }

  if (actionId === "share-export-png" || actionId === "share-export-svg") {
    return <ImageRoundedIcon fontSize="small" />;
  }

  return <CodeRoundedIcon fontSize="small" />;
};

export const MenuBar: React.FC<MenuBarProps> = ({
  fileMenuState,
  editMode,
  onEditModeSelect,
  onUndoSelect,
  onRedoSelect,
}) => {
  const appVersion = import.meta.env.VITE_APP_VERSION;
  const aboutIconSrc = `${import.meta.env.BASE_URL}pwa-192x192.png`;
  const aboutDialogTitleId = React.useId();
  const [isAboutOpen, setIsAboutOpen] = React.useState(false);
  const canCheckForUpdates = React.useMemo(
    () => canRequestAvailableUpdateCheck(),
    [],
  );
  const hasShareActions = fileMenuState.shareActions.length > 0;
  const hasRestoreAction = O.isSome(fileMenuState.restoreAction);
  const shortcutLabels = React.useMemo(
    () =>
      typeof navigator !== "undefined" && navigator.userAgent.includes("Mac")
        ? {
            undo: "⌘Z",
            redo: "⇧⌘Z",
          }
        : {
            undo: "Ctrl+Z",
            redo: "Ctrl+Shift+Z / Ctrl+Y",
          },
    [],
  );

  const handleRestoreSelect = (): void => {
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

  const handleAboutSelect = (): void => {
    setIsAboutOpen(true);
  };

  const handleAboutClose = (): void => {
    setIsAboutOpen(false);
  };

  const handleUpdateCheckSelect = (): void => {
    requestAvailableUpdateCheck();
  };

  return (
    <MenuBarSurface
      direction="row"
      alignItems="center"
      justifyContent="flex-start"
    >
      <Stack minWidth={0}>
        <Stack
          component={Menubar.Root}
          direction="row"
          alignItems="center"
          spacing={0.25}
          useFlexGap
          width="max-content"
          minWidth={0}
          aria-label="ファイル操作メニューバー"
        >
          <Menubar.Menu>
            <Menubar.Trigger asChild>
              <MenuTriggerAction type="button" aria-haspopup="menu">
                作業モード
              </MenuTriggerAction>
            </Menubar.Trigger>

            <Menubar.Portal>
              <Menubar.Content asChild align="start" sideOffset={6}>
                <MenuContentSurface
                  aria-label="作業モードメニュー"
                  spacing={0.25}
                  useFlexGap
                >
                  {WORK_MODE_ITEMS.map((modeItem) => {
                    const isSelected = modeItem.value === editMode;

                    return (
                      <Menubar.Item
                        key={modeItem.value}
                        asChild
                        onSelect={() => {
                          onEditModeSelect(modeItem.value);
                        }}
                      >
                        <MenuItemAction>
                          <MenuItemContent>
                            <MenuItemLabel>
                              <MenuItemIconSlot>
                                {modeItem.icon}
                              </MenuItemIconSlot>
                              <MenuItemTextLabel>
                                {modeItem.label}
                              </MenuItemTextLabel>
                            </MenuItemLabel>
                            <MenuItemMeta>
                              <MenuModeSelectionMarker>
                                {isSelected === true ? (
                                  <CheckRoundedIcon fontSize="small" />
                                ) : (
                                  <></>
                                )}
                              </MenuModeSelectionMarker>
                            </MenuItemMeta>
                          </MenuItemContent>
                        </MenuItemAction>
                      </Menubar.Item>
                    );
                  })}
                </MenuContentSurface>
              </Menubar.Content>
            </Menubar.Portal>
          </Menubar.Menu>

          <Menubar.Menu>
            <Menubar.Trigger asChild>
              <MenuTriggerAction type="button" aria-haspopup="menu">
                編集
              </MenuTriggerAction>
            </Menubar.Trigger>

            <Menubar.Portal>
              <Menubar.Content asChild align="start" sideOffset={6}>
                <MenuContentSurface
                  aria-label="編集メニュー"
                  spacing={0.25}
                  useFlexGap
                >
                  <Menubar.Item asChild onSelect={onUndoSelect}>
                    <MenuItemAction>
                      <MenuItemContent>
                        <MenuItemLabel>
                          <MenuItemIconSlot>
                            <UndoRoundedIcon fontSize="small" />
                          </MenuItemIconSlot>
                          <MenuItemTextLabel>アンドゥ</MenuItemTextLabel>
                        </MenuItemLabel>
                        <MenuItemMeta>
                          <MenuItemShortcutText>
                            {shortcutLabels.undo}
                          </MenuItemShortcutText>
                        </MenuItemMeta>
                      </MenuItemContent>
                    </MenuItemAction>
                  </Menubar.Item>

                  <Menubar.Item asChild onSelect={onRedoSelect}>
                    <MenuItemAction>
                      <MenuItemContent>
                        <MenuItemLabel>
                          <MenuItemIconSlot>
                            <RedoRoundedIcon fontSize="small" />
                          </MenuItemIconSlot>
                          <MenuItemTextLabel>リドゥ</MenuItemTextLabel>
                        </MenuItemLabel>
                        <MenuItemMeta>
                          <MenuItemShortcutText>
                            {shortcutLabels.redo}
                          </MenuItemShortcutText>
                        </MenuItemMeta>
                      </MenuItemContent>
                    </MenuItemAction>
                  </Menubar.Item>
                </MenuContentSurface>
              </Menubar.Content>
            </Menubar.Portal>
          </Menubar.Menu>

          <Menubar.Menu>
            <Menubar.Trigger asChild>
              <MenuTriggerAction type="button" aria-haspopup="menu">
                ファイル
              </MenuTriggerAction>
            </Menubar.Trigger>

            <Menubar.Portal>
              <Menubar.Content asChild align="start" sideOffset={6}>
                <MenuContentSurface
                  aria-label="ファイルメニュー"
                  spacing={0.25}
                  useFlexGap
                >
                  <Menubar.Sub>
                    <Menubar.SubTrigger
                      asChild
                      disabled={hasShareActions === false}
                    >
                      <MenuSubTriggerAction>
                        <MenuItemContent>
                          <MenuItemLabel>
                            <MenuItemIconSlot>
                              <ShareRoundedIcon fontSize="small" />
                            </MenuItemIconSlot>
                            <MenuItemTextLabel>共有</MenuItemTextLabel>
                          </MenuItemLabel>
                          <MenuItemMeta>
                            <ChevronRightRoundedIcon fontSize="small" />
                          </MenuItemMeta>
                        </MenuItemContent>
                      </MenuSubTriggerAction>
                    </Menubar.SubTrigger>

                    <Menubar.Portal>
                      <Menubar.SubContent
                        asChild
                        sideOffset={4}
                        alignOffset={-4}
                      >
                        <MenuSubContentSurface
                          aria-label="共有サブメニュー"
                          spacing={0.25}
                          useFlexGap
                        >
                          {fileMenuState.shareActions.map((action) => (
                            <Menubar.Item
                              key={action.id}
                              asChild
                              onSelect={() => {
                                action.onSelect();
                              }}
                            >
                              <MenuItemAction>
                                <MenuItemContent>
                                  <MenuItemLabel>
                                    <MenuItemIconSlot>
                                      {getShareActionIcon(action.id)}
                                    </MenuItemIconSlot>
                                    <MenuItemTextLabel>
                                      {action.label}
                                    </MenuItemTextLabel>
                                  </MenuItemLabel>
                                </MenuItemContent>
                              </MenuItemAction>
                            </Menubar.Item>
                          ))}
                        </MenuSubContentSurface>
                      </Menubar.SubContent>
                    </Menubar.Portal>
                  </Menubar.Sub>

                  <Menubar.Separator asChild>
                    <MenuSeparatorLine />
                  </Menubar.Separator>

                  <Menubar.Item
                    asChild
                    disabled={hasRestoreAction === false}
                    onSelect={handleRestoreSelect}
                  >
                    <MenuItemAction>
                      <MenuItemContent>
                        <MenuItemLabel>
                          <MenuItemIconSlot>
                            <FileUploadRoundedIcon fontSize="small" />
                          </MenuItemIconSlot>
                          <MenuItemTextLabel>復元</MenuItemTextLabel>
                        </MenuItemLabel>
                      </MenuItemContent>
                    </MenuItemAction>
                  </Menubar.Item>
                </MenuContentSurface>
              </Menubar.Content>
            </Menubar.Portal>
          </Menubar.Menu>

          <Menubar.Menu>
            <Menubar.Trigger asChild>
              <MenuTriggerAction type="button" aria-haspopup="menu">
                ヘルプ
              </MenuTriggerAction>
            </Menubar.Trigger>

            <Menubar.Portal>
              <Menubar.Content asChild align="start" sideOffset={6}>
                <MenuContentSurface
                  aria-label="ヘルプメニュー"
                  spacing={0.25}
                  useFlexGap
                >
                  {canCheckForUpdates === true ? (
                    <>
                      <Menubar.Item asChild onSelect={handleUpdateCheckSelect}>
                        <MenuItemAction>
                          <MenuItemContent>
                            <MenuItemLabel>
                              <MenuItemIconSlot>
                                <UpdateRoundedIcon fontSize="small" />
                              </MenuItemIconSlot>
                              <MenuItemTextLabel>更新を確認</MenuItemTextLabel>
                            </MenuItemLabel>
                          </MenuItemContent>
                        </MenuItemAction>
                      </Menubar.Item>

                      <Menubar.Separator asChild>
                        <MenuSeparatorLine />
                      </Menubar.Separator>
                    </>
                  ) : (
                    <></>
                  )}

                  <Menubar.Item asChild onSelect={handleAboutSelect}>
                    <MenuItemAction>
                      <MenuItemContent>
                        <MenuItemLabel>
                          <MenuItemIconSlot>
                            <InfoRoundedIcon fontSize="small" />
                          </MenuItemIconSlot>
                          <MenuItemTextLabel>About</MenuItemTextLabel>
                        </MenuItemLabel>
                      </MenuItemContent>
                    </MenuItemAction>
                  </Menubar.Item>
                </MenuContentSurface>
              </Menubar.Content>
            </Menubar.Portal>
          </Menubar.Menu>
        </Stack>
      </Stack>

      <Dialog
        open={isAboutOpen}
        onClose={handleAboutClose}
        aria-labelledby={aboutDialogTitleId}
      >
        <DialogTitle id={aboutDialogTitleId}>About</DialogTitle>
        <DialogContent>
          <Stack
            alignItems="center"
            spacing={1}
            useFlexGap
            minWidth="12rem"
            pt={1}
            pb={1}
          >
            <MenuAboutIconImage src={aboutIconSrc} alt="nesdot icon" />
            <MenuAboutAppName>nesdot</MenuAboutAppName>
            <MenuAboutVersionText>
              {`Version ${appVersion}`}
            </MenuAboutVersionText>
          </Stack>
        </DialogContent>
        <DialogActions>
          {canCheckForUpdates === true ? (
            <Button onClick={handleUpdateCheckSelect}>更新を確認</Button>
          ) : (
            <></>
          )}
          <Button onClick={handleAboutClose} autoFocus>
            閉じる
          </Button>
        </DialogActions>
      </Dialog>
    </MenuBarSurface>
  );
};
