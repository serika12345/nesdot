import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React from "react";
import {
  AppButton,
  AppDialog,
  AppInput,
  AppSelect,
} from "../../../common/ui/forms/AppControls";
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
  const activeSetId = pipe(
    setSelection.selectedCharacterId,
    O.match(
      () => "",
      (value) => value,
    ),
  );

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

  return (
    <>
      <div className={styles.selectWrap}>
        <AppSelect
          aria-label="編集中のセット"
          value={activeSetId}
          onChange={(event) => {
            const value = event.target.value;
            if (typeof value !== "string") {
              return;
            }
            setSelection.handleSelectSet(value);
          }}
        >
          {setSelection.characterSets.length === 0 ? (
            <option value="">キャラクターセットがありません</option>
          ) : (
            <></>
          )}
          {setSelection.characterSets.map((characterSet) => (
            <option key={characterSet.id} value={characterSet.id}>
              {`${characterSet.name} (${characterSet.sprites.length} sprites)`}
            </option>
          ))}
        </AppSelect>
      </div>
      <div className={styles.actionWrap}>
        <AppButton
          size="small"
          variant="outline"
          disabled={O.isNone(setSelection.selectedCharacterId)}
          onClick={handleOpenRenameDialog}
        >
          セット名変更
        </AppButton>
      </div>
      <div className={styles.actionWrap}>
        <AppButton
          size="small"
          tone="danger"
          variant="outline"
          disabled={O.isNone(setSelection.selectedCharacterId)}
          onClick={handleDeleteSetWithConfirmation}
        >
          セットを削除
        </AppButton>
      </div>

      <AppDialog
        actions={
          <>
            <AppButton variant="outline" onClick={handleCloseRenameDialog}>
              キャンセル
            </AppButton>
            <AppButton
              form="character-mode-rename-set-form"
              tone="accent"
              type="submit"
              variant="solid"
            >
              変更する
            </AppButton>
          </>
        }
        open={isRenameDialogOpen}
        size="small"
        title="セット名を変更"
        onClose={handleCloseRenameDialog}
      >
        <form
          className={styles.dialogForm}
          id="character-mode-rename-set-form"
          onSubmit={handleRenameSetSubmit}
        >
          <div className={styles.dialogField}>
            <AppInput
              aria-label="変更後のセット名"
              autoFocus
              type="text"
              value={renameDraftName}
              onChange={(event) => setRenameDraftName(event.target.value)}
            />
          </div>
        </form>
      </AppDialog>
    </>
  );
};
