import { MenuItem, Select } from "@mui/material";
import { styled } from "@mui/material/styles";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React from "react";
import { Field, FieldLabel, ToolButton } from "../../App.styles";
import { useCharacterModeSetSelection } from "./CharacterModeStateProvider";

const ResponsiveActionContainer = styled("div")({
  flexShrink: 0,
});

/**
 * 編集対象セットの選択と削除を扱う入力欄です。
 */
export const CharacterModeSetSelectionFields: React.FC = () => {
  const setSelection = useCharacterModeSetSelection();
  const activeSetId = pipe(
    setSelection.selectedCharacterId,
    O.match(
      () => "",
      (value) => value,
    ),
  );

  return (
    <>
      <Field flex="1 1 0" minWidth={0}>
        <FieldLabel>編集中のセット</FieldLabel>
        <Select
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
      </Field>
      <ResponsiveActionContainer>
        <ToolButton
          type="button"
          tone="danger"
          disabled={O.isNone(setSelection.selectedCharacterId)}
          onClick={() => {
            if (activeSetId === "") {
              return;
            }
            setSelection.handleDeleteSet(activeSetId);
          }}
        >
          セットを削除
        </ToolButton>
      </ResponsiveActionContainer>
    </>
  );
};
