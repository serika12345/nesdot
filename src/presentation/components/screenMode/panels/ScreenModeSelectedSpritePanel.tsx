import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { MenuItem, OutlinedInput, Select } from "@mui/material";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React from "react";
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
} from "../../../App.styles";
import type { ScreenModeState } from "../hooks/useScreenModeState";
import {
  FlipButtonGrid,
  FlipToolButton,
  ReadOnlyDetailRow,
  ScreenModeSection,
  TwoColumnFieldGrid,
  WideTallToolButton,
  collapseChevronStyle,
} from "../primitives/ScreenModePrimitives";

interface ScreenModeSelectedSpritePanelProps {
  screenMode: ScreenModeState;
}

/**
 * 選択中スプライトの確認と編集を扱うパネルです。
 */
export const ScreenModeSelectedSpritePanel: React.FC<
  ScreenModeSelectedSpritePanelProps
> = ({ screenMode }) => {
  const {
    isSelectionOpen,
    setIsSelectionOpen,
    selectedSpriteIndex,
    spritesOnScreen,
    activeSprite,
    handleSelectedSpriteListChange,
    handleSelectedSpriteXChange,
    handleSelectedSpriteYChange,
    handleSelectedSpritePriorityChange,
    handleToggleSelectedSpriteFlipH,
    handleToggleSelectedSpriteFlipV,
    handleDeleteSelectedSprite,
  } = screenMode;

  return (
    <ScreenModeSection>
      <PanelHeader>
        <PanelHeaderRow>
          <CollapseToggle
            type="button"
            open={isSelectionOpen}
            onClick={() => setIsSelectionOpen((previous) => !previous)}
          >
            {isSelectionOpen ? "閉じる" : "開く"}
            <ExpandMoreRoundedIcon
              style={collapseChevronStyle(isSelectionOpen)}
            />
          </CollapseToggle>
        </PanelHeaderRow>
        <PanelTitle>選択中のスプライト</PanelTitle>
      </PanelHeader>

      {isSelectionOpen ? (
        <>
          <Field>
            <FieldLabel>スプライト一覧</FieldLabel>
            <Select
              variant="outlined"
              onChange={(event) =>
                handleSelectedSpriteListChange(event.target.value)
              }
              value={pipe(
                selectedSpriteIndex,
                O.match(
                  () => "",
                  (index) => String(index),
                ),
              )}
              inputProps={{
                "aria-label": "スプライト一覧",
              }}
            >
              {spritesOnScreen.length === 0 && (
                <MenuItem value="">スプライトが配置されていません</MenuItem>
              )}
              {spritesOnScreen.map((sprite, index) => (
                <MenuItem key={index} value={String(index)}>
                  {`#${index} spriteIndex:${sprite.spriteIndex} ${sprite.width}x${sprite.height} @ ${sprite.x},${sprite.y} ${sprite.priority === "behindBg" ? "behind" : "front"}`}
                </MenuItem>
              ))}
            </Select>
          </Field>

          {pipe(
            activeSprite,
            O.match(
              () => (
                <HelperText>
                  スプライトを追加するか、一覧から対象を選択してください。
                </HelperText>
              ),
              (selectedSprite) => (
                <>
                  <DetailList>
                    <ReadOnlyDetailRow>
                      <DetailKey>元スプライト</DetailKey>
                      <DetailValue>
                        spriteIndex {selectedSprite.spriteIndex}
                      </DetailValue>
                    </ReadOnlyDetailRow>
                    <ReadOnlyDetailRow>
                      <DetailKey>サイズ</DetailKey>
                      <DetailValue>
                        {selectedSprite.width}×{selectedSprite.height}
                      </DetailValue>
                    </ReadOnlyDetailRow>
                    <ReadOnlyDetailRow>
                      <DetailKey>優先度</DetailKey>
                      <DetailValue>
                        {selectedSprite.priority === "behindBg"
                          ? "背景の後ろ"
                          : "背景の前"}
                      </DetailValue>
                    </ReadOnlyDetailRow>
                    <ReadOnlyDetailRow>
                      <DetailKey>反転</DetailKey>
                      <DetailValue>
                        {`${selectedSprite.flipH === true ? "H" : "-"} / ${selectedSprite.flipV === true ? "V" : "-"}`}
                      </DetailValue>
                    </ReadOnlyDetailRow>
                  </DetailList>

                  <TwoColumnFieldGrid>
                    <Field flex="1 1 11.25rem">
                      <FieldLabel>Position X</FieldLabel>
                      <OutlinedInput
                        type="number"
                        value={selectedSprite.x}
                        inputProps={{
                          "aria-label": "選択スプライト X 座標",
                        }}
                        onChange={(event) =>
                          handleSelectedSpriteXChange(event.target.value)
                        }
                      />
                    </Field>
                    <Field flex="1 1 11.25rem">
                      <FieldLabel>Position Y</FieldLabel>
                      <OutlinedInput
                        type="number"
                        value={selectedSprite.y}
                        inputProps={{
                          "aria-label": "選択スプライト Y 座標",
                        }}
                        onChange={(event) =>
                          handleSelectedSpriteYChange(event.target.value)
                        }
                      />
                    </Field>
                    <Field flex="1 1 11.25rem">
                      <FieldLabel>Priority</FieldLabel>
                      <Select
                        variant="outlined"
                        value={selectedSprite.priority}
                        inputProps={{
                          "aria-label": "選択スプライトの優先度",
                        }}
                        onChange={(event) =>
                          handleSelectedSpritePriorityChange(event.target.value)
                        }
                      >
                        <MenuItem value="front">前面</MenuItem>
                        <MenuItem value="behindBg">背景の後ろ</MenuItem>
                      </Select>
                    </Field>
                    <Field flex="1 1 11.25rem">
                      <FieldLabel>Flip</FieldLabel>
                      <FlipButtonGrid>
                        <FlipToolButton
                          type="button"
                          active={selectedSprite.flipH === true}
                          onClick={handleToggleSelectedSpriteFlipH}
                        >
                          H反転
                        </FlipToolButton>
                        <FlipToolButton
                          type="button"
                          active={selectedSprite.flipV === true}
                          onClick={handleToggleSelectedSpriteFlipV}
                        >
                          V反転
                        </FlipToolButton>
                      </FlipButtonGrid>
                    </Field>
                  </TwoColumnFieldGrid>

                  <WideTallToolButton
                    type="button"
                    tone="danger"
                    onClick={handleDeleteSelectedSprite}
                  >
                    このスプライトを削除
                  </WideTallToolButton>
                </>
              ),
            ),
          )}
        </>
      ) : (
        <HelperText>
          {pipe(
            selectedSpriteIndex,
            O.match(
              () => "現在は未選択です。",
              (index) => `現在は #${index} を選択中です。`,
            ),
          )}
        </HelperText>
      )}
    </ScreenModeSection>
  );
};
