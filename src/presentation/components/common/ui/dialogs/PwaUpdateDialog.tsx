import { Button, Dialog, Progress } from "@radix-ui/themes";
import React from "react";
import type { PwaUpdateDialogState } from "../../../../../infrastructure/browser/pwaUpdateMonitor";
import styles from "./UpdateDialogs.module.css";

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
  if (state.kind === "hidden") {
    return <></>;
  }

  const isBlocking = state.kind === "applying";
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
      <Dialog.Content maxWidth="28rem" {...blockingDialogContentProps}>
        <Dialog.Title>{resolveDialogTitle(state)}</Dialog.Title>
        <div className={styles.content}>
          <Dialog.Description>
            {resolveDialogDescription(state)}
          </Dialog.Description>

          {state.kind === "applying" ? <Progress color="teal" /> : <></>}

          {state.kind === "failed" ? (
            <p className={styles.errorText}>{state.message}</p>
          ) : (
            <></>
          )}
        </div>
        <div className={styles.actions}>
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

          {state.kind === "failed" ? (
            <Button onClick={onDialogClose}>閉じる</Button>
          ) : (
            <></>
          )}

          {state.kind === "applying" ? (
            <Button disabled>更新中...</Button>
          ) : (
            <></>
          )}
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
};
