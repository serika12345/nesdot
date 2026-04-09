import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import React from "react";
import type { PwaUpdateDialogState } from "../../../../infrastructure/browser/pwaUpdateMonitor";

interface PwaUpdateDialogProps {
  readonly state: PwaUpdateDialogState;
  readonly onDialogClose: () => void;
  readonly onUpdateNow: () => void;
}

const DialogBody = styled("div")(({ theme }) => ({
  display: "grid",
  gap: theme.spacing(1),
}));

const DescriptionText = styled("p")(({ theme }) => ({
  margin: 0,
  color: theme.palette.text.primary,
  fontSize: theme.typography.body2.fontSize,
  lineHeight: theme.typography.body2.lineHeight,
}));

const ErrorMessageText = styled("p")(({ theme }) => ({
  margin: 0,
  color: theme.palette.error.main,
  fontSize: theme.typography.body2.fontSize,
  lineHeight: theme.typography.body2.lineHeight,
}));

const resolveDialogTitle = (state: PwaUpdateDialogState): string => {
  if (state.kind === "available") {
    return "新しい更新を利用できます";
  }

  if (state.kind === "applying") {
    return "更新を適用中";
  }

  if (state.kind === "failed") {
    return "更新に失敗しました";
  }

  return "";
};

const resolveDialogDescription = (state: PwaUpdateDialogState): string => {
  if (state.kind === "available") {
    return "新しいアプリ更新が利用できます。今すぐ更新すると最新状態へ切り替わります。";
  }

  if (state.kind === "applying") {
    return "更新を適用しています。完了すると自動的に再読み込みします。";
  }

  if (state.kind === "failed") {
    return "更新の適用中に問題が発生しました。";
  }

  return "";
};

export const PwaUpdateDialog: React.FC<PwaUpdateDialogProps> = ({
  state,
  onDialogClose,
  onUpdateNow,
}) => {
  const isOpen = state.kind !== "hidden";

  return (
    <Dialog
      open={isOpen}
      onClose={(_event, reason) => {
        if (state.kind === "applying") {
          if (reason === "backdropClick" || reason === "escapeKeyDown") {
            return;
          }
        }

        onDialogClose();
      }}
      disableEscapeKeyDown={state.kind === "applying"}
      aria-labelledby="pwa-update-title"
    >
      <DialogTitle id="pwa-update-title">
        {resolveDialogTitle(state)}
      </DialogTitle>
      <DialogContent>
        <DialogBody>
          <DescriptionText>{resolveDialogDescription(state)}</DescriptionText>

          {state.kind === "applying" ? <LinearProgress /> : <></>}

          {state.kind === "failed" ? (
            <ErrorMessageText>{state.message}</ErrorMessageText>
          ) : (
            <></>
          )}
        </DialogBody>
      </DialogContent>
      <DialogActions>
        {state.kind === "available" ? (
          <>
            <Button onClick={onDialogClose}>あとで</Button>
            <Button variant="contained" onClick={onUpdateNow}>
              今すぐ更新
            </Button>
          </>
        ) : (
          <></>
        )}

        {state.kind === "failed" ? (
          <Button variant="contained" onClick={onDialogClose}>
            閉じる
          </Button>
        ) : (
          <></>
        )}

        {state.kind === "applying" ? (
          <Button variant="contained" disabled>
            更新中...
          </Button>
        ) : (
          <></>
        )}
      </DialogActions>
    </Dialog>
  );
};
