import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
} from "@mui/material";
import { styled } from "@mui/material/styles";
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

const FailureDetailsGrid = styled("dl")(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "max-content minmax(0, 1fr)",
  gap: theme.spacing(0.5, 1.5),
  margin: 0,
}));

const FailureDetailLabel = styled("dt")(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: theme.typography.caption.fontSize,
  fontWeight: theme.typography.fontWeightMedium,
  lineHeight: theme.typography.caption.lineHeight,
  margin: 0,
}));

const FailureDetailValue = styled("dd")(({ theme }) => ({
  color: theme.palette.text.primary,
  fontSize: theme.typography.body2.fontSize,
  lineHeight: theme.typography.body2.lineHeight,
  margin: 0,
  overflowWrap: "anywhere",
  whiteSpace: "pre-wrap",
}));

const DownloadProgressSection = styled("div")(({ theme }) => ({
  display: "grid",
  gap: theme.spacing(0.5),
}));

const ProgressMetaText = styled("span")(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: theme.typography.caption.fontSize,
  lineHeight: theme.typography.caption.lineHeight,
}));

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
        <DialogBody>
          <DescriptionText>{resolveDialogDescription(state)}</DescriptionText>

          {state.kind === "checking" ? (
            <DownloadProgressSection>
              <LinearProgress />
            </DownloadProgressSection>
          ) : (
            <></>
          )}

          {state.kind === "downloading" ? (
            <DownloadProgressSection>
              {renderProgressBar(progressPercent)}
              <ProgressMetaText>
                {resolveProgressText(progressPercent)}
              </ProgressMetaText>
            </DownloadProgressSection>
          ) : (
            <></>
          )}

          {state.kind === "failed" ? (
            <FailureDetailsGrid>
              <FailureDetailLabel>対象バージョン</FailureDetailLabel>
              <FailureDetailValue>{state.versionLabel}</FailureDetailValue>
              <FailureDetailLabel>処理段階</FailureDetailLabel>
              <FailureDetailValue>{state.operationLabel}</FailureDetailValue>
              <FailureDetailLabel>技術詳細</FailureDetailLabel>
              <FailureDetailValue>{state.detail}</FailureDetailValue>
              <FailureDetailLabel>対処</FailureDetailLabel>
              <FailureDetailValue>{state.recoveryHint}</FailureDetailValue>
            </FailureDetailsGrid>
          ) : (
            <></>
          )}
        </DialogBody>
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
