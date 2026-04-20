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
import { alpha, type Theme, useTheme } from "@mui/material/styles";
import * as Menubar from "@radix-ui/react-menubar";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React, { type CSSProperties } from "react";
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

type MenuThemeStyle = CSSProperties & {
  "--menu-about-app-font-size": string;
  "--menu-about-app-line-height": string;
  "--menu-about-icon-size": string;
  "--menu-about-version-font-size": string;
  "--menu-about-version-line-height": string;
  "--menu-action-min-height": string;
  "--menu-action-padding-block": string;
  "--menu-action-padding-inline": string;
  "--menu-bar-background": string;
  "--menu-bar-border-color": string;
  "--menu-bar-min-height": string;
  "--menu-bar-padding": string;
  "--menu-bar-shadow": string;
  "--menu-font-family": string;
  "--menu-font-size": string;
  "--menu-font-weight": string;
  "--menu-highlight-background": string;
  "--menu-highlight-color": string;
  "--menu-icon-size": string;
  "--menu-line-height": string;
  "--menu-marker-size": string;
  "--menu-meta-gap": string;
  "--menu-popover-background": string;
  "--menu-popover-border-color": string;
  "--menu-popover-padding": string;
  "--menu-popover-shadow": string;
  "--menu-popover-z-index": string;
  "--menu-radius": string;
  "--menu-separator-color": string;
  "--menu-shortcut-font-size": string;
  "--menu-shortcut-line-height": string;
  "--menu-text-primary": string;
  "--menu-text-secondary": string;
  "--menu-transition-duration": string;
  "--menu-trigger-focus-border-color": string;
  "--menu-trigger-focus-shadow": string;
  "--menu-trigger-hover-background": string;
  "--menu-trigger-hover-border-color": string;
  "--menu-trigger-open-background": string;
  "--menu-trigger-open-border-color": string;
  "--menu-trigger-open-color": string;
  "--menu-trigger-open-shadow": string;
  "--menu-trigger-padding-block": string;
  "--menu-trigger-padding-inline": string;
};

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

const createMenuThemeStyle = (theme: Theme): MenuThemeStyle => ({
  "--menu-about-app-font-size": `${theme.typography.subtitle1.fontSize}`,
  "--menu-about-app-line-height": `${theme.typography.subtitle1.lineHeight}`,
  "--menu-about-icon-size": theme.spacing(9),
  "--menu-about-version-font-size": `${theme.typography.body2.fontSize}`,
  "--menu-about-version-line-height": `${theme.typography.body2.lineHeight}`,
  "--menu-action-min-height": theme.spacing(5),
  "--menu-action-padding-block": theme.spacing(0.75),
  "--menu-action-padding-inline": theme.spacing(1),
  "--menu-bar-background": `linear-gradient(180deg, ${alpha(
    theme.palette.common.white,
    0.96,
  )} 0%, ${alpha(theme.palette.grey[50], 0.88)} 100%)`,
  "--menu-bar-border-color": alpha(theme.palette.common.white, 0.48),
  "--menu-bar-min-height": theme.spacing(6),
  "--menu-bar-padding": theme.spacing(0.5),
  "--menu-bar-shadow": `inset 0 0.0625rem 0 ${alpha(
    theme.palette.common.white,
    0.72,
  )}, ${theme.shadows[3]}`,
  "--menu-font-family": theme.typography.fontFamily ?? "inherit",
  "--menu-font-size": `${theme.typography.body2.fontSize}`,
  "--menu-font-weight": `${theme.typography.button.fontWeight}`,
  "--menu-highlight-background": alpha(theme.palette.primary.main, 0.12),
  "--menu-highlight-color": theme.palette.primary.dark,
  "--menu-icon-size": theme.spacing(2.5),
  "--menu-line-height": `${theme.typography.body2.lineHeight}`,
  "--menu-marker-size": theme.spacing(2),
  "--menu-meta-gap": theme.spacing(0.75),
  "--menu-popover-background": `linear-gradient(180deg, ${alpha(
    theme.palette.background.paper,
    0.98,
  )} 0%, ${alpha(theme.palette.grey[50], 0.96)} 100%)`,
  "--menu-popover-border-color": alpha(theme.palette.divider, 0.95),
  "--menu-popover-padding": theme.spacing(0.75),
  "--menu-popover-shadow": `0 1.5rem 3rem ${alpha(
    theme.palette.common.black,
    0.18,
  )}`,
  "--menu-popover-z-index": `${theme.zIndex.modal + 1}`,
  "--menu-radius": `${theme.shape.borderRadius}px`,
  "--menu-separator-color": alpha(theme.palette.divider, 0.96),
  "--menu-shortcut-font-size": `${theme.typography.caption.fontSize}`,
  "--menu-shortcut-line-height": `${theme.typography.caption.lineHeight}`,
  "--menu-text-primary": theme.palette.text.primary,
  "--menu-text-secondary": theme.palette.text.secondary,
  "--menu-transition-duration": `${theme.transitions.duration.shortest}ms`,
  "--menu-trigger-focus-border-color": alpha(theme.palette.primary.main, 0.28),
  "--menu-trigger-focus-shadow": `0 0 0 0.125rem ${alpha(
    theme.palette.primary.main,
    0.18,
  )}`,
  "--menu-trigger-hover-background": alpha(theme.palette.primary.main, 0.06),
  "--menu-trigger-hover-border-color": alpha(theme.palette.primary.main, 0.12),
  "--menu-trigger-open-background": `linear-gradient(180deg, ${alpha(
    theme.palette.common.white,
    0.96,
  )} 0%, ${alpha(theme.palette.primary.main, 0.14)} 100%)`,
  "--menu-trigger-open-border-color": alpha(theme.palette.primary.main, 0.18),
  "--menu-trigger-open-color": theme.palette.primary.dark,
  "--menu-trigger-open-shadow": `0 0.75rem 1.5rem ${alpha(
    theme.palette.primary.main,
    0.16,
  )}`,
  "--menu-trigger-padding-block": theme.spacing(0.875),
  "--menu-trigger-padding-inline": theme.spacing(1.25),
});

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
  const theme = useTheme();
  const menuThemeStyle = React.useMemo(
    () => createMenuThemeStyle(theme),
    [theme],
  );
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
    <div className={styles.menuBarSurface} style={menuThemeStyle}>
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
              style={menuThemeStyle}
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
              style={menuThemeStyle}
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
              style={menuThemeStyle}
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
                    style={menuThemeStyle}
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
              style={menuThemeStyle}
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
            style={menuThemeStyle}
          >
            <img
              className={styles.menuAboutIconImage}
              src={aboutIconSrc}
              alt="nesdot icon"
            />
            <span className={styles.menuAboutAppName}>nesdot</span>
            <span className={styles.menuAboutVersionText}>
              {`Version ${appVersion}`}
            </span>
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
    </div>
  );
};
