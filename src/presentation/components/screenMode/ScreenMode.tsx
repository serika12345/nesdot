import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import {
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  type StackProps,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React from "react";
import { getGroupBounds } from "../../../domain/screen/spriteGroup";
import {
  Badge,
  CanvasViewport,
  CollapseToggle,
  DetailKey,
  DetailList,
  DetailRow,
  DetailValue,
  Field,
  FieldLabel,
  HelperText,
  Panel,
  PanelHeader,
  PanelHeaderRow,
  PanelTitle,
  ScrollColumn,
  SplitLayout,
  ToolButton,
} from "../../App.styles";
import { ProjectActions } from "../common/ProjectActions";
import { ScreenCanvas } from "../common/ScreenCanvas";
import { useScreenModeController } from "./hooks/useScreenModeController";
import { ScreenModeSummaryPanel } from "./ScreenModeSummaryPanel";

const shouldForwardActiveProp = (prop: PropertyKey): boolean =>
  prop !== "active";

const createStackLayout = (
  displayName: string,
  defaultProps: StackProps,
  Root: typeof Stack = Stack,
) => {
  void displayName;
  const LayoutComponent = React.forwardRef<HTMLDivElement, StackProps>(
    function LayoutComponent(props, ref) {
      return <Root ref={ref} useFlexGap {...defaultProps} {...props} />;
    },
  );

  return LayoutComponent;
};

const TwoColumnFieldGrid = createStackLayout("TwoColumnFieldGrid", {
  direction: "row",
  flexWrap: "wrap",
  spacing: "0.75rem",
  alignItems: "end",
});

const FullWidthField = createStackLayout("FullWidthField", {
  component: "label",
  spacing: "0.5rem",
  flexBasis: "100%",
});

const GridActionRow = createStackLayout("GridActionRow", {
  flex: "1 1 10rem",
  justifyContent: "flex-end",
});

const FullWidthActionRow = createStackLayout("FullWidthActionRow", {
  flexBasis: "100%",
  justifyContent: "flex-end",
});

const TallToolButton = styled(ToolButton)({
  minHeight: "3rem",
});

const WideTallToolButton = styled(TallToolButton)({
  width: "100%",
});

const ZoomControlsRow = styled(PanelHeaderRow)({
  justifyContent: "flex-start",
});

const collapseChevronStyle = (open: boolean): React.CSSProperties => ({
  transform: open ? "rotate(180deg)" : "rotate(0deg)",
  transition: "transform 160ms ease",
});

const ReadOnlyDetailRow = styled(DetailRow)({
  background: "transparent",
  border: "none",
  boxShadow: "none",
  padding: 0,
  borderRadius: 0,
});

const FlipButtonGrid = createStackLayout("FlipButtonGrid", {
  direction: "row",
  spacing: "0.75rem",
  alignItems: "end",
});

const FlipToolButton = styled(ToolButton)({
  flex: 1,
});

const GroupActionButton = styled(TallToolButton)({
  width: "100%",
});

const PreviewViewportRoot = styled(CanvasViewport, {
  shouldForwardProp: shouldForwardActiveProp,
})<{ active?: boolean }>(({ active }) => ({
  cursor: active === true ? "grabbing" : "default",
}));

type PreviewViewportProps = React.ComponentProps<typeof CanvasViewport> & {
  active?: boolean;
};

const PreviewViewport = React.forwardRef<HTMLDivElement, PreviewViewportProps>(
  function PreviewViewport({ active, ...props }, ref) {
    return (
      <PreviewViewportRoot
        ref={ref}
        active={active === true}
        flex={1}
        minHeight={0}
        p="1.5rem"
        {...props}
      />
    );
  },
);

const PreviewCanvasWrap = styled("div")({
  display: "grid",
  placeItems: "center",
  width: "max-content",
  height: "max-content",
  minWidth: "100%",
  minHeight: "100%",
});

const WarningList = styled(DetailList)({
  flexShrink: 0,
});

export const ScreenMode: React.FC = () => {
  const {
    spriteNumber,
    setSpriteNumber,
    x,
    setX,
    y,
    setY,
    screenZoomLevel,
    selectedSpriteIndex,
    viewportPanState,
    isPlacementOpen,
    setIsPlacementOpen,
    isSelectionOpen,
    setIsSelectionOpen,
    isGroupMoveOpen,
    setIsGroupMoveOpen,
    selectedSpriteIndices,
    groupMoveDeltaX,
    setGroupMoveDeltaX,
    groupMoveDeltaY,
    setGroupMoveDeltaY,
    characterBaseX,
    setCharacterBaseX,
    characterBaseY,
    setCharacterBaseY,
    screen,
    spritesOnScreen,
    characterSets,
    selectedCharacterId,
    activeCharacter,
    activeSprite,
    scanReport,
    projectActions,
    setViewportRef,
    handleCharacterSetSelect,
    clearGroupSelection,
    handleMoveSelectedGroup,
    handleImport,
    handleAddSprite,
    handleAddCharacter,
    handleZoomOut,
    handleZoomIn,
    handleViewportWheel,
    handleViewportPointerDown,
    handleViewportPointerMove,
    handleViewportPointerEnd,
    handleSelectedSpriteListChange,
    handleSelectedSpriteXChange,
    handleSelectedSpriteYChange,
    handleSelectedSpritePriorityChange,
    handleToggleSelectedSpriteFlipH,
    handleToggleSelectedSpriteFlipV,
    handleDeleteSelectedSprite,
    handleGroupSelectionToggleFromSelect,
  } = useScreenModeController();

  return (
    <SplitLayout flex={1} height="100%">
      <ScrollColumn width={{ lg: "20rem", xl: "22.5rem" }} flexShrink={0}>
        <ScreenModeSummaryPanel
          spritesOnScreenCount={spritesOnScreen.length}
          screenWidth={screen.width}
          screenHeight={screen.height}
          hasConstraintViolation={scanReport.ok === false}
        />

        <Panel>
          <PanelHeader>
            <PanelTitle>キャラクター追加</PanelTitle>
          </PanelHeader>

          <TwoColumnFieldGrid>
            <FullWidthField>
              <FieldLabel>キャラクターセット</FieldLabel>
              <Select
                variant="outlined"
                onChange={(event) =>
                  handleCharacterSetSelect(event.target.value)
                }
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
                onChange={(e) => setCharacterBaseX(Number(e.target.value))}
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
                onChange={(e) => setCharacterBaseY(Number(e.target.value))}
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
        </Panel>

        <Panel>
          <PanelHeader>
            <PanelHeaderRow>
              <CollapseToggle
                type="button"
                open={isPlacementOpen}
                onClick={() => setIsPlacementOpen((prev) => !prev)}
              >
                {isPlacementOpen ? "閉じる" : "開く"}
                <ExpandMoreRoundedIcon
                  style={collapseChevronStyle(isPlacementOpen)}
                />
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
                  onChange={(e) => setSpriteNumber(Number(e.target.value))}
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
                  onChange={(e) => setX(Number(e.target.value))}
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
                  onChange={(e) => setY(Number(e.target.value))}
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
        </Panel>

        <Panel>
          <PanelHeader>
            <PanelHeaderRow>
              <CollapseToggle
                type="button"
                open={isSelectionOpen}
                onClick={() => setIsSelectionOpen((prev) => !prev)}
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
                              handleSelectedSpritePriorityChange(
                                event.target.value,
                              )
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
        </Panel>

        <Panel>
          <PanelHeader>
            <PanelHeaderRow>
              <CollapseToggle
                type="button"
                open={isGroupMoveOpen}
                onClick={() => setIsGroupMoveOpen((prev) => !prev)}
              >
                {isGroupMoveOpen ? "閉じる" : "開く"}
                <ExpandMoreRoundedIcon
                  style={collapseChevronStyle(isGroupMoveOpen)}
                />
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
                        onChange={(e) =>
                          setGroupMoveDeltaX(Number(e.target.value))
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
                        onChange={(e) =>
                          setGroupMoveDeltaY(Number(e.target.value))
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
        </Panel>
      </ScrollColumn>

      <Panel flex={1} minHeight={0}>
        <PanelHeader>
          <PanelHeaderRow>
            <PanelTitle>画面プレビュー</PanelTitle>
            <ProjectActions actions={projectActions} onImport={handleImport} />
          </PanelHeaderRow>

          <ZoomControlsRow>
            <Badge tone="neutral">{`${screenZoomLevel}x`}</Badge>
            <ToolButton
              type="button"
              aria-label="画面ズーム縮小"
              onClick={handleZoomOut}
            >
              -
            </ToolButton>
            <ToolButton
              type="button"
              aria-label="画面ズーム拡大"
              onClick={handleZoomIn}
            >
              +
            </ToolButton>
          </ZoomControlsRow>
        </PanelHeader>

        <PreviewViewport
          ref={setViewportRef}
          aria-label="画面プレビューキャンバスビュー"
          onWheel={handleViewportWheel}
          onPointerDown={handleViewportPointerDown}
          onPointerMove={handleViewportPointerMove}
          onPointerUp={handleViewportPointerEnd}
          onPointerCancel={handleViewportPointerEnd}
          onMouseDown={(event: React.MouseEvent<HTMLDivElement>) => {
            if (event.button === 1) {
              event.preventDefault();
            }
          }}
          active={O.isSome(viewportPanState)}
        >
          <PreviewCanvasWrap>
            <ScreenCanvas
              ariaLabel="画面プレビューキャンバス"
              scale={screenZoomLevel}
              showGrid={true}
            />
          </PreviewCanvasWrap>
        </PreviewViewport>

        {scanReport.ok === false && (
          <WarningList>
            {scanReport.errors.map((error: string) => (
              <DetailRow key={error}>
                <DetailKey>警告</DetailKey>
                <DetailValue>{error}</DetailValue>
              </DetailRow>
            ))}
          </WarningList>
        )}
      </Panel>
    </SplitLayout>
  );
};
