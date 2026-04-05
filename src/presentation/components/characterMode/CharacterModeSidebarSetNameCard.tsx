import { OutlinedInput } from "@mui/material";
import * as O from "fp-ts/Option";
import React from "react";
import { Field, FieldLabel } from "../../App.styles";
import { CharacterModeEditorCard } from "./CharacterModeEditorCard";
import { useCharacterModeSetName } from "./CharacterModeStateProvider";

/**
 * 選択中セット名の編集カードです。
 */
export const CharacterModeSidebarSetNameCard: React.FC = () => {
  const setName = useCharacterModeSetName();

  return (
    <CharacterModeEditorCard minHeight={0} spacing="0.875rem" p="1rem" useFlexGap>
      <Field>
        <FieldLabel>セット名</FieldLabel>
        <OutlinedInput
          type="text"
          value={setName.activeSetName}
          disabled={O.isNone(setName.activeSet)}
          inputProps={{
            "aria-label": "セット名",
          }}
          onChange={(event) => setName.handleSetNameChange(event.target.value)}
        />
      </Field>
    </CharacterModeEditorCard>
  );
};
