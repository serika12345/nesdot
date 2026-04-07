import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React from "react";
import { Field, FieldLabel, ToolButton } from "../../App.styles";
import {
  useCharacterModeSetName,
  useCharacterModeSetSelection,
} from "./CharacterModeStateProvider";

const ResponsiveActionContainer = styled("div")({
  flexShrink: 0,
});

const SetSelectContainer = styled("div")(({ theme }) => ({
  minWidth: "14rem",
  flex: "1 1 16rem",
  [theme.breakpoints.down("sm")]: {
    minWidth: "100%",
  },
}));

/**
 * 編集対象セットの選択、名前変更、削除を扱う入力欄です。
 */
export const CharacterModeSetSelectionFields: React.FC = () => {
  const setSelection = useCharacterModeSetSelection();
  const setName = useCharacterModeSetName();
  const [isRenameDialogOpen, setIsRenameDialogOpen] = React.useState(false);
  const [renameDraftName, setRenameDraftName] = React.useState("");
  const renameDialogTitleId = React.useId();
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
      <SetSelectContainer>
        <Select
          fullWidth
          variant="outlined"
          inputProps={{
            "aria-label": "編集中のセット",
          }}
          value={activeSetId}
          onChange={(event) => {
            const value = event.target.value;
            if (typeof value !== "string") {
              return;
            }
            setSelection.handleSelectSet(value);
          }}
        >
          {setSelection.characterSets.length === 0 && (
            <MenuItem value="">キャラクターセットがありません</MenuItem>
          )}
          {setSelection.characterSets.map((characterSet) => (
            <MenuItem key={characterSet.id} value={characterSet.id}>
              {`${characterSet.name} (${characterSet.sprites.length} sprites)`}
            </MenuItem>
          ))}
        </Select>
      </SetSelectContainer>
      <ResponsiveActionContainer>
        <ToolButton
          type="button"
          disabled={O.isNone(setSelection.selectedCharacterId)}
          onClick={handleOpenRenameDialog}
        >
          セット名変更
        </ToolButton>
      </ResponsiveActionContainer>
      <ResponsiveActionContainer>
        <ToolButton
          type="button"
          tone="danger"
          disabled={O.isNone(setSelection.selectedCharacterId)}
          onClick={handleDeleteSetWithConfirmation}
        >
          セットを削除
        </ToolButton>
      </ResponsiveActionContainer>

      <Dialog
        open={isRenameDialogOpen}
        onClose={handleCloseRenameDialog}
        aria-labelledby={renameDialogTitleId}
        fullWidth
        maxWidth="xs"
      >
        <Stack component="form" onSubmit={handleRenameSetSubmit} spacing={0}>
          <DialogTitle id={renameDialogTitleId}>セット名を変更</DialogTitle>

          <DialogContent>
            <Field minWidth={0} spacing="0.5rem">
              <FieldLabel>変更後のセット名</FieldLabel>
              <OutlinedInput
                type="text"
                value={renameDraftName}
                autoFocus
                inputProps={{
                  "aria-label": "変更後のセット名",
                }}
                onChange={(event) => setRenameDraftName(event.target.value)}
              />
            </Field>
          </DialogContent>

          <DialogActions>
            <ToolButton type="button" onClick={handleCloseRenameDialog}>
              キャンセル
            </ToolButton>
            <ToolButton type="submit" tone="primary">
              変更する
            </ToolButton>
          </DialogActions>
        </Stack>
      </Dialog>
    </>
  );
};
