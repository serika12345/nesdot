import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import {
  MenuItem,
  OutlinedInput,
  Select,
} from "@mui/material";
import React from "react";
import { getGroupBounds } from "../../../domain/screen/spriteGroup";
import {
  CollapseToggle,
  DetailKey,
  DetailList,
  DetailValue,
  Field,
  FieldLabel,
  HelperText,
  PanelHeader,
  PanelHeaderRow,
  PanelTitle,
} from "../../App.styles";
import type { ScreenModeState } from "./hooks/useScreenModeState";
import {
  GroupActionButton,
  ReadOnlyDetailRow,
  ScreenModeSection,
  TwoColumnFieldGrid,
  collapseChevronStyle,
} from "./ScreenModePrimitives";

interface ScreenModeGroupMovePanelProps {
  screenMode: ScreenModeState;
}

/**
 * 複数スプライトの選択と一括移動を扱うパネルです。
 */
export const ScreenModeGroupMovePanel: React.FC<
  ScreenModeGroupMovePanelProps
> = ({ screenMode }) => {
  const {
    isGroupMoveOpen,
    setIsGroupMoveOpen,
    spritesOnScreen,
    selectedSpriteIndices,
    groupMoveDeltaX,
    setGroupMoveDeltaX,
    groupMoveDeltaY,
    setGroupMoveDeltaY,
    clearGroupSelection,
    handleMoveSelectedGroup,
    handleGroupSelectionToggleFromSelect,
  } = screenMode;

  return (
    <ScreenModeSection>
      <PanelHeader>
        <PanelHeaderRow>
          <CollapseToggle
            type="button"
            open={isGroupMoveOpen}
            onClick={() => setIsGroupMoveOpen((previous) => !previous)}
          >
            {isGroupMoveOpen ? "閉じる" : "開く"}
            <ExpandMoreRoundedIcon style={collapseChevronStyle(isGroupMoveOpen)} />
          </CollapseToggle>
        </PanelHeaderRow>
        <PanelTitle>グループ移動</PanelTitle>
      </PanelHeader>

      {isGroupMoveOpen ? (
        <>
          <Field>
            <FieldLabel>選択中のスプライト</FieldLabel>
            <Select
              variant="outlined"
              onChange={(event) =>
                handleGroupSelectionToggleFromSelect(event.target.value)
              }
              value=""
              inputProps={{
                "aria-label": "グループ移動対象のスプライト",
              }}
            >
              <MenuItem value="">スプライトを追加...</MenuItem>
              {spritesOnScreen.map((sprite, index) => (
                <MenuItem key={index} value={String(index)}>
                  {`#${index} ${selectedSpriteIndices.has(index) ? "✓" : " "} spriteIndex:${sprite.spriteIndex} @ ${sprite.x},${sprite.y}`}
                </MenuItem>
              ))}
            </Select>
          </Field>

          {selectedSpriteIndices.size > 0 && (
            <>
              <DetailList>
                <ReadOnlyDetailRow>
                  <DetailKey>選択数</DetailKey>
                  <DetailValue>{selectedSpriteIndices.size}</DetailValue>
                </ReadOnlyDetailRow>
                {(() => {
                  const bounds = getGroupBounds(
                    spritesOnScreen,
                    selectedSpriteIndices,
                  );
                  const isValidBounds =
                    bounds.minX !== Infinity &&
                    bounds.minY !== Infinity &&
                    bounds.maxX !== -Infinity &&
                    bounds.maxY !== -Infinity;

                  return isValidBounds ? (
                    <>
                      <ReadOnlyDetailRow>
                        <DetailKey>グループ位置</DetailKey>
                        <DetailValue>
                          {bounds.minX}, {bounds.minY}
                        </DetailValue>
                      </ReadOnlyDetailRow>
                      <ReadOnlyDetailRow>
                        <DetailKey>グループサイズ</DetailKey>
                        <DetailValue>
                          {bounds.maxX - bounds.minX}×
                          {bounds.maxY - bounds.minY}
                        </DetailValue>
                      </ReadOnlyDetailRow>
                    </>
                  ) : (
                    <></>
                  );
                })()}
              </DetailList>

              <TwoColumnFieldGrid>
                <Field flex="1 1 11.25rem">
                  <FieldLabel>移動 X</FieldLabel>
                  <OutlinedInput
                    type="number"
                    value={groupMoveDeltaX}
                    inputProps={{
                      "aria-label": "グループ移動 X",
                    }}
                    onChange={(event) =>
                      setGroupMoveDeltaX(Number(event.target.value))
                    }
                  />
                </Field>
                <Field flex="1 1 11.25rem">
                  <FieldLabel>移動 Y</FieldLabel>
                  <OutlinedInput
                    type="number"
                    value={groupMoveDeltaY}
                    inputProps={{
                      "aria-label": "グループ移動 Y",
                    }}
                    onChange={(event) =>
                      setGroupMoveDeltaY(Number(event.target.value))
                    }
                  />
                </Field>
                <GroupActionButton
                  type="button"
                  tone="primary"
                  onClick={handleMoveSelectedGroup}
                >
                  グループを移動
                </GroupActionButton>
                <GroupActionButton
                  type="button"
                  tone="neutral"
                  onClick={clearGroupSelection}
                >
                  選択をクリア
                </GroupActionButton>
              </TwoColumnFieldGrid>
            </>
          )}

          {selectedSpriteIndices.size === 0 && (
            <HelperText>
              移動するスプライトを選択してください。複数選択可能です。
            </HelperText>
          )}
        </>
      ) : (
        <HelperText>
          {selectedSpriteIndices.size === 0
            ? "グループ移動を使用していません。"
            : `${selectedSpriteIndices.size}個のスプライトがグループ選択中です。`}
        </HelperText>
      )}
    </ScreenModeSection>
  );
};
