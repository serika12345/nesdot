import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Grid from "@mui/material/Grid";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React from "react";
import type { DesktopAutoUpdateDialogState } from "../../../../infrastructure/browser/useDesktopAutoUpdate";

interface DesktopAutoUpdateDialogProps {
  readonly state: DesktopAutoUpdateDialogState;
  readonly progressPercent: O.Option<number>;
  readonly onDialogClose: () => void;
  readonly onUpdateNow: () => void;
  readonly onRestartNow: () => void;
}

const failureDetailLabelStyle: React.CSSProperties = {
  margin: 0,
  fontWeight: 500,
};

const failureDetailValueStyle: React.CSSProperties = {
  margin: 0,
  overflowWrap: "anywhere",
  whiteSpace: "pre-wrap",
};

const resolveDialogTitle = (state: DesktopAutoUpdateDialogState): string => {
  if (state.kind === "checking") {
    return "更新を確認中";
  }

  if (state.kind === "available") {
    return "新しい更新を利用できます";
  }

  if (state.kind === "downloading") {
    return "アップデートをダウンロード中";
  }

  if (state.kind === "ready") {
    return "アップデートの準備が完了しました";
  }

  if (state.kind === "up-to-date") {
    return "最新の状態です";
  }

  if (state.kind === "failed") {
    return "アップデートに失敗しました";
  }

  return "";
};

const resolveDialogDescription = (
  state: DesktopAutoUpdateDialogState,
): string => {
  if (state.kind === "checking") {
    return "更新サーバーへ問い合わせています。しばらくお待ちください。";
  }

  if (state.kind === "available") {
    return `バージョン ${state.version} を利用できます。今すぐダウンロードして更新しますか？`;
  }

  if (state.kind === "downloading") {
    return `バージョン ${state.version} をダウンロードしています。`;
  }

  if (state.kind === "ready") {
    return `バージョン ${state.version} の適用準備が完了しました。今すぐ再起動すると更新版で起動します。`;
  }

  if (state.kind === "up-to-date") {
    return "利用可能な更新は見つかりませんでした。";
  }

  if (state.kind === "failed") {
    return state.message;
  }

  return "";
};

const resolveProgressText = (progressPercent: O.Option<number>): string => {
  return pipe(
    progressPercent,
    O.match(
      () => "ダウンロードサイズを取得しています...",
      (percent) => `${percent}%`,
    ),
  );
};

const renderProgressBar = (
  progressPercent: O.Option<number>,
): React.ReactElement => {
  return pipe(
    progressPercent,
    O.match(
      () => <LinearProgress />,
      (percent) => <LinearProgress variant="determinate" value={percent} />,
    ),
  );
};

export const DesktopAutoUpdateDialog: React.FC<
  DesktopAutoUpdateDialogProps
> = ({ state, progressPercent, onDialogClose, onRestartNow, onUpdateNow }) => {
  const isOpen = state.kind !== "hidden";

  return (
    <Dialog
      open={isOpen}
      onClose={(_event, reason) => {
        if (state.kind === "checking" || state.kind === "downloading") {
          if (reason === "backdropClick" || reason === "escapeKeyDown") {
            return;
          }
        }

        onDialogClose();
      }}
      disableEscapeKeyDown={
        state.kind === "checking" || state.kind === "downloading"
      }
      aria-labelledby="desktop-auto-update-title"
    >
      <DialogTitle id="desktop-auto-update-title">
        {resolveDialogTitle(state)}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={1}>
          <Typography component="p" variant="body2" color="text.primary">
            {resolveDialogDescription(state)}
          </Typography>

          {state.kind === "checking" ? (
            <Stack spacing={0.5}>
              <LinearProgress />
            </Stack>
          ) : (
            <></>
          )}

          {state.kind === "downloading" ? (
            <Stack spacing={0.5}>
              {renderProgressBar(progressPercent)}
              <Typography variant="caption" color="text.secondary">
                {resolveProgressText(progressPercent)}
              </Typography>
            </Stack>
          ) : (
            <></>
          )}

          {state.kind === "failed" ? (
            <Grid
              container
              component="dl"
              alignItems="start"
              rowGap={0.5}
              columnGap={1.5}
              m={0}
            >
              <Grid size="auto">
                <Typography
                  component="dt"
                  variant="caption"
                  color="text.secondary"
                  style={failureDetailLabelStyle}
                >
                  対象バージョン
                </Typography>
              </Grid>
              <Grid size="grow">
                <Typography
                  component="dd"
                  variant="body2"
                  color="text.primary"
                  style={failureDetailValueStyle}
                >
                  {state.versionLabel}
                </Typography>
              </Grid>
              <Grid size="auto">
                <Typography
                  component="dt"
                  variant="caption"
                  color="text.secondary"
                  style={failureDetailLabelStyle}
                >
                  処理段階
                </Typography>
              </Grid>
              <Grid size="grow">
                <Typography
                  component="dd"
                  variant="body2"
                  color="text.primary"
                  style={failureDetailValueStyle}
                >
                  {state.operationLabel}
                </Typography>
              </Grid>
              <Grid size="auto">
                <Typography
                  component="dt"
                  variant="caption"
                  color="text.secondary"
                  style={failureDetailLabelStyle}
                >
                  技術詳細
                </Typography>
              </Grid>
              <Grid size="grow">
                <Typography
                  component="dd"
                  variant="body2"
                  color="text.primary"
                  style={failureDetailValueStyle}
                >
                  {state.detail}
                </Typography>
              </Grid>
              <Grid size="auto">
                <Typography
                  component="dt"
                  variant="caption"
                  color="text.secondary"
                  style={failureDetailLabelStyle}
                >
                  対処
                </Typography>
              </Grid>
              <Grid size="grow">
                <Typography
                  component="dd"
                  variant="body2"
                  color="text.primary"
                  style={failureDetailValueStyle}
                >
                  {state.recoveryHint}
                </Typography>
              </Grid>
            </Grid>
          ) : (
            <></>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        {state.kind === "checking" ? (
          <Button variant="contained" disabled>
            確認中...
          </Button>
        ) : (
          <></>
        )}

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

        {state.kind === "ready" ? (
          <>
            <Button onClick={onDialogClose}>あとで</Button>
            <Button variant="contained" onClick={onRestartNow}>
              今すぐ再起動
            </Button>
          </>
        ) : (
          <></>
        )}

        {state.kind === "up-to-date" ? (
          <Button variant="contained" onClick={onDialogClose}>
            閉じる
          </Button>
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

        {state.kind === "downloading" ? (
          <Button variant="contained" disabled>
            ダウンロード中...
          </Button>
        ) : (
          <></>
        )}
      </DialogActions>
    </Dialog>
  );
};
