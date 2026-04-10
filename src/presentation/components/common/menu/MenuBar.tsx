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
import { alpha, styled } from "@mui/material/styles";
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

const MenuBarRoot = styled(Stack)(({ theme }) => ({
  width: "100%",
  minWidth: 0,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "flex-start",
  overflowX: "auto",
  overflowY: "hidden",
  borderRadius: theme.shape.borderRadius,
  border: `0.0625rem solid ${alpha(theme.palette.common.white, 0.48)}`,
  background: `linear-gradient(180deg, ${alpha(theme.palette.common.white, 0.96)} 0%, ${alpha(theme.palette.grey[50], 0.88)} 100%)`,
  padding: theme.spacing(0.5),
  minHeight: theme.spacing(6),
  boxShadow: `inset 0 0.0625rem 0 ${alpha(theme.palette.common.white, 0.72)}, ${theme.shadows[3]}`,
  backdropFilter: "blur(1rem)",
}));

const MenuButtons = styled(Stack)(() => ({
  minWidth: 0,
}));

const MenubarRoot = styled(Menubar.Root)(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: theme.spacing(0.25),
  width: "max-content",
  minWidth: 0,
}));

const TriggerItem = styled(Menubar.Trigger)(({ theme }) => ({
  border: `0.0625rem solid ${alpha(theme.palette.primary.main, 0)}`,
  background: "transparent",
  color: theme.palette.text.primary,
  borderRadius: theme.shape.borderRadius,
  fontFamily: theme.typography.fontFamily,
  fontSize: theme.typography.body2.fontSize,
  lineHeight: theme.typography.body2.lineHeight,
  fontWeight: theme.typography.button.fontWeight,
  padding: `${theme.spacing(0.875)} ${theme.spacing(1.25)}`,
  userSelect: "none",
  cursor: "pointer",
  outline: "none",
  transition: theme.transitions.create(
    ["background-color", "border-color", "box-shadow", "color"],
    {
      duration: theme.transitions.duration.shortest,
    },
  ),
  "&:hover": {
    borderColor: alpha(theme.palette.primary.main, 0.12),
    background: alpha(theme.palette.primary.main, 0.06),
  },
  "&[data-state='open']": {
    color: theme.palette.primary.dark,
    borderColor: alpha(theme.palette.primary.main, 0.18),
    background: `linear-gradient(180deg, ${alpha(theme.palette.common.white, 0.9)} 0%, ${alpha(theme.palette.primary.main, 0.14)} 100%)`,
    boxShadow: `0 0.75rem 1.5rem ${alpha(theme.palette.primary.main, 0.16)}`,
  },
  "&:focus-visible": {
    borderColor: alpha(theme.palette.primary.main, 0.28),
    boxShadow: `0 0 0 0.125rem ${alpha(theme.palette.primary.main, 0.18)}`,
  },
}));

const FileMenuContent = styled(Menubar.Content)(({ theme }) => ({
  minWidth: "15rem",
  borderRadius: theme.shape.borderRadius,
  border: `0.0625rem solid ${alpha(theme.palette.divider, 0.95)}`,
  background: `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.98)} 0%, ${alpha(theme.palette.grey[50], 0.96)} 100%)`,
  boxShadow: `0 1.5rem 3rem ${alpha(theme.palette.common.black, 0.18)}`,
  padding: theme.spacing(0.75),
  zIndex: theme.zIndex.modal + 1,
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(0.25),
  backdropFilter: "blur(1rem)",
}));

const ShareSubContent = styled(Menubar.SubContent)(({ theme }) => ({
  minWidth: "15rem",
  borderRadius: theme.shape.borderRadius,
  border: `0.0625rem solid ${alpha(theme.palette.divider, 0.95)}`,
  background: `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.98)} 0%, ${alpha(theme.palette.grey[50], 0.96)} 100%)`,
  boxShadow: `0 1.5rem 3rem ${alpha(theme.palette.common.black, 0.18)}`,
  padding: theme.spacing(0.75),
  zIndex: theme.zIndex.modal + 1,
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(0.25),
  backdropFilter: "blur(1rem)",
}));

const MenuSeparator = styled(Menubar.Separator)(({ theme }) => ({
  height: "0.0625rem",
  margin: `${theme.spacing(0.5)} ${theme.spacing(0.25)}`,
  background: alpha(theme.palette.divider, 0.96),
}));

const FileMenuItem = styled(Menubar.Item)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  minHeight: theme.spacing(5),
  padding: `${theme.spacing(0.75)} ${theme.spacing(1)}`,
  fontSize: theme.typography.body2.fontSize,
  lineHeight: theme.typography.body2.lineHeight,
  color: theme.palette.text.primary,
  outline: "none",
  userSelect: "none",
  cursor: "pointer",
  transition: theme.transitions.create(["background-color", "color"], {
    duration: theme.transitions.duration.shortest,
  }),
  "&[data-highlighted]": {
    background: alpha(theme.palette.primary.main, 0.12),
    color: theme.palette.primary.dark,
  },
  "&[data-disabled]": {
    color: theme.palette.text.secondary,
    opacity: 0.56,
    cursor: "not-allowed",
  },
}));

const FileMenuSubTrigger = styled(Menubar.SubTrigger)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  minHeight: theme.spacing(5),
  padding: `${theme.spacing(0.75)} ${theme.spacing(1)}`,
  fontSize: theme.typography.body2.fontSize,
  lineHeight: theme.typography.body2.lineHeight,
  color: theme.palette.text.primary,
  outline: "none",
  userSelect: "none",
  cursor: "pointer",
  transition: theme.transitions.create(["background-color", "color"], {
    duration: theme.transitions.duration.shortest,
  }),
  "&[data-highlighted], &[data-state='open']": {
    background: alpha(theme.palette.primary.main, 0.12),
    color: theme.palette.primary.dark,
  },
  "&[data-disabled]": {
    color: theme.palette.text.secondary,
    opacity: 0.56,
    cursor: "not-allowed",
  },
  display: "block",
}));

const MenuItemContentLayout = styled(Stack)(({ theme }) => ({
  width: "100%",
  minWidth: 0,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(1),
}));

const MenuItemLabelLayout = styled(Stack)(({ theme }) => ({
  minWidth: 0,
  flex: "1 1 auto",
  flexDirection: "row",
  alignItems: "center",
  gap: theme.spacing(1),
}));

const MenuItemIconSlot = styled("span")(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: theme.spacing(2.5),
  height: theme.spacing(2.5),
  flexShrink: 0,
  color: "currentColor",
  opacity: 0.78,
}));

const MenuItemText = styled("span")({
  minWidth: 0,
  flex: "1 1 auto",
});

const MenuItemMeta = styled("span")(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: theme.spacing(0.75),
  flexShrink: 0,
  color: "currentColor",
  opacity: 0.72,
}));

const ModeSelectionMarker = styled("span")(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: theme.spacing(2),
  height: theme.spacing(2),
  flexShrink: 0,
}));

const MenuItemShortcutText = styled("span")(({ theme }) => ({
  fontSize: theme.typography.caption.fontSize,
  lineHeight: theme.typography.caption.lineHeight,
  whiteSpace: "nowrap",
  fontVariantNumeric: "tabular-nums",
}));

const AboutContentLayout = styled(Stack)(({ theme }) => ({
  minWidth: "12rem",
  alignItems: "center",
  gap: theme.spacing(1),
  paddingTop: theme.spacing(1),
  paddingBottom: theme.spacing(1),
}));

const AboutIconImage = styled("img")(({ theme }) => ({
  width: "4.5rem",
  height: "4.5rem",
  borderRadius: theme.shape.borderRadius,
}));

const AboutAppName = styled("span")(({ theme }) => ({
  fontSize: theme.typography.subtitle1.fontSize,
  fontWeight: 700,
  lineHeight: theme.typography.subtitle1.lineHeight,
  color: theme.palette.text.primary,
}));

const AboutVersionText = styled("span")(({ theme }) => ({
  fontSize: theme.typography.body2.fontSize,
  lineHeight: theme.typography.body2.lineHeight,
  color: theme.palette.text.secondary,
}));

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
    <MenuBarRoot>
      <MenuButtons>
        <MenubarRoot aria-label="ファイル操作メニューバー">
          <Menubar.Menu>
            <TriggerItem aria-haspopup="menu">作業モード</TriggerItem>

            <Menubar.Portal>
              <FileMenuContent
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
          <AboutContentLayout>
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
