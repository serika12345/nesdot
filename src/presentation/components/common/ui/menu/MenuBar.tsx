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
import { Button, Dialog } from "@radix-ui/themes";
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
import styles from "./MenuBar.module.css";

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
}) => <div className={styles.menuItemContent}>{children}</div>;

const MenuItemLabel: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <div className={styles.menuItemLabel}>{children}</div>;

const MenuItemIconSlot: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <span className={styles.menuItemIconSlot}>{children}</span>;

const MenuItemMeta: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <span className={styles.menuItemMeta}>{children}</span>;

const MenuModeSelectionMarker: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <span className={styles.menuModeSelectionMarker}>{children}</span>;

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
    <div className={styles.menuBarSurface}>
      <Menubar.Root
        className={styles.menuBarRoot}
        aria-label="ファイル操作メニューバー"
      >
        <Menubar.Menu>
          <Menubar.Trigger
            className={styles.menuTriggerAction}
            type="button"
            aria-haspopup="menu"
          >
            作業モード
          </Menubar.Trigger>

          <Menubar.Portal>
            <Menubar.Content
              className={styles.menuContentSurface}
              aria-label="作業モードメニュー"
              align="start"
              sideOffset={6}
            >
              {WORK_MODE_ITEMS.map((modeItem) => {
                const isSelected = modeItem.value === editMode;

                return (
                  <Menubar.Item
                    key={modeItem.value}
                    className={styles.menuItemAction}
                    onSelect={() => {
                      onEditModeSelect(modeItem.value);
                    }}
                  >
                    <MenuItemContent>
                      <MenuItemLabel>
                        <MenuItemIconSlot>{modeItem.icon}</MenuItemIconSlot>
                        <span className={styles.menuItemTextLabel}>
                          {modeItem.label}
                        </span>
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
                  </Menubar.Item>
                );
              })}
            </Menubar.Content>
          </Menubar.Portal>
        </Menubar.Menu>

        <Menubar.Menu>
          <Menubar.Trigger
            className={styles.menuTriggerAction}
            type="button"
            aria-haspopup="menu"
          >
            編集
          </Menubar.Trigger>

          <Menubar.Portal>
            <Menubar.Content
              className={styles.menuContentSurface}
              aria-label="編集メニュー"
              align="start"
              sideOffset={6}
            >
              <Menubar.Item
                className={styles.menuItemAction}
                onSelect={onUndoSelect}
              >
                <MenuItemContent>
                  <MenuItemLabel>
                    <MenuItemIconSlot>
                      <UndoRoundedIcon fontSize="small" />
                    </MenuItemIconSlot>
                    <span className={styles.menuItemTextLabel}>アンドゥ</span>
                  </MenuItemLabel>
                  <MenuItemMeta>
                    <span className={styles.menuItemShortcutText}>
                      {shortcutLabels.undo}
                    </span>
                  </MenuItemMeta>
                </MenuItemContent>
              </Menubar.Item>

              <Menubar.Item
                className={styles.menuItemAction}
                onSelect={onRedoSelect}
              >
                <MenuItemContent>
                  <MenuItemLabel>
                    <MenuItemIconSlot>
                      <RedoRoundedIcon fontSize="small" />
                    </MenuItemIconSlot>
                    <span className={styles.menuItemTextLabel}>リドゥ</span>
                  </MenuItemLabel>
                  <MenuItemMeta>
                    <span className={styles.menuItemShortcutText}>
                      {shortcutLabels.redo}
                    </span>
                  </MenuItemMeta>
                </MenuItemContent>
              </Menubar.Item>
            </Menubar.Content>
          </Menubar.Portal>
        </Menubar.Menu>

        <Menubar.Menu>
          <Menubar.Trigger
            className={styles.menuTriggerAction}
            type="button"
            aria-haspopup="menu"
          >
            ファイル
          </Menubar.Trigger>

          <Menubar.Portal>
            <Menubar.Content
              className={styles.menuContentSurface}
              aria-label="ファイルメニュー"
              align="start"
              sideOffset={6}
            >
              <Menubar.Sub>
                <Menubar.SubTrigger
                  className={styles.menuSubTriggerAction}
                  disabled={hasShareActions === false}
                >
                  <MenuItemContent>
                    <MenuItemLabel>
                      <MenuItemIconSlot>
                        <ShareRoundedIcon fontSize="small" />
                      </MenuItemIconSlot>
                      <span className={styles.menuItemTextLabel}>共有</span>
                    </MenuItemLabel>
                    <MenuItemMeta>
                      <ChevronRightRoundedIcon fontSize="small" />
                    </MenuItemMeta>
                  </MenuItemContent>
                </Menubar.SubTrigger>

                <Menubar.Portal>
                  <Menubar.SubContent
                    className={styles.menuContentSurface}
                    aria-label="共有サブメニュー"
                    sideOffset={4}
                    alignOffset={-4}
                  >
                    {fileMenuState.shareActions.map((action) => (
                      <Menubar.Item
                        key={action.id}
                        className={styles.menuItemAction}
                        onSelect={() => {
                          action.onSelect();
                        }}
                      >
                        <MenuItemContent>
                          <MenuItemLabel>
                            <MenuItemIconSlot>
                              {getShareActionIcon(action.id)}
                            </MenuItemIconSlot>
                            <span className={styles.menuItemTextLabel}>
                              {action.label}
                            </span>
                          </MenuItemLabel>
                        </MenuItemContent>
                      </Menubar.Item>
                    ))}
                  </Menubar.SubContent>
                </Menubar.Portal>
              </Menubar.Sub>

              <Menubar.Separator className={styles.menuSeparatorLine} />

              <Menubar.Item
                className={styles.menuItemAction}
                disabled={hasRestoreAction === false}
                onSelect={handleRestoreSelect}
              >
                <MenuItemContent>
                  <MenuItemLabel>
                    <MenuItemIconSlot>
                      <FileUploadRoundedIcon fontSize="small" />
                    </MenuItemIconSlot>
                    <span className={styles.menuItemTextLabel}>復元</span>
                  </MenuItemLabel>
                </MenuItemContent>
              </Menubar.Item>
            </Menubar.Content>
          </Menubar.Portal>
        </Menubar.Menu>

        <Menubar.Menu>
          <Menubar.Trigger
            className={styles.menuTriggerAction}
            type="button"
            aria-haspopup="menu"
          >
            ヘルプ
          </Menubar.Trigger>

          <Menubar.Portal>
            <Menubar.Content
              className={styles.menuContentSurface}
              aria-label="ヘルプメニュー"
              align="start"
              sideOffset={6}
            >
              {canCheckForUpdates === true ? (
                <>
                  <Menubar.Item
                    className={styles.menuItemAction}
                    onSelect={handleUpdateCheckSelect}
                  >
                    <MenuItemContent>
                      <MenuItemLabel>
                        <MenuItemIconSlot>
                          <UpdateRoundedIcon fontSize="small" />
                        </MenuItemIconSlot>
                        <span className={styles.menuItemTextLabel}>
                          更新を確認
                        </span>
                      </MenuItemLabel>
                    </MenuItemContent>
                  </Menubar.Item>

                  <Menubar.Separator className={styles.menuSeparatorLine} />
                </>
              ) : (
                <></>
              )}

              <Menubar.Item
                className={styles.menuItemAction}
                onSelect={handleAboutSelect}
              >
                <MenuItemContent>
                  <MenuItemLabel>
                    <MenuItemIconSlot>
                      <InfoRoundedIcon fontSize="small" />
                    </MenuItemIconSlot>
                    <span className={styles.menuItemTextLabel}>About</span>
                  </MenuItemLabel>
                </MenuItemContent>
              </Menubar.Item>
            </Menubar.Content>
          </Menubar.Portal>
        </Menubar.Menu>
      </Menubar.Root>

      <Dialog.Root open={isAboutOpen} onOpenChange={setIsAboutOpen}>
        <Dialog.Content className={styles.menuAboutDialog} maxWidth="24rem">
          <Dialog.Title>About</Dialog.Title>
          <div className={styles.menuAboutBody}>
            <img
              className={styles.menuAboutIconImage}
              src={aboutIconSrc}
              alt="nesdot icon"
            />
            <span className={styles.menuAboutAppName}>nesdot</span>
            <span className={styles.menuAboutVersionText}>
              {`Version ${appVersion}`}
            </span>
          </div>
          <div className={styles.menuAboutActions}>
            {canCheckForUpdates === true ? (
              <Button
                color="gray"
                onClick={handleUpdateCheckSelect}
                variant="surface"
              >
                更新を確認
              </Button>
            ) : (
              <></>
            )}
            <Button onClick={handleAboutClose}>閉じる</Button>
          </div>
        </Dialog.Content>
      </Dialog.Root>
    </div>
  );
};
