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
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import { alpha, type Theme } from "@mui/material/styles";
import * as Menubar from "@radix-ui/react-menubar";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React from "react";
import {
  canRequestAvailableUpdateCheck,
  requestAvailableUpdateCheck,
} from "../../../../infrastructure/browser/updateCheck";
import {
  MENU_ABOUT_APP_NAME_CLASS_NAME,
  MENU_ABOUT_ICON_IMAGE_CLASS_NAME,
  MENU_ABOUT_VERSION_TEXT_CLASS_NAME,
  MENU_BAR_ROOT_CLASS_NAME,
  MENU_CONTENT_CLASS_NAME,
  MENU_ITEM_CLASS_NAME,
  MENU_ITEM_ICON_SLOT_CLASS_NAME,
  MENU_ITEM_META_CLASS_NAME,
  MENU_ITEM_SHORTCUT_TEXT_CLASS_NAME,
  MENU_ITEM_TEXT_CLASS_NAME,
  MENU_MODE_SELECTION_MARKER_CLASS_NAME,
  MENU_ROOT_CLASS_NAME,
  MENU_SEPARATOR_CLASS_NAME,
  MENU_SUB_TRIGGER_CLASS_NAME,
  MENU_TRIGGER_CLASS_NAME,
} from "../../../styleClassNames";
import { appTheme } from "../../../theme";
import {
  type FileMenuState,
  type FileShareActionId,
} from "../state/fileMenuState";

export type WorkMode = "screen" | "sprite" | "character" | "bg";

interface MenuBarProps {
  fileMenuState: FileMenuState;
  editMode: WorkMode;
  onEditModeSelect: (mode: WorkMode) => void;
  onUndoSelect: () => void;
  onRedoSelect: () => void;
}

type MenuThemeStyle = React.CSSProperties & {
  [key: `--menu-${string}`]: string;
};

const toCssLength = (value: number | string): string =>
  typeof value === "number" ? `${value}px` : value;

const createMenuThemeStyle = (theme: Theme): MenuThemeStyle => ({
  "--menu-radius": toCssLength(theme.shape.borderRadius),
  "--menu-bg-root-top": alpha(theme.palette.common.white, 0.96),
  "--menu-bg-root-bottom": alpha(theme.palette.grey[50], 0.88),
  "--menu-bg-surface-top": alpha(theme.palette.background.paper, 0.98),
  "--menu-bg-surface-bottom": alpha(theme.palette.grey[50], 0.96),
  "--menu-bg-hover": alpha(theme.palette.primary.main, 0.06),
  "--menu-bg-highlight": alpha(theme.palette.primary.main, 0.12),
  "--menu-bg-open": alpha(theme.palette.primary.main, 0.14),
  "--menu-border-root": alpha(theme.palette.common.white, 0.48),
  "--menu-border-surface": alpha(theme.palette.divider, 0.95),
  "--menu-border-divider": alpha(theme.palette.divider, 0.96),
  "--menu-border-hover": alpha(theme.palette.primary.main, 0.12),
  "--menu-border-open": alpha(theme.palette.primary.main, 0.18),
  "--menu-border-focus": alpha(theme.palette.primary.main, 0.28),
  "--menu-border-transparent": alpha(theme.palette.primary.main, 0),
  "--menu-shadow-root": `inset 0 0.0625rem 0 ${alpha(theme.palette.common.white, 0.72)}, ${theme.shadows[3]}`,
  "--menu-shadow-surface": `0 1.5rem 3rem ${alpha(theme.palette.common.black, 0.18)}`,
  "--menu-shadow-open": `0 0.75rem 1.5rem ${alpha(theme.palette.primary.main, 0.16)}`,
  "--menu-color-text-primary": theme.palette.text.primary,
  "--menu-color-text-secondary": theme.palette.text.secondary,
  "--menu-color-primary-dark": theme.palette.primary.dark,
  "--menu-color-focus-ring": alpha(theme.palette.primary.main, 0.18),
  "--menu-space-025": theme.spacing(0.25),
  "--menu-space-05": theme.spacing(0.5),
  "--menu-space-075": theme.spacing(0.75),
  "--menu-space-0875": theme.spacing(0.875),
  "--menu-space-1": theme.spacing(1),
  "--menu-space-125": theme.spacing(1.25),
  "--menu-size-root-height": theme.spacing(6),
  "--menu-size-item-height": theme.spacing(5),
  "--menu-size-icon-slot": theme.spacing(2.5),
  "--menu-size-marker": theme.spacing(2),
  "--menu-font-family": String(theme.typography.fontFamily ?? ""),
  "--menu-font-size-body2": String(theme.typography.body2.fontSize),
  "--menu-line-height-body2": String(theme.typography.body2.lineHeight),
  "--menu-font-size-caption": String(theme.typography.caption.fontSize),
  "--menu-line-height-caption": String(theme.typography.caption.lineHeight),
  "--menu-font-size-subtitle1": String(theme.typography.subtitle1.fontSize),
  "--menu-line-height-subtitle1": String(theme.typography.subtitle1.lineHeight),
  "--menu-font-weight-button": String(theme.typography.button.fontWeight),
  "--menu-z-index": String(theme.zIndex.modal + 1),
  "--menu-transition-shortest": `${theme.transitions.duration.shortest}ms`,
});

const menuThemeStyle = createMenuThemeStyle(appTheme);

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
}) => (
  <Box
    component="span"
    className={MENU_ITEM_ICON_SLOT_CLASS_NAME}
    display="inline-flex"
    alignItems="center"
    justifyContent="center"
    width="var(--menu-size-icon-slot)"
    height="var(--menu-size-icon-slot)"
    flexShrink={0}
  >
    {children}
  </Box>
);

const MenuItemMeta: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <Stack
    component="span"
    className={MENU_ITEM_META_CLASS_NAME}
    direction="row"
    alignItems="center"
    justifyContent="center"
    spacing="var(--menu-space-075)"
    useFlexGap
    flexShrink={0}
  >
    {children}
  </Stack>
);

const MenuModeSelectionMarker: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <Box
    component="span"
    className={MENU_MODE_SELECTION_MARKER_CLASS_NAME}
    display="inline-flex"
    alignItems="center"
    justifyContent="center"
    width="var(--menu-size-marker)"
    height="var(--menu-size-marker)"
    flexShrink={0}
  >
    {children}
  </Box>
);

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
    <Stack
      className={MENU_BAR_ROOT_CLASS_NAME}
      style={menuThemeStyle}
      direction="row"
      alignItems="center"
      justifyContent="flex-start"
      minWidth={0}
    >
      <Stack minWidth={0}>
        <Menubar.Root
          className={MENU_ROOT_CLASS_NAME}
          aria-label="ファイル操作メニューバー"
        >
          <Menubar.Menu>
            <Menubar.Trigger
              className={MENU_TRIGGER_CLASS_NAME}
              aria-haspopup="menu"
            >
              作業モード
            </Menubar.Trigger>

            <Menubar.Portal>
              <Menubar.Content
                className={MENU_CONTENT_CLASS_NAME}
                style={menuThemeStyle}
                align="start"
                sideOffset={6}
                aria-label="作業モードメニュー"
              >
                {WORK_MODE_ITEMS.map((modeItem) => {
                  const isSelected = modeItem.value === editMode;

                  return (
                    <Menubar.Item
                      key={modeItem.value}
                      className={MENU_ITEM_CLASS_NAME}
                      onSelect={() => {
                        onEditModeSelect(modeItem.value);
                      }}
                    >
                      <MenuItemContent>
                        <MenuItemLabel>
                          <MenuItemIconSlot>{modeItem.icon}</MenuItemIconSlot>
                          <span className={MENU_ITEM_TEXT_CLASS_NAME}>
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
              className={MENU_TRIGGER_CLASS_NAME}
              aria-haspopup="menu"
            >
              編集
            </Menubar.Trigger>

            <Menubar.Portal>
              <Menubar.Content
                className={MENU_CONTENT_CLASS_NAME}
                style={menuThemeStyle}
                align="start"
                sideOffset={6}
                aria-label="編集メニュー"
              >
                <Menubar.Item
                  className={MENU_ITEM_CLASS_NAME}
                  onSelect={onUndoSelect}
                >
                  <MenuItemContent>
                    <MenuItemLabel>
                      <MenuItemIconSlot>
                        <UndoRoundedIcon fontSize="small" />
                      </MenuItemIconSlot>
                      <span className={MENU_ITEM_TEXT_CLASS_NAME}>
                        アンドゥ
                      </span>
                    </MenuItemLabel>
                    <MenuItemMeta>
                      <span className={MENU_ITEM_SHORTCUT_TEXT_CLASS_NAME}>
                        {shortcutLabels.undo}
                      </span>
                    </MenuItemMeta>
                  </MenuItemContent>
                </Menubar.Item>

                <Menubar.Item
                  className={MENU_ITEM_CLASS_NAME}
                  onSelect={onRedoSelect}
                >
                  <MenuItemContent>
                    <MenuItemLabel>
                      <MenuItemIconSlot>
                        <RedoRoundedIcon fontSize="small" />
                      </MenuItemIconSlot>
                      <span className={MENU_ITEM_TEXT_CLASS_NAME}>リドゥ</span>
                    </MenuItemLabel>
                    <MenuItemMeta>
                      <span className={MENU_ITEM_SHORTCUT_TEXT_CLASS_NAME}>
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
              className={MENU_TRIGGER_CLASS_NAME}
              aria-haspopup="menu"
            >
              ファイル
            </Menubar.Trigger>

            <Menubar.Portal>
              <Menubar.Content
                className={MENU_CONTENT_CLASS_NAME}
                style={menuThemeStyle}
                align="start"
                sideOffset={6}
                aria-label="ファイルメニュー"
              >
                <Menubar.Sub>
                  <Menubar.SubTrigger
                    className={MENU_SUB_TRIGGER_CLASS_NAME}
                    disabled={hasShareActions === false}
                  >
                    <MenuItemContent>
                      <MenuItemLabel>
                        <MenuItemIconSlot>
                          <ShareRoundedIcon fontSize="small" />
                        </MenuItemIconSlot>
                        <span className={MENU_ITEM_TEXT_CLASS_NAME}>共有</span>
                      </MenuItemLabel>
                      <MenuItemMeta>
                        <ChevronRightRoundedIcon fontSize="small" />
                      </MenuItemMeta>
                    </MenuItemContent>
                  </Menubar.SubTrigger>

                  <Menubar.Portal>
                    <Menubar.SubContent
                      className={MENU_CONTENT_CLASS_NAME}
                      style={menuThemeStyle}
                      sideOffset={4}
                      alignOffset={-4}
                      aria-label="共有サブメニュー"
                    >
                      {fileMenuState.shareActions.map((action) => (
                        <Menubar.Item
                          key={action.id}
                          className={MENU_ITEM_CLASS_NAME}
                          onSelect={() => {
                            action.onSelect();
                          }}
                        >
                          <MenuItemContent>
                            <MenuItemLabel>
                              <MenuItemIconSlot>
                                {getShareActionIcon(action.id)}
                              </MenuItemIconSlot>
                              <span className={MENU_ITEM_TEXT_CLASS_NAME}>
                                {action.label}
                              </span>
                            </MenuItemLabel>
                          </MenuItemContent>
                        </Menubar.Item>
                      ))}
                    </Menubar.SubContent>
                  </Menubar.Portal>
                </Menubar.Sub>

                <Menubar.Separator className={MENU_SEPARATOR_CLASS_NAME} />

                <Menubar.Item
                  className={MENU_ITEM_CLASS_NAME}
                  disabled={hasRestoreAction === false}
                  onSelect={handleRestoreSelect}
                >
                  <MenuItemContent>
                    <MenuItemLabel>
                      <MenuItemIconSlot>
                        <FileUploadRoundedIcon fontSize="small" />
                      </MenuItemIconSlot>
                      <span className={MENU_ITEM_TEXT_CLASS_NAME}>復元</span>
                    </MenuItemLabel>
                  </MenuItemContent>
                </Menubar.Item>
              </Menubar.Content>
            </Menubar.Portal>
          </Menubar.Menu>

          <Menubar.Menu>
            <Menubar.Trigger
              className={MENU_TRIGGER_CLASS_NAME}
              aria-haspopup="menu"
            >
              ヘルプ
            </Menubar.Trigger>

            <Menubar.Portal>
              <Menubar.Content
                className={MENU_CONTENT_CLASS_NAME}
                style={menuThemeStyle}
                align="start"
                sideOffset={6}
                aria-label="ヘルプメニュー"
              >
                <Menubar.Item
                  className={MENU_ITEM_CLASS_NAME}
                  disabled={canCheckForUpdates === false}
                  onSelect={handleUpdateCheckSelect}
                >
                  <MenuItemContent>
                    <MenuItemLabel>
                      <MenuItemIconSlot>
                        <UpdateRoundedIcon fontSize="small" />
                      </MenuItemIconSlot>
                      <span className={MENU_ITEM_TEXT_CLASS_NAME}>
                        更新を確認
                      </span>
                    </MenuItemLabel>
                  </MenuItemContent>
                </Menubar.Item>

                <Menubar.Separator className={MENU_SEPARATOR_CLASS_NAME} />

                <Menubar.Item
                  className={MENU_ITEM_CLASS_NAME}
                  onSelect={handleAboutSelect}
                >
                  <MenuItemContent>
                    <MenuItemLabel>
                      <MenuItemIconSlot>
                        <InfoRoundedIcon fontSize="small" />
                      </MenuItemIconSlot>
                      <span className={MENU_ITEM_TEXT_CLASS_NAME}>About</span>
                    </MenuItemLabel>
                  </MenuItemContent>
                </Menubar.Item>
              </Menubar.Content>
            </Menubar.Portal>
          </Menubar.Menu>
        </Menubar.Root>
      </Stack>

      <Dialog
        open={isAboutOpen}
        onClose={handleAboutClose}
        aria-labelledby={aboutDialogTitleId}
      >
        <DialogTitle id={aboutDialogTitleId}>About</DialogTitle>
        <DialogContent>
          <Stack
            style={menuThemeStyle}
            alignItems="center"
            spacing={1}
            useFlexGap
            minWidth="12rem"
            pt={1}
            pb={1}
          >
            <img
              className={MENU_ABOUT_ICON_IMAGE_CLASS_NAME}
              src={aboutIconSrc}
              alt="nesdot icon"
            />
            <span className={MENU_ABOUT_APP_NAME_CLASS_NAME}>nesdot</span>
            <span className={MENU_ABOUT_VERSION_TEXT_CLASS_NAME}>
              {`Version ${appVersion}`}
            </span>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            disabled={canCheckForUpdates === false}
            onClick={handleUpdateCheckSelect}
          >
            更新を確認
          </Button>
          <Button onClick={handleAboutClose} autoFocus>
            閉じる
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};
