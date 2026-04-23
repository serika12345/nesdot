import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import { Button, Dialog, Flex, Select, TextField } from "@radix-ui/themes";
import React from "react";
import {
  useCharacterModeSetName,
  useCharacterModeSetSelection,
} from "../../logic/characterModeEditorState";
import styles from "./CharacterModeSetFields.module.css";

/**
 * 編集対象セットの選択、名前変更、削除を扱う入力欄です。
 */
export const CharacterModeSetSelectionFields: React.FC = () => {
  const setSelection = useCharacterModeSetSelection();
  const setName = useCharacterModeSetName();
  const [isRenameDialogOpen, setIsRenameDialogOpen] = React.useState(false);
  const [renameDraftName, setRenameDraftName] = React.useState("");
  const titleId = React.useId();
  const activeSetId = pipe(
    setSelection.selectedCharacterId,
    O.match(
      () => "",
      (value) => value,
    ),
  );
  const setOptions = setSelection.characterSets.map((characterSet) => ({
    label: `${characterSet.name} (${characterSet.sprites.length} sprites)`,
    value: characterSet.id,
  }));
  const activeSetLabel =
    setOptions.find((option) => option.value === activeSetId)?.label ??
    "キャラクターセットがありません";

  const handleOpenRenameDialog = (): void => {
    if (activeSetId === "") {
      return;
    }

    setRenameDraftName(setName.activeSetName);
    setIsRenameDialogOpen(true);
  };

  const handleCloseRenameDialog = (): void => {
    setIsRenameDialogOpen(false);
  };

  const handleRenameSetSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setName.handleSetNameChange(renameDraftName);
    setIsRenameDialogOpen(false);
  };

  const handleDeleteSetWithConfirmation = (): void => {
    if (activeSetId === "") {
      return;
    }

    const shouldDelete = window.confirm("本当にセットを削除しますか？");

    if (shouldDelete === false) {
      return;
    }

    setSelection.handleDeleteSet(activeSetId);
  };
  const renderRenameDialog = (): React.ReactNode => {
    if (typeof document === "undefined") {
      if (isRenameDialogOpen === false) {
        return <></>;
      }

      return (
        <div aria-labelledby={titleId} aria-modal="true" role="dialog">
          <h2 id={titleId}>セット名を変更</h2>
          <form
            className={styles.dialogForm}
            id="character-mode-rename-set-form"
            onSubmit={handleRenameSetSubmit}
          >
            <div className={styles.dialogField}>
              <TextField.Root
                aria-label="変更後のセット名"
                autoFocus
                type="text"
                value={renameDraftName}
                onChange={(event) => setRenameDraftName(event.target.value)}
              />
            </div>
          </form>
          <div>
            <Button color="gray" variant="outline">
              キャンセル
            </Button>
            <Button
              color="teal"
              form="character-mode-rename-set-form"
              type="submit"
              variant="solid"
            >
              変更する
            </Button>
          </div>
        </div>
      );
    }

    return (
      <Dialog.Root
        open={isRenameDialogOpen}
        onOpenChange={(open) => {
          if (open === true) {
            return;
          }

          handleCloseRenameDialog();
        }}
      >
        <Dialog.Content maxWidth="28rem">
          <Dialog.Title>セット名を変更</Dialog.Title>
          <form
            className={styles.dialogForm}
            id="character-mode-rename-set-form"
            onSubmit={handleRenameSetSubmit}
          >
            <div className={styles.dialogField}>
              <TextField.Root
                aria-label="変更後のセット名"
                autoFocus
                type="text"
                value={renameDraftName}
                onChange={(event) => setRenameDraftName(event.target.value)}
              />
            </div>
          </form>
          <Flex gap="3" justify="end" mt="4" wrap="wrap">
            <Button
              color="gray"
              variant="outline"
              onClick={handleCloseRenameDialog}
            >
              キャンセル
            </Button>
            <Button
              color="teal"
              form="character-mode-rename-set-form"
              type="submit"
              variant="solid"
            >
              変更する
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    );
  };

  return (
    <>
      <div className={styles.selectWrap}>
        <Select.Root
          value={activeSetId}
          onValueChange={(value) => {
            setSelection.handleSelectSet(value);
          }}
        >
          <Select.Trigger aria-label="編集中のセット" style={{ width: "100%" }}>
            {activeSetLabel}
          </Select.Trigger>
          {typeof document !== "undefined" ? (
            <Select.Content>
              {setOptions.map((option) => (
                <Select.Item key={option.value} value={option.value}>
                  {option.label}
                </Select.Item>
              ))}
            </Select.Content>
          ) : (
            <></>
          )}
        </Select.Root>
      </div>
      <div className={styles.actionWrap}>
        <Button
          color="gray"
          size="1"
          variant="outline"
          disabled={O.isNone(setSelection.selectedCharacterId)}
          onClick={handleOpenRenameDialog}
        >
          セット名変更
        </Button>
      </div>
      <div className={styles.actionWrap}>
        <Button
          color="red"
          size="1"
          variant="outline"
          disabled={O.isNone(setSelection.selectedCharacterId)}
          onClick={handleDeleteSetWithConfirmation}
        >
          セットを削除
        </Button>
      </div>

      {renderRenameDialog()}
    </>
  );
};
