import { MenuItem, OutlinedInput, Select, Stack } from "@mui/material";
import { styled } from "@mui/material/styles";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React from "react";
import { type CharacterSet } from "../../../domain/characters/characterSet";
import { Field, FieldLabel, ToolButton } from "../../App.styles";

const ResponsiveHeaderGrid = styled(Stack)({
  flexDirection: "column",
  flexWrap: "wrap",
  alignItems: "stretch",
  gap: "0.75rem",
  "@media (min-width: 1200px)": {
    flexDirection: "row",
    alignItems: "end",
  },
});

const ResponsiveActionContainer = styled("div")(({ theme }) => ({
  width: "100%",
  [theme.breakpoints.up("xl")]: {
    width: "auto",
  },
}));

interface CharacterModeSetHeaderProps {
  newName: string;
  selectedCharacterId: O.Option<string>;
  characterSets: CharacterSet[];
  activeSetAvailable: boolean;
  activeSetId: string;
  onNewNameChange: (value: string) => void;
  onCreateSet: () => void;
  onSelectSet: (setId: string) => void;
  onDeleteSet: (setId: string) => void;
}

/**
 * キャラクターセットの作成、選択、削除を行うヘッダーです。
 * セット管理の主要操作を横断的にまとめ、ワークスペース上部からすぐ扱えるようにします。
 */
export const CharacterModeSetHeader: React.FC<CharacterModeSetHeaderProps> = ({
  newName,
  selectedCharacterId,
  characterSets,
  activeSetAvailable,
  activeSetId,
  onNewNameChange,
  onCreateSet,
  onSelectSet,
  onDeleteSet,
}) => {
  return (
    <ResponsiveHeaderGrid>
      <Field flex="1 1 17.5rem">
        <FieldLabel>新規セット名</FieldLabel>
        <OutlinedInput
          type="text"
          value={newName}
          inputProps={{
            "aria-label": "新規セット名",
          }}
          onChange={(event) => onNewNameChange(event.target.value)}
        />
      </Field>
      <ResponsiveActionContainer>
        <ToolButton type="button" tone="primary" onClick={onCreateSet}>
          セットを作成
        </ToolButton>
      </ResponsiveActionContainer>
      <Field flex="1 1 17.5rem">
        <FieldLabel>編集中のセット</FieldLabel>
        <Select
          variant="outlined"
          inputProps={{
            "aria-label": "編集中のセット",
          }}
          value={pipe(
            selectedCharacterId,
            O.match(
              () => "",
              (value) => value,
            ),
          )}
          onChange={(event) => {
            const value = event.target.value;
            if (typeof value !== "string") {
              return;
            }
            onSelectSet(value);
          }}
        >
          {characterSets.length === 0 && (
            <MenuItem value="">キャラクターセットがありません</MenuItem>
          )}
          {characterSets.map((characterSet) => (
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
          disabled={activeSetAvailable === false}
          onClick={() => {
            if (activeSetId === "") {
              return;
            }
            onDeleteSet(activeSetId);
          }}
        >
          セットを削除
        </ToolButton>
      </ResponsiveActionContainer>
    </ResponsiveHeaderGrid>
  );
};
