import * as Menubar from "@radix-ui/react-menubar";
import { Button, Dialog, Theme } from "@radix-ui/themes";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React from "react";
import { type WorkMode } from "../../../../../application/state/workbenchStore";
import { type ThemePreference } from "../../../../../infrastructure/browser/themePreference";
import {
  canRequestAvailableUpdateCheck,
  requestAvailableUpdateCheck,
} from "../../../../../infrastructure/browser/updateCheck";
import {
  type FileMenuState,
  type FileShareActionId,
} from "../../logic/state/fileMenuState";
import {
  CheckIcon,
  ChevronRightIcon,
  CodeIcon,
  DashboardIcon,
  DesktopIcon,
  DrawIcon,
  FileUploadIcon,
  ImageIcon,
  InfoIcon,
  MoonIcon,
  RedoIcon,
  SaveIcon,
  ShareIcon,
  SunIcon,
  TextureIcon,
  UndoIcon,
  UpdateIcon,
  WallpaperIcon,
} from "../icons/AppIcons";
import styles from "./MenuBar.module.css";

interface MenuBarProps {
  fileMenuState: FileMenuState;
  onUndoSelect: () => void;
  onRedoSelect: () => void;
  modeMenuState: Readonly<{
    editMode: WorkMode;
    onEditModeSelect: (mode: WorkMode) => void;
  }>;
  themeMenuState: Readonly<{
    onThemePreferenceSelect: (themePreference: ThemePreference) => void;
    themePreference: ThemePreference;
  }>;
}

const WORK_MODE_ITEMS: ReadonlyArray<{
  value: WorkMode;
  label: string;
  icon: React.ReactNode;
}> = [
  {
    value: "sprite",
    label: "スプライト編集",
    icon: <DrawIcon />,
  },
  {
    value: "character",
    label: "キャラクター編集",
    icon: <DashboardIcon />,
  },
  {
    value: "bg",
    label: "BG編集",
    icon: <TextureIcon />,
  },
  {
    value: "screen",
    label: "画面配置",
    icon: <WallpaperIcon />,
  },
];

const THEME_PREFERENCE_ITEMS: ReadonlyArray<{
  value: ThemePreference;
  label: string;
  icon: React.ReactNode;
}> = [
  {
    value: "light",
    label: "ライト",
    icon: <SunIcon />,
  },
  {
    value: "dark",
    label: "ダーク",
    icon: <MoonIcon />,
  },
  {
    value: "system",
    label: "システムに合わせる",
    icon: <DesktopIcon />,
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
}) => (
  <span aria-hidden="true" className={styles.menuItemIconSlot}>
    {children}
  </span>
);

const MenuItemMeta: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <span aria-hidden="true" className={styles.menuItemMeta}>
    {children}
  </span>
);

const MenuModeSelectionMarker: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <span aria-hidden="true" className={styles.menuModeSelectionMarker}>
    {children}
  </span>
);

const getShareActionIcon = (actionId: FileShareActionId): React.JSX.Element => {
  if (actionId === "share-save-project") {
    return <SaveIcon />;
  }

  if (actionId === "share-export-png" || actionId === "share-export-svg") {
    return <ImageIcon />;
  }

  return <CodeIcon />;
};

export const MenuBar: React.FC<MenuBarProps> = ({
  fileMenuState,
  onUndoSelect,
  onRedoSelect,
  modeMenuState,
  themeMenuState,
}) => {
  const editMode = modeMenuState.editMode;
  const onEditModeSelect = modeMenuState.onEditModeSelect;
  const onThemePreferenceSelect = themeMenuState.onThemePreferenceSelect;
  const themePreference = themeMenuState.themePreference;
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
            redoLabel: "⇧⌘Z",
            redoShortcut: "Meta+Shift+Z",
            undoLabel: "⌘Z",
            undoShortcut: "Meta+Z",
          }
        : {
            redoLabel: "Ctrl+Shift+Z / Ctrl+Y",
            redoShortcut: "Control+Shift+Z Control+Y",
            undoLabel: "Ctrl+Z",
            undoShortcut: "Control+Z",
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
    <nav
      className={styles.menuBarSurface}
      aria-label="アプリケーションメニュー"
    >
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
            <Theme asChild>
              <Menubar.Content
                className={styles.menuContentSurface}
                aria-label="作業モードメニュー"
                align="start"
                sideOffset={6}
              >
                <Menubar.RadioGroup value={editMode}>
                  {WORK_MODE_ITEMS.map((modeItem) => {
                    const isSelected = modeItem.value === editMode;

                    return (
                      <Menubar.RadioItem
                        key={modeItem.value}
                        value={modeItem.value}
                        className={styles.menuItemAction}
                        aria-checked={isSelected}
                        aria-label={`作業モード ${modeItem.label}`}
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
                              {isSelected === true ? <CheckIcon /> : <></>}
                            </MenuModeSelectionMarker>
                          </MenuItemMeta>
                        </MenuItemContent>
                      </Menubar.RadioItem>
                    );
                  })}
                </Menubar.RadioGroup>
              </Menubar.Content>
            </Theme>
          </Menubar.Portal>
        </Menubar.Menu>

        <Menubar.Menu>
          <Menubar.Trigger
            className={styles.menuTriggerAction}
            type="button"
            aria-haspopup="menu"
          >
            表示
          </Menubar.Trigger>

          <Menubar.Portal>
            <Theme asChild>
              <Menubar.Content
                className={styles.menuContentSurface}
                aria-label="表示メニュー"
                align="start"
                sideOffset={6}
              >
                <Menubar.RadioGroup value={themePreference}>
                  {THEME_PREFERENCE_ITEMS.map((themeItem) => {
                    const isSelected = themeItem.value === themePreference;

                    return (
                      <Menubar.RadioItem
                        key={themeItem.value}
                        value={themeItem.value}
                        className={styles.menuItemAction}
                        aria-checked={isSelected}
                        aria-label={`表示テーマ ${themeItem.label}`}
                        onSelect={() => {
                          onThemePreferenceSelect(themeItem.value);
                        }}
                      >
                        <MenuItemContent>
                          <MenuItemLabel>
                            <MenuItemIconSlot>
                              {themeItem.icon}
                            </MenuItemIconSlot>
                            <span className={styles.menuItemTextLabel}>
                              {themeItem.label}
                            </span>
                          </MenuItemLabel>
                          <MenuItemMeta>
                            <MenuModeSelectionMarker>
                              {isSelected === true ? <CheckIcon /> : <></>}
                            </MenuModeSelectionMarker>
                          </MenuItemMeta>
                        </MenuItemContent>
                      </Menubar.RadioItem>
                    );
                  })}
                </Menubar.RadioGroup>
              </Menubar.Content>
            </Theme>
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
            <Theme asChild>
              <Menubar.Content
                className={styles.menuContentSurface}
                aria-label="編集メニュー"
                align="start"
                sideOffset={6}
              >
                <Menubar.Item
                  className={styles.menuItemAction}
                  aria-keyshortcuts={shortcutLabels.undoShortcut}
                  onSelect={onUndoSelect}
                >
                  <MenuItemContent>
                    <MenuItemLabel>
                      <MenuItemIconSlot>
                        <UndoIcon />
                      </MenuItemIconSlot>
                      <span className={styles.menuItemTextLabel}>アンドゥ</span>
                    </MenuItemLabel>
                    <MenuItemMeta>
                      <span className={styles.menuItemShortcutText}>
                        {shortcutLabels.undoLabel}
                      </span>
                    </MenuItemMeta>
                  </MenuItemContent>
                </Menubar.Item>

                <Menubar.Item
                  className={styles.menuItemAction}
                  aria-keyshortcuts={shortcutLabels.redoShortcut}
                  onSelect={onRedoSelect}
                >
                  <MenuItemContent>
                    <MenuItemLabel>
                      <MenuItemIconSlot>
                        <RedoIcon />
                      </MenuItemIconSlot>
                      <span className={styles.menuItemTextLabel}>リドゥ</span>
                    </MenuItemLabel>
                    <MenuItemMeta>
                      <span className={styles.menuItemShortcutText}>
                        {shortcutLabels.redoLabel}
                      </span>
                    </MenuItemMeta>
                  </MenuItemContent>
                </Menubar.Item>
              </Menubar.Content>
            </Theme>
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
            <Theme asChild>
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
                          <ShareIcon />
                        </MenuItemIconSlot>
                        <span className={styles.menuItemTextLabel}>共有</span>
                      </MenuItemLabel>
                      <MenuItemMeta>
                        <ChevronRightIcon />
                      </MenuItemMeta>
                    </MenuItemContent>
                  </Menubar.SubTrigger>

                  <Menubar.Portal>
                    <Theme asChild>
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
                    </Theme>
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
                        <FileUploadIcon />
                      </MenuItemIconSlot>
                      <span className={styles.menuItemTextLabel}>復元</span>
                    </MenuItemLabel>
                  </MenuItemContent>
                </Menubar.Item>
              </Menubar.Content>
            </Theme>
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
            <Theme asChild>
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
                            <UpdateIcon />
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
                        <InfoIcon />
                      </MenuItemIconSlot>
                      <span className={styles.menuItemTextLabel}>About</span>
                    </MenuItemLabel>
                  </MenuItemContent>
                </Menubar.Item>
              </Menubar.Content>
            </Theme>
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
            <p className={styles.menuAboutAppName}>nesdot</p>
            <p className={styles.menuAboutVersionText}>
              {`Version ${appVersion}`}
            </p>
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
    </nav>
  );
};
