import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { OutlinedInput } from "@mui/material";
import React from "react";
import {
  CollapseToggle,
  Field,
  FieldLabel,
  HelperText,
  PanelHeader,
  PanelHeaderRow,
  PanelTitle,
} from "../../App.styles";
import type { ScreenModeState } from "./hooks/useScreenModeState";
import {
  GridActionRow,
  ScreenModeSection,
  TwoColumnFieldGrid,
  WideTallToolButton,
  collapseChevronStyle,
} from "./ScreenModePrimitives";

interface ScreenModeSpritePlacementPanelProps {
  screenMode: ScreenModeState;
}

/**
 * 単体スプライトの追加設定を扱うパネルです。
 */
export const ScreenModeSpritePlacementPanel: React.FC<
  ScreenModeSpritePlacementPanelProps
> = ({ screenMode }) => {
  const {
    spriteNumber,
    setSpriteNumber,
    x,
    setX,
    y,
    setY,
    isPlacementOpen,
    setIsPlacementOpen,
    handleAddSprite,
  } = screenMode;

  return (
    <ScreenModeSection>
      <PanelHeader>
        <PanelHeaderRow>
          <CollapseToggle
            type="button"
            open={isPlacementOpen}
            onClick={() => setIsPlacementOpen((previous) => !previous)}
          >
            {isPlacementOpen ? "閉じる" : "開く"}
            <ExpandMoreRoundedIcon style={collapseChevronStyle(isPlacementOpen)} />
          </CollapseToggle>
        </PanelHeaderRow>
        <PanelTitle>スプライト追加</PanelTitle>
      </PanelHeader>

      {isPlacementOpen ? (
        <TwoColumnFieldGrid>
          <Field flex="1 1 11.25rem">
            <FieldLabel>スプライト番号</FieldLabel>
            <OutlinedInput
              type="number"
              value={spriteNumber}
              inputProps={{
                min: 0,
                max: 64,
                "aria-label": "スプライト番号",
              }}
              onChange={(event) => setSpriteNumber(Number(event.target.value))}
            />
          </Field>
          <Field flex="1 1 11.25rem">
            <FieldLabel>X 座標</FieldLabel>
            <OutlinedInput
              type="number"
              value={x}
              inputProps={{
                min: 0,
                max: 256,
                "aria-label": "スプライト X 座標",
              }}
              onChange={(event) => setX(Number(event.target.value))}
            />
          </Field>
          <Field flex="1 1 11.25rem">
            <FieldLabel>Y 座標</FieldLabel>
            <OutlinedInput
              type="number"
              value={y}
              inputProps={{
                min: 0,
                max: 240,
                "aria-label": "スプライト Y 座標",
              }}
              onChange={(event) => setY(Number(event.target.value))}
            />
          </Field>
          <GridActionRow>
            <WideTallToolButton
              type="button"
              tone="primary"
              onClick={handleAddSprite}
            >
              スプライトを追加
            </WideTallToolButton>
          </GridActionRow>
        </TwoColumnFieldGrid>
      ) : (
        <HelperText>
          追加候補は sprite #{spriteNumber} を ({x}, {y}) に配置します。
        </HelperText>
      )}
    </ScreenModeSection>
  );
};
