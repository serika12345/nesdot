import { Button, Dialog, Flex, TextField } from "@radix-ui/themes";
import React from "react";
import { useCharacterModeSetDraft } from "../../logic/characterModeEditorState";
import styles from "./CharacterModeSetFields.module.css";

/**
 * 新規キャラクターセット作成用の入力欄と実行ボタンです。
 */
export const CharacterModeSetDraftFields: React.FC = () => {
  const setDraft = useCharacterModeSetDraft();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const titleId = React.useId();

  const handleOpenCreateDialog = () => {
    setIsCreateDialogOpen(true);
  };

  const handleCloseCreateDialog = () => {
    setIsCreateDialogOpen(false);
  };

  const handleSubmitCreateSet = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDraft.handleCreateSet();
    setIsCreateDialogOpen(false);
  };

  if (typeof document === "undefined") {
    return (
      <>
        <div className={styles.actionWrap}>
          <Button color="teal" size="1" variant="solid">
            セットを作成
          </Button>
        </div>

        {isCreateDialogOpen === true ? (
          <div aria-labelledby={titleId} aria-modal="true" role="dialog">
            <h2 id={titleId}>キャラクターセットを作成</h2>
            <form
              className={styles.dialogForm}
              id="character-mode-create-set-form"
              onSubmit={handleSubmitCreateSet}
            >
              <div className={styles.dialogField}>
                <TextField.Root
                  aria-label="新規セット名"
                  autoFocus
                  type="text"
                  value={setDraft.newName}
                  onChange={(event) =>
                    setDraft.handleNewNameChange(event.target.value)
                  }
                />
              </div>
            </form>
            <div>
              <Button color="gray" variant="outline">
                キャンセル
              </Button>
              <Button
                color="teal"
                form="character-mode-create-set-form"
                type="submit"
                variant="solid"
              >
                作成する
              </Button>
            </div>
          </div>
        ) : (
          <></>
        )}
      </>
    );
  }

  return (
    <>
      <div className={styles.actionWrap}>
        <Button
          color="teal"
          size="1"
          variant="solid"
          onClick={handleOpenCreateDialog}
        >
          セットを作成
        </Button>
      </div>

      <Dialog.Root
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          if (open === true) {
            return;
          }

          handleCloseCreateDialog();
        }}
      >
        <Dialog.Content maxWidth="28rem">
          <Dialog.Title>キャラクターセットを作成</Dialog.Title>
          <form
            className={styles.dialogForm}
            id="character-mode-create-set-form"
            onSubmit={handleSubmitCreateSet}
          >
            <div className={styles.dialogField}>
              <TextField.Root
                aria-label="新規セット名"
                autoFocus
                type="text"
                value={setDraft.newName}
                onChange={(event) =>
                  setDraft.handleNewNameChange(event.target.value)
                }
              />
            </div>
          </form>
          <Flex gap="3" justify="end" mt="4" wrap="wrap">
            <Button
              color="gray"
              variant="outline"
              onClick={handleCloseCreateDialog}
            >
              キャンセル
            </Button>
            <Button
              color="teal"
              form="character-mode-create-set-form"
              type="submit"
              variant="solid"
            >
              作成する
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
};
