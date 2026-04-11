import MenuItem from "@mui/material/MenuItem";
import OutlinedInput from "@mui/material/OutlinedInput";
import Select from "@mui/material/Select";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React from "react";
import {
  Field,
  FieldLabel,
  HelperText,
  PanelHeader,
  PanelTitle,
} from "../../../../../App.styles";
import type { ScreenModeState } from "../../../logic/useScreenModeState";
import {
  FullWidthActionRow,
  FullWidthField,
  ScreenModeSection,
  TwoColumnFieldGrid,
  WideTallToolButton,
} from "../../primitives/ScreenModePrimitives";

interface ScreenModeCharacterPanelProps {
  screenMode: ScreenModeState;
}

/**
 * キャラクターセット単位の追加操作を扱うパネルです。
 */
export const ScreenModeCharacterPanel: React.FC<
  ScreenModeCharacterPanelProps
> = ({ screenMode }) => {
  const {
    characterBaseX,
    setCharacterBaseX,
    characterBaseY,
    setCharacterBaseY,
    characterSets,
    selectedCharacterId,
    activeCharacter,
    handleCharacterSetSelect,
    handleAddCharacter,
  } = screenMode;

  return (
    <ScreenModeSection>
      <PanelHeader>
        <PanelTitle>キャラクター追加</PanelTitle>
      </PanelHeader>

      <TwoColumnFieldGrid>
        <FullWidthField>
          <FieldLabel>キャラクターセット</FieldLabel>
          <Select
            variant="outlined"
            onChange={(event) => handleCharacterSetSelect(event.target.value)}
            value={pipe(
              selectedCharacterId,
              O.match(
                () => "",
                (id) => id,
              ),
            )}
            inputProps={{
              "aria-label": "キャラクターセット",
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
        </FullWidthField>

        <Field flex="1 1 11.25rem">
          <FieldLabel>X 座標</FieldLabel>
          <OutlinedInput
            type="number"
            value={characterBaseX}
            inputProps={{
              min: 0,
              max: 256,
              "aria-label": "キャラクター X 座標",
            }}
            onChange={(event) => setCharacterBaseX(Number(event.target.value))}
          />
        </Field>
        <Field flex="1 1 11.25rem">
          <FieldLabel>Y 座標</FieldLabel>
          <OutlinedInput
            type="number"
            value={characterBaseY}
            inputProps={{
              min: 0,
              max: 240,
              "aria-label": "キャラクター Y 座標",
            }}
            onChange={(event) => setCharacterBaseY(Number(event.target.value))}
          />
        </Field>
        <FullWidthActionRow>
          <WideTallToolButton
            type="button"
            tone="primary"
            onClick={handleAddCharacter}
          >
            キャラクターを追加
          </WideTallToolButton>
        </FullWidthActionRow>
      </TwoColumnFieldGrid>

      {pipe(
        activeCharacter,
        O.match(
          () => (
            <HelperText>
              配置するキャラクターセットを選択してください。
            </HelperText>
          ),
          (characterSet) => (
            <HelperText>
              {`${characterSet.sprites.length} sprites を (${characterBaseX}, ${characterBaseY}) に配置します。`}
            </HelperText>
          ),
        ),
      )}
    </ScreenModeSection>
  );
};
