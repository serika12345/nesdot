import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import React from "react";
import type { PwaUpdateDialogState } from "../../../../infrastructure/browser/pwaUpdateMonitor";

interface PwaUpdateDialogProps {
  readonly state: PwaUpdateDialogState;
  readonly onDialogClose: () => void;
  readonly onUpdateNow: () => void;
}

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
        <Stack spacing={1}>
          <Typography component="p" variant="body2" color="text.primary">
            {resolveDialogDescription(state)}
          </Typography>

          {state.kind === "applying" ? <LinearProgress /> : <></>}

          {state.kind === "failed" ? (
            <Typography component="p" variant="body2" color="error.main">
              {state.message}
            </Typography>
          ) : (
            <></>
          )}
        </Stack>
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
