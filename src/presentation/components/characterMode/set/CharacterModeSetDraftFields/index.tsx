import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import OutlinedInput from "@mui/material/OutlinedInput";
import Stack from "@mui/material/Stack";
import React from "react";
import { Field, FieldLabel, ToolButton } from "../../../../App.styles";
import { CHARACTER_SET_DRAFT_ACTION_CONTAINER_CLASS_NAME } from "../../../../styleClassNames";
import { useCharacterModeSetDraft } from "../../core/CharacterModeStateProvider";

/**
 * 新規キャラクターセット作成用の入力欄と実行ボタンです。
 */
export const CharacterModeSetDraftFields: React.FC = () => {
  const setDraft = useCharacterModeSetDraft();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const createDialogTitleId = React.useId();

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
      <div className={CHARACTER_SET_DRAFT_ACTION_CONTAINER_CLASS_NAME}>
        <ToolButton
          type="button"
          tone="primary"
          onClick={handleOpenCreateDialog}
        >
          セットを作成
        </ToolButton>
      </div>

      <Dialog
        open={isCreateDialogOpen}
        onClose={handleCloseCreateDialog}
        aria-labelledby={createDialogTitleId}
        fullWidth
        maxWidth="xs"
      >
        <Stack component="form" onSubmit={handleSubmitCreateSet} spacing={0}>
          <DialogTitle id={createDialogTitleId}>
            キャラクターセットを作成
          </DialogTitle>

          <DialogContent>
            <Field minWidth={0} spacing="0.5rem">
              <FieldLabel>新規セット名</FieldLabel>
              <OutlinedInput
                type="text"
                value={setDraft.newName}
                autoFocus
                inputProps={{
                  "aria-label": "新規セット名",
                }}
                onChange={(event) =>
                  setDraft.handleNewNameChange(event.target.value)
                }
              />
            </Field>
          </DialogContent>

          <DialogActions>
            <ToolButton type="button" onClick={handleCloseCreateDialog}>
              キャンセル
            </ToolButton>
            <ToolButton type="submit" tone="primary">
              作成する
            </ToolButton>
          </DialogActions>
        </Stack>
      </Dialog>
    </>
  );
};
