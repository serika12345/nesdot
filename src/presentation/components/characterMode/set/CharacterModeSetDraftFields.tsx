import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  OutlinedInput,
  Stack,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import React from "react";
import { Field, FieldLabel, ToolButton } from "../../../App.styles";
import { useCharacterModeSetDraft } from "../core/CharacterModeStateProvider";

const ResponsiveActionContainer = styled("div")({
  flexShrink: 0,
});

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
      <ResponsiveActionContainer>
        <ToolButton
          type="button"
          tone="primary"
          onClick={handleOpenCreateDialog}
        >
          セットを作成
        </ToolButton>
      </ResponsiveActionContainer>

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
