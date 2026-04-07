import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import * as Menubar from "@radix-ui/react-menubar";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React from "react";
import { type FileMenuState } from "./fileMenuState";

export type WorkMode = "screen" | "sprite" | "character";

interface FileMenuBarProps {
  fileMenuState: FileMenuState;
  editMode: WorkMode;
  onEditModeSelect: (mode: WorkMode) => void;
  hidden?: boolean;
}

const WORK_MODE_ITEMS: ReadonlyArray<{
  value: WorkMode;
  label: string;
}> = [
  {
    value: "sprite",
    label: "スプライト編集",
  },
  {
    value: "character",
    label: "キャラクター編集",
  },
  {
    value: "screen",
    label: "画面配置",
  },
];

const MenuBarRoot = styled(Stack)(({ theme }) => ({
  width: "100%",
  minWidth: 0,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "flex-start",
  borderRadius: "0.375rem",
  border: `0.0625rem solid ${theme.palette.divider}`,
  background: theme.palette.grey[100],
  padding: theme.spacing(0.25),
  minHeight: "2rem",
}));

const MenuButtons = styled(Stack)({
  flexDirection: "row",
  alignItems: "center",
  gap: 0,
  minWidth: 0,
});

const MenubarRoot = styled(Menubar.Root)({
  display: "inline-flex",
  alignItems: "center",
  minWidth: 0,
});

const TriggerItem = styled(Menubar.Trigger)(({ theme }) => ({
  border: 0,
  background: "transparent",
  color: theme.palette.text.primary,
  borderRadius: "0.25rem",
  fontFamily: theme.typography.fontFamily,
  fontSize: "0.8125rem",
  lineHeight: 1,
  fontWeight: 500,
  padding: "0.375rem 0.625rem",
  userSelect: "none",
  cursor: "default",
  outline: "none",
  "&[data-highlighted], &[data-state='open']": {
    background: theme.palette.action.hover,
  },
  "&:focus-visible": {
    boxShadow: `inset 0 0 0 0.0625rem ${theme.palette.primary.main}`,
  },
}));

const FileMenuContent = styled(Menubar.Content)(({ theme }) => ({
  minWidth: "12rem",
  borderRadius: "0.375rem",
  border: `0.0625rem solid ${theme.palette.divider}`,
  background: theme.palette.background.paper,
  boxShadow: theme.shadows[8],
  padding: "0.25rem",
  zIndex: theme.zIndex.modal + 1,
}));

const ShareSubContent = styled(Menubar.SubContent)(({ theme }) => ({
  minWidth: "12rem",
  borderRadius: "0.375rem",
  border: `0.0625rem solid ${theme.palette.divider}`,
  background: theme.palette.background.paper,
  boxShadow: theme.shadows[8],
  padding: "0.25rem",
  zIndex: theme.zIndex.modal + 1,
}));

const FileMenuItem = styled(Menubar.Item)(({ theme }) => ({
  borderRadius: "0.25rem",
  minHeight: "1.75rem",
  padding: "0.375rem 0.625rem",
  fontSize: "0.8125rem",
  lineHeight: 1.3,
  color: theme.palette.text.primary,
  outline: "none",
  userSelect: "none",
  cursor: "default",
  "&[data-highlighted]": {
    background: theme.palette.action.hover,
  },
  "&[data-disabled]": {
    color: theme.palette.text.secondary,
    opacity: 0.56,
    cursor: "not-allowed",
  },
}));

const FileMenuSubTrigger = styled(Menubar.SubTrigger)(({ theme }) => ({
  borderRadius: "0.25rem",
  minHeight: "1.75rem",
  padding: "0.375rem 0.625rem",
  fontSize: "0.8125rem",
  lineHeight: 1.3,
  color: theme.palette.text.primary,
  outline: "none",
  userSelect: "none",
  cursor: "default",
  "&[data-highlighted]": {
    background: theme.palette.action.hover,
  },
  "&[data-disabled]": {
    color: theme.palette.text.secondary,
    opacity: 0.56,
    cursor: "not-allowed",
  },
  display: "block",
}));

const SubmenuItemLayout = styled(Stack)(({ theme }) => ({
  width: "100%",
  minWidth: 0,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(1),
}));

const ModeMenuItemLayout = styled(Stack)(({ theme }) => ({
  width: "100%",
  minWidth: 0,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(1),
}));

const ModeSelectionMarker = styled("span")({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "1rem",
  height: "1rem",
  flexShrink: 0,
});

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

export const FileMenuBar: React.FC<FileMenuBarProps> = ({
  fileMenuState,
  editMode,
  onEditModeSelect,
  hidden = false,
}) => {
  const appVersion = import.meta.env.VITE_APP_VERSION;
  const aboutDialogTitleId = React.useId();
  const [isAboutOpen, setIsAboutOpen] = React.useState(false);
  const hasShareActions = fileMenuState.shareActions.length > 0;
  const hasRestoreAction = O.isSome(fileMenuState.restoreAction);

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

  if (hidden === true) {
    return <></>;
  }

  return (
    <MenuBarRoot role="toolbar" aria-label="ファイル操作メニューバー">
      <MenuButtons>
        <MenubarRoot>
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
                      <ModeMenuItemLayout>
                        <span>{modeItem.label}</span>
                        <ModeSelectionMarker>
                          {isSelected === true ? (
                            <CheckRoundedIcon fontSize="small" />
                          ) : (
                            <></>
                          )}
                        </ModeSelectionMarker>
                      </ModeMenuItemLayout>
                    </FileMenuItem>
                  );
                })}
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
                    <SubmenuItemLayout>
                      <span>共有</span>
                      <ChevronRightRoundedIcon fontSize="small" />
                    </SubmenuItemLayout>
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
                          {action.label}
                        </FileMenuItem>
                      ))}
                    </ShareSubContent>
                  </Menubar.Portal>
                </Menubar.Sub>

                <FileMenuItem
                  disabled={hasRestoreAction === false}
                  onSelect={handleRestoreSelect}
                >
                  復元
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
                <FileMenuItem onSelect={handleAboutSelect}>About</FileMenuItem>
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
            <AboutIconImage src="/pwa-192x192.png" alt="nesdot icon" />
            <AboutAppName>nesdot</AboutAppName>
            <AboutVersionText>{`Version ${appVersion}`}</AboutVersionText>
          </AboutContentLayout>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAboutClose} autoFocus>
            閉じる
          </Button>
        </DialogActions>
      </Dialog>
    </MenuBarRoot>
  );
};
