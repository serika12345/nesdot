import { Button, Dialog, Progress } from "@radix-ui/themes";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React from "react";
import type { DesktopAutoUpdateDialogState } from "../../../../../infrastructure/browser/useDesktopAutoUpdate";
import styles from "./UpdateDialogs.module.css";

interface DesktopAutoUpdateDialogProps {
  readonly state: DesktopAutoUpdateDialogState;
  readonly progressPercent: O.Option<number>;
  readonly onDialogClose: () => void;
  readonly onUpdateNow: () => void;
  readonly onRestartNow: () => void;
}

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
      () => <Progress color="teal" />,
      (percent) => <Progress color="teal" value={percent} />,
    ),
  );
};

export const DesktopAutoUpdateDialog: React.FC<
  DesktopAutoUpdateDialogProps
> = ({ state, progressPercent, onDialogClose, onRestartNow, onUpdateNow }) => {
  if (state.kind === "hidden") {
    return <></>;
  }

  const isBlocking = state.kind === "checking" || state.kind === "downloading";
  const blockingDialogContentProps =
    isBlocking === true
      ? {
          onEscapeKeyDown: (event: KeyboardEvent) => event.preventDefault(),
          onPointerDownOutside: (event: Event) => event.preventDefault(),
        }
      : {};

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (open === true || isBlocking === true) {
          return;
        }

        onDialogClose();
      }}
    >
      <Dialog.Content maxWidth="32rem" {...blockingDialogContentProps}>
        <Dialog.Title>{resolveDialogTitle(state)}</Dialog.Title>
        <div className={styles.content}>
          <Dialog.Description>
            {resolveDialogDescription(state)}
          </Dialog.Description>

          {state.kind === "checking" ? (
            <div className={styles.progressGroup}>
              <Progress color="teal" />
            </div>
          ) : (
            <></>
          )}

          {state.kind === "downloading" ? (
            <div className={styles.progressGroup}>
              {renderProgressBar(progressPercent)}
              <span className={styles.progressText}>
                {resolveProgressText(progressPercent)}
              </span>
            </div>
          ) : (
            <></>
          )}

          {state.kind === "failed" ? (
            <dl className={styles.detailsGrid}>
              <dt className={styles.detailLabel}>対象バージョン</dt>
              <dd className={styles.detailValue}>{state.versionLabel}</dd>
              <dt className={styles.detailLabel}>処理段階</dt>
              <dd className={styles.detailValue}>{state.operationLabel}</dd>
              <dt className={styles.detailLabel}>技術詳細</dt>
              <dd className={styles.detailValue}>{state.detail}</dd>
              <dt className={styles.detailLabel}>対処</dt>
              <dd className={styles.detailValue}>{state.recoveryHint}</dd>
            </dl>
          ) : (
            <></>
          )}
        </div>
        <div className={styles.actions}>
          {state.kind === "checking" ? (
            <Button disabled>確認中...</Button>
          ) : (
            <></>
          )}

          {state.kind === "available" ? (
            <>
              <Button color="gray" onClick={onDialogClose} variant="surface">
                あとで
              </Button>
              <Button onClick={onUpdateNow}>今すぐ更新</Button>
            </>
          ) : (
            <></>
          )}

          {state.kind === "ready" ? (
            <>
              <Button color="gray" onClick={onDialogClose} variant="surface">
                あとで
              </Button>
              <Button onClick={onRestartNow}>今すぐ再起動</Button>
            </>
          ) : (
            <></>
          )}

          {state.kind === "up-to-date" ? (
            <Button onClick={onDialogClose}>閉じる</Button>
          ) : (
            <></>
          )}

          {state.kind === "failed" ? (
            <Button onClick={onDialogClose}>閉じる</Button>
          ) : (
            <></>
          )}

          {state.kind === "downloading" ? (
            <Button disabled>ダウンロード中...</Button>
          ) : (
            <></>
          )}
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
};
