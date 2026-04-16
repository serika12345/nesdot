import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import React from "react";
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
      <Box flexShrink={0}>
        <Button
          type="button"
          size="small"
          variant="contained"
          onClick={handleOpenCreateDialog}
        >
          セットを作成
        </Button>
      </Box>

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
            <Box pt={1.5}>
              <TextField
                fullWidth
                type="text"
                label="新規セット名"
                value={setDraft.newName}
                autoFocus
                inputProps={{
                  "aria-label": "新規セット名",
                }}
                onChange={(event) =>
                  setDraft.handleNewNameChange(event.target.value)
                }
              />
            </Box>
          </DialogContent>

          <DialogActions>
            <Button type="button" onClick={handleCloseCreateDialog}>
              キャンセル
            </Button>
            <Button type="submit" variant="contained">
              作成する
            </Button>
          </DialogActions>
        </Stack>
      </Dialog>
    </>
  );
};
