import { OutlinedInput } from "@mui/material";
import { styled } from "@mui/material/styles";
import React from "react";
import { Field, FieldLabel, ToolButton } from "../../App.styles";
import { useCharacterModeSetDraft } from "./CharacterModeStateProvider";

const ResponsiveActionContainer = styled("div")(({ theme }) => ({
  width: "100%",
  [theme.breakpoints.up("xl")]: {
    width: "auto",
  },
}));

/**
 * 新規キャラクターセット作成用の入力欄と実行ボタンです。
 */
export const CharacterModeSetDraftFields: React.FC = () => {
  const setDraft = useCharacterModeSetDraft();

  return (
    <>
      <Field flex="1 1 17.5rem">
        <FieldLabel>新規セット名</FieldLabel>
        <OutlinedInput
          type="text"
          value={setDraft.newName}
          inputProps={{
            "aria-label": "新規セット名",
          }}
          onChange={(event) => setDraft.handleNewNameChange(event.target.value)}
        />
      </Field>
      <ResponsiveActionContainer>
        <ToolButton type="button" tone="primary" onClick={setDraft.handleCreateSet}>
          セットを作成
        </ToolButton>
      </ResponsiveActionContainer>
    </>
  );
};
