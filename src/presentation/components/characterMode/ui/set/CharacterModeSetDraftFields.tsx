import React from "react";
import {
  AppButton,
  AppDialog,
  AppInput,
} from "../../../common/ui/forms/AppControls";
import { useCharacterModeSetDraft } from "../../logic/characterModeEditorState";
import styles from "./CharacterModeSetFields.module.css";

/**
 * 新規キャラクターセット作成用の入力欄と実行ボタンです。
 */
export const CharacterModeSetDraftFields: React.FC = () => {
  const setDraft = useCharacterModeSetDraft();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);

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

  return (
    <>
      <div className={styles.actionWrap}>
        <AppButton
          size="small"
          tone="accent"
          variant="solid"
          onClick={handleOpenCreateDialog}
        >
          セットを作成
        </AppButton>
      </div>

      <AppDialog
        actions={
          <>
            <AppButton variant="outline" onClick={handleCloseCreateDialog}>
              キャンセル
            </AppButton>
            <AppButton
              form="character-mode-create-set-form"
              tone="accent"
              type="submit"
              variant="solid"
            >
              作成する
            </AppButton>
          </>
        }
        open={isCreateDialogOpen}
        size="small"
        title="キャラクターセットを作成"
        onClose={handleCloseCreateDialog}
      >
        <form
          className={styles.dialogForm}
          id="character-mode-create-set-form"
          onSubmit={handleSubmitCreateSet}
        >
          <div className={styles.dialogField}>
            <AppInput
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
      </AppDialog>
    </>
  );
};
