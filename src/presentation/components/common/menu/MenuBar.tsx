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
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
} from "@mui/material";
import { alpha, styled, type Theme, useTheme } from "@mui/material/styles";
import * as Menubar from "@radix-ui/react-menubar";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React from "react";
import {
  canRequestAvailableUpdateCheck,
  requestAvailableUpdateCheck,
} from "../../../../infrastructure/browser/updateCheck";
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

const MenuBarRoot = styled(Stack)({
  width: "100%",
  minWidth: 0,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "flex-start",
  overflowX: "auto",
  overflowY: "hidden",
  borderRadius: "var(--menu-radius)",
  border: "0.0625rem solid var(--menu-border-root)",
  background:
    "linear-gradient(180deg, var(--menu-bg-root-top) 0%, var(--menu-bg-root-bottom) 100%)",
  padding: "var(--menu-space-05)",
  minHeight: "var(--menu-size-root-height)",
  boxShadow: "var(--menu-shadow-root)",
  backdropFilter: "blur(1rem)",
});

const MenuButtons = styled(Stack)({
  minWidth: 0,
});

const MenubarRoot = styled(Menubar.Root)({
  display: "inline-flex",
  alignItems: "center",
  gap: "var(--menu-space-025)",
  width: "max-content",
  minWidth: 0,
});

const TriggerItem = styled(Menubar.Trigger)({
  border: "0.0625rem solid var(--menu-border-transparent)",
  background: "transparent",
  color: "var(--menu-color-text-primary)",
  borderRadius: "var(--menu-radius)",
  fontFamily: "var(--menu-font-family)",
  fontSize: "var(--menu-font-size-body2)",
  lineHeight: "var(--menu-line-height-body2)",
  fontWeight: "var(--menu-font-weight-button)",
  padding: "var(--menu-space-0875) var(--menu-space-125)",
  userSelect: "none",
  cursor: "pointer",
  outline: "none",
  transition:
    "background-color var(--menu-transition-shortest) ease, border-color var(--menu-transition-shortest) ease, box-shadow var(--menu-transition-shortest) ease, color var(--menu-transition-shortest) ease",
  "&:hover": {
    borderColor: "var(--menu-border-hover)",
    background: "var(--menu-bg-hover)",
  },
  "&[data-state='open']": {
    color: "var(--menu-color-primary-dark)",
    borderColor: "var(--menu-border-open)",
    background:
      "linear-gradient(180deg, var(--menu-bg-root-top) 0%, var(--menu-bg-open) 100%)",
    boxShadow: "var(--menu-shadow-open)",
  },
  "&:focus-visible": {
    borderColor: "var(--menu-border-focus)",
    boxShadow: "0 0 0 0.125rem var(--menu-color-focus-ring)",
  },
});

const FileMenuContent = styled(Menubar.Content)({
  minWidth: "15rem",
  borderRadius: "var(--menu-radius)",
  border: "0.0625rem solid var(--menu-border-surface)",
  background:
    "linear-gradient(180deg, var(--menu-bg-surface-top) 0%, var(--menu-bg-surface-bottom) 100%)",
  boxShadow: "var(--menu-shadow-surface)",
  padding: "var(--menu-space-075)",
  zIndex: "var(--menu-z-index)",
  display: "flex",
  flexDirection: "column",
  gap: "var(--menu-space-025)",
  backdropFilter: "blur(1rem)",
});

const ShareSubContent = styled(Menubar.SubContent)({
  minWidth: "15rem",
  borderRadius: "var(--menu-radius)",
  border: "0.0625rem solid var(--menu-border-surface)",
  background:
    "linear-gradient(180deg, var(--menu-bg-surface-top) 0%, var(--menu-bg-surface-bottom) 100%)",
  boxShadow: "var(--menu-shadow-surface)",
  padding: "var(--menu-space-075)",
  zIndex: "var(--menu-z-index)",
  display: "flex",
  flexDirection: "column",
  gap: "var(--menu-space-025)",
  backdropFilter: "blur(1rem)",
});

const MenuSeparator = styled(Menubar.Separator)({
  height: "0.0625rem",
  margin: "var(--menu-space-05) var(--menu-space-025)",
  background: "var(--menu-border-divider)",
});

const FileMenuItem = styled(Menubar.Item)({
  borderRadius: "var(--menu-radius)",
  minHeight: "var(--menu-size-item-height)",
  padding: "var(--menu-space-075) var(--menu-space-1)",
  fontSize: "var(--menu-font-size-body2)",
  lineHeight: "var(--menu-line-height-body2)",
  color: "var(--menu-color-text-primary)",
  outline: "none",
  userSelect: "none",
  cursor: "pointer",
  transition:
    "background-color var(--menu-transition-shortest) ease, color var(--menu-transition-shortest) ease",
  "&[data-highlighted]": {
    background: "var(--menu-bg-highlight)",
    color: "var(--menu-color-primary-dark)",
  },
  "&[data-disabled]": {
    color: "var(--menu-color-text-secondary)",
    opacity: 0.56,
    cursor: "not-allowed",
  },
});

const FileMenuSubTrigger = styled(Menubar.SubTrigger)({
  borderRadius: "var(--menu-radius)",
  minHeight: "var(--menu-size-item-height)",
  padding: "var(--menu-space-075) var(--menu-space-1)",
  fontSize: "var(--menu-font-size-body2)",
  lineHeight: "var(--menu-line-height-body2)",
  color: "var(--menu-color-text-primary)",
  outline: "none",
  userSelect: "none",
  cursor: "pointer",
  transition:
    "background-color var(--menu-transition-shortest) ease, color var(--menu-transition-shortest) ease",
  "&[data-highlighted], &[data-state='open']": {
    background: "var(--menu-bg-highlight)",
    color: "var(--menu-color-primary-dark)",
  },
  "&[data-disabled]": {
    color: "var(--menu-color-text-secondary)",
    opacity: 0.56,
    cursor: "not-allowed",
  },
  display: "block",
});

const MenuItemContentLayout = styled(Stack)({
  width: "100%",
  minWidth: 0,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "var(--menu-space-1)",
});

const MenuItemLabelLayout = styled(Stack)({
  minWidth: 0,
  flex: "1 1 auto",
  flexDirection: "row",
  alignItems: "center",
  gap: "var(--menu-space-1)",
});

const MenuItemIconSlot = styled("span")({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "var(--menu-size-icon-slot)",
  height: "var(--menu-size-icon-slot)",
  flexShrink: 0,
  color: "currentColor",
  opacity: 0.78,
});

const MenuItemText = styled("span")({
  minWidth: 0,
  flex: "1 1 auto",
});

const MenuItemMeta = styled("span")({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "var(--menu-space-075)",
  flexShrink: 0,
  color: "currentColor",
  opacity: 0.72,
});

const ModeSelectionMarker = styled("span")({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "var(--menu-size-marker)",
  height: "var(--menu-size-marker)",
  flexShrink: 0,
});

const MenuItemShortcutText = styled("span")({
  fontSize: "var(--menu-font-size-caption)",
  lineHeight: "var(--menu-line-height-caption)",
  whiteSpace: "nowrap",
  fontVariantNumeric: "tabular-nums",
});

const AboutContentLayout = styled(Stack)({
  minWidth: "12rem",
  alignItems: "center",
  gap: "var(--menu-space-1)",
  paddingTop: "var(--menu-space-1)",
  paddingBottom: "var(--menu-space-1)",
});

const AboutIconImage = styled("img")({
  width: "4.5rem",
  height: "4.5rem",
  borderRadius: "var(--menu-radius)",
});

const AboutAppName = styled("span")({
  fontSize: "var(--menu-font-size-subtitle1)",
  fontWeight: 700,
  lineHeight: "var(--menu-line-height-subtitle1)",
  color: "var(--menu-color-text-primary)",
});

const AboutVersionText = styled("span")({
  fontSize: "var(--menu-font-size-body2)",
  lineHeight: "var(--menu-line-height-body2)",
  color: "var(--menu-color-text-secondary)",
});

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
  const appVersion = import.meta.env.VITE_APP_VERSION;
  const aboutIconSrc = `${import.meta.env.BASE_URL}pwa-192x192.png`;
  const aboutDialogTitleId = React.useId();
  const [isAboutOpen, setIsAboutOpen] = React.useState(false);
  const menuThemeStyle = React.useMemo(
    () => createMenuThemeStyle(theme),
    [theme],
  );
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
    <MenuBarRoot style={menuThemeStyle}>
      <MenuButtons>
        <MenubarRoot aria-label="ファイル操作メニューバー">
          <Menubar.Menu>
            <TriggerItem aria-haspopup="menu">作業モード</TriggerItem>

            <Menubar.Portal>
              <FileMenuContent
                style={menuThemeStyle}
                align="start"
                sideOffset={6}
                aria-label="作業モードメニュー"
              >
                {WORK_MODE_ITEMS.map((modeItem) => {
                  const isSelected = modeItem.value === editMode;

                  return (
                    <FileMenuItem
                      key={modeItem.value}
                      onSelect={() => {
                        onEditModeSelect(modeItem.value);
                      }}
                    >
                      <MenuItemContentLayout>
                        <MenuItemLabelLayout>
                          <MenuItemIconSlot>{modeItem.icon}</MenuItemIconSlot>
                          <MenuItemText>{modeItem.label}</MenuItemText>
                        </MenuItemLabelLayout>
                        <MenuItemMeta>
                          <ModeSelectionMarker>
                            {isSelected === true ? (
                              <CheckRoundedIcon fontSize="small" />
                            ) : (
                              <></>
                            )}
                          </ModeSelectionMarker>
                        </MenuItemMeta>
                      </MenuItemContentLayout>
                    </FileMenuItem>
                  );
                })}
              </FileMenuContent>
            </Menubar.Portal>
          </Menubar.Menu>

          <Menubar.Menu>
            <TriggerItem aria-haspopup="menu">編集</TriggerItem>

            <Menubar.Portal>
              <FileMenuContent
                style={menuThemeStyle}
                align="start"
                sideOffset={6}
                aria-label="編集メニュー"
              >
                <FileMenuItem onSelect={onUndoSelect}>
                  <MenuItemContentLayout>
                    <MenuItemLabelLayout>
                      <MenuItemIconSlot>
                        <UndoRoundedIcon fontSize="small" />
                      </MenuItemIconSlot>
                      <MenuItemText>アンドゥ</MenuItemText>
                    </MenuItemLabelLayout>
                    <MenuItemMeta>
                      <MenuItemShortcutText>
                        {shortcutLabels.undo}
                      </MenuItemShortcutText>
                    </MenuItemMeta>
                  </MenuItemContentLayout>
                </FileMenuItem>
                <FileMenuItem onSelect={onRedoSelect}>
                  <MenuItemContentLayout>
                    <MenuItemLabelLayout>
                      <MenuItemIconSlot>
                        <RedoRoundedIcon fontSize="small" />
                      </MenuItemIconSlot>
                      <MenuItemText>リドゥ</MenuItemText>
                    </MenuItemLabelLayout>
                    <MenuItemMeta>
                      <MenuItemShortcutText>
                        {shortcutLabels.redo}
                      </MenuItemShortcutText>
                    </MenuItemMeta>
                  </MenuItemContentLayout>
                </FileMenuItem>
              </FileMenuContent>
            </Menubar.Portal>
          </Menubar.Menu>

          <Menubar.Menu>
            <TriggerItem aria-haspopup="menu">ファイル</TriggerItem>

            <Menubar.Portal>
              <FileMenuContent
                style={menuThemeStyle}
                align="start"
                sideOffset={6}
                aria-label="ファイルメニュー"
              >
                <Menubar.Sub>
                  <FileMenuSubTrigger disabled={hasShareActions === false}>
                    <MenuItemContentLayout>
                      <MenuItemLabelLayout>
                        <MenuItemIconSlot>
                          <ShareRoundedIcon fontSize="small" />
                        </MenuItemIconSlot>
                        <MenuItemText>共有</MenuItemText>
                      </MenuItemLabelLayout>
                      <MenuItemMeta>
                        <ChevronRightRoundedIcon fontSize="small" />
                      </MenuItemMeta>
                    </MenuItemContentLayout>
                  </FileMenuSubTrigger>

                  <Menubar.Portal>
                    <ShareSubContent
                      style={menuThemeStyle}
                      sideOffset={4}
                      alignOffset={-4}
                      aria-label="共有サブメニュー"
                    >
                      {fileMenuState.shareActions.map((action) => (
                        <FileMenuItem
                          key={action.id}
                          onSelect={() => {
                            action.onSelect();
                          }}
                        >
                          <MenuItemContentLayout>
                            <MenuItemLabelLayout>
                              <MenuItemIconSlot>
                                {getShareActionIcon(action.id)}
                              </MenuItemIconSlot>
                              <MenuItemText>{action.label}</MenuItemText>
                            </MenuItemLabelLayout>
                          </MenuItemContentLayout>
                        </FileMenuItem>
                      ))}
                    </ShareSubContent>
                  </Menubar.Portal>
                </Menubar.Sub>

                <MenuSeparator />

                <FileMenuItem
                  disabled={hasRestoreAction === false}
                  onSelect={handleRestoreSelect}
                >
                  <MenuItemContentLayout>
                    <MenuItemLabelLayout>
                      <MenuItemIconSlot>
                        <FileUploadRoundedIcon fontSize="small" />
                      </MenuItemIconSlot>
                      <MenuItemText>復元</MenuItemText>
                    </MenuItemLabelLayout>
                  </MenuItemContentLayout>
                </FileMenuItem>
              </FileMenuContent>
            </Menubar.Portal>
          </Menubar.Menu>

          <Menubar.Menu>
            <TriggerItem aria-haspopup="menu">ヘルプ</TriggerItem>

            <Menubar.Portal>
              <FileMenuContent
                style={menuThemeStyle}
                align="start"
                sideOffset={6}
                aria-label="ヘルプメニュー"
              >
                <FileMenuItem
                  disabled={canCheckForUpdates === false}
                  onSelect={handleUpdateCheckSelect}
                >
                  <MenuItemContentLayout>
                    <MenuItemLabelLayout>
                      <MenuItemIconSlot>
                        <UpdateRoundedIcon fontSize="small" />
                      </MenuItemIconSlot>
                      <MenuItemText>更新を確認</MenuItemText>
                    </MenuItemLabelLayout>
                  </MenuItemContentLayout>
                </FileMenuItem>

                <MenuSeparator />

                <FileMenuItem onSelect={handleAboutSelect}>
                  <MenuItemContentLayout>
                    <MenuItemLabelLayout>
                      <MenuItemIconSlot>
                        <InfoRoundedIcon fontSize="small" />
                      </MenuItemIconSlot>
                      <MenuItemText>About</MenuItemText>
                    </MenuItemLabelLayout>
                  </MenuItemContentLayout>
                </FileMenuItem>
              </FileMenuContent>
            </Menubar.Portal>
          </Menubar.Menu>
        </MenubarRoot>
      </MenuButtons>

      <Dialog
        open={isAboutOpen}
        onClose={handleAboutClose}
        aria-labelledby={aboutDialogTitleId}
      >
        <DialogTitle id={aboutDialogTitleId}>About</DialogTitle>
        <DialogContent>
          <AboutContentLayout style={menuThemeStyle}>
            <AboutIconImage src={aboutIconSrc} alt="nesdot icon" />
            <AboutAppName>nesdot</AboutAppName>
            <AboutVersionText>{`Version ${appVersion}`}</AboutVersionText>
          </AboutContentLayout>
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
    </MenuBarRoot>
  );
};
