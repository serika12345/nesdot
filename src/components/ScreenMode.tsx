import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React, { useState } from "react";
import {
  CanvasViewport,
  CollapseToggle,
  DetailKey,
  DetailList,
  DetailRow,
  DetailValue,
  Field,
  FieldGrid,
  FieldLabel,
  HelperText,
  MetricCard,
  MetricGrid,
  MetricLabel,
  MetricValue,
  NumberInput,
  Panel,
  PanelHeader,
  PanelHeaderRow,
  PanelTitle,
  ScrollColumn,
  SelectInput,
  SplitLayout,
  ToolButton,
} from "../App.styles";
import useExportImage from "../hooks/useExportImage";
import useImportImage from "../hooks/useImportImage";
import {
  MAX_SCREEN_SPRITES,
  MAX_SPRITES_PER_SCANLINE,
  scanNesSpriteConstraints,
} from "../screen/constraints";
import { mergeScreenIntoNesOam } from "../screen/oamSync";
import {
  getHexArrayForScreen,
  Screen,
  SpriteInScreen,
  SpritePriority,
  useProjectState,
} from "../store/projectState";
import { ProjectActions } from "./ProjectActions";
import { ScreenCanvas } from "./ScreenCanvas";
import { ChevronIcon } from "./ui/Icons";

export const ScreenMode: React.FC = () => {
  const [spriteNumber, setSpriteNumber] = useState(0);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [selectedSpriteIndex, setSelectedSpriteIndex] = useState<
    O.Option<number>
  >(() =>
    useProjectState.getState().screen.sprites.length > 0 ? O.some(0) : O.none,
  );
  const [isPlacementOpen, setIsPlacementOpen] = useState(true);
  const [isSelectionOpen, setIsSelectionOpen] = useState(false);
  const screen = useProjectState((s) => s.screen);
  const nes = useProjectState((s) => s.nes);
  const sprites = useProjectState((s) => s.sprites);
  const spritesOnScreen = useProjectState((s) => s.screen.sprites);
  const projectState = useProjectState((s) => s);
  const { exportPng, exportSvgSimple, exportJSON } = useExportImage();
  const { importJSON } = useImportImage();
  const scan = (
    checkeeScreen = useProjectState.getState().screen,
    checkeeNes = useProjectState.getState().nes,
  ) =>
    scanNesSpriteConstraints(mergeScreenIntoNesOam(checkeeNes, checkeeScreen));

  const setScreenAndSyncNes = (nextScreen: Screen, nextNes = nes): void => {
    useProjectState.setState({
      screen: nextScreen,
      nes: mergeScreenIntoNesOam(nextNes, nextScreen),
    });
  };

  const handleImport = async () => {
    try {
      await importJSON((data) => {
        const syncedNes = mergeScreenIntoNesOam(data.nes, data.screen);
        useProjectState.setState({
          ...data,
          nes: syncedNes,
        });
        setSelectedSpriteIndex(
          data.screen.sprites.length > 0 ? O.some(0) : O.none,
        );

        const result = scan(data.screen, syncedNes);
        if (result.ok === false) {
          alert(
            "インポートしたデータに制約違反があります:\n" +
              result.errors.join("\n"),
          );
        }
      });
    } catch (err) {
      alert("インポートに失敗しました: " + err);
    }
  };

  const handleAddSprite = () => {
    const spriteTileOption = O.fromNullable(sprites[spriteNumber]);
    if (O.isNone(spriteTileOption)) {
      alert("指定されたスプライト番号のスプライトが存在しません");
      return;
    }
    const spriteTile = spriteTileOption.value;

    const candidate: SpriteInScreen = {
      ...spriteTile,
      x,
      y,
      spriteIndex: spriteNumber,
      priority: "front",
      flipH: false,
      flipV: false,
    };
    const newScreen = {
      ...screen,
      sprites: [...screen.sprites, candidate],
    };

    const report = scan(newScreen);
    if (report.ok === false) {
      alert(
        "スプライトの追加に失敗しました。制約違反:\n" +
          report.errors.join("\n"),
      );
      return;
    }

    setScreenAndSyncNes(newScreen);
    if (O.isNone(selectedSpriteIndex)) {
      setSelectedSpriteIndex(O.some(newScreen.sprites.length - 1));
    }
    alert(`スプライト#${spriteNumber}を(${x},${y})に追加しました`);
  };

  const activeSprite = pipe(
    selectedSpriteIndex,
    O.chain((index) => O.fromNullable(spritesOnScreen[index])),
  );
  const selectedIndexValue = pipe(
    selectedSpriteIndex,
    O.getOrElse(() => -1),
  );
  const scanReport = scan(screen, nes);

  return (
    <SplitLayout>
      <ScrollColumn>
        <Panel>
          <PanelHeader>
            <PanelTitle>スクリーン配置</PanelTitle>
          </PanelHeader>

          <MetricGrid
            css={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}
          >
            <MetricCard
              css={{
                background: "transparent",
                border: "none",
                boxShadow: "none",
                padding: 0,
              }}
            >
              <MetricLabel>配置中</MetricLabel>
              <MetricValue>
                {spritesOnScreen.length}/{MAX_SCREEN_SPRITES}
              </MetricValue>
            </MetricCard>
            <MetricCard
              css={{
                background: "transparent",
                border: "none",
                boxShadow: "none",
                padding: 0,
              }}
            >
              <MetricLabel>画面</MetricLabel>
              <MetricValue>
                {screen.width}×{screen.height}
              </MetricValue>
            </MetricCard>
            <MetricCard
              css={{
                gridColumn: "1 / -1",
                background: "transparent",
                border: "none",
                boxShadow: "none",
                padding: 0,
              }}
            >
              <MetricLabel>制約</MetricLabel>
              <MetricValue css={{ fontSize: 18, whiteSpace: "nowrap" }}>
                1ライン最大 {MAX_SPRITES_PER_SCANLINE}
              </MetricValue>
            </MetricCard>
          </MetricGrid>

          {!scanReport.ok && (
            <HelperText>
              制約違反があります。必要なら「選択中のスプライト」を開いて調整してください。
            </HelperText>
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
                <ChevronIcon open={isPlacementOpen} />
              </CollapseToggle>
            </PanelHeaderRow>
            <PanelTitle>スプライト追加</PanelTitle>
          </PanelHeader>

          {isPlacementOpen ? (
            <FieldGrid
              css={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}
            >
              <Field>
                <FieldLabel>スプライト番号</FieldLabel>
                <NumberInput
                  type="number"
                  min={0}
                  max={64}
                  value={spriteNumber}
                  onChange={(e) => setSpriteNumber(Number(e.target.value))}
                />
              </Field>
              <Field>
                <FieldLabel>X 座標</FieldLabel>
                <NumberInput
                  type="number"
                  min={0}
                  max={256}
                  value={x}
                  onChange={(e) => setX(Number(e.target.value))}
                />
              </Field>
              <Field>
                <FieldLabel>Y 座標</FieldLabel>
                <NumberInput
                  type="number"
                  min={0}
                  max={240}
                  value={y}
                  onChange={(e) => setY(Number(e.target.value))}
                />
              </Field>
              <div css={{ display: "grid", alignItems: "end" }}>
                <ToolButton
                  type="button"
                  tone="primary"
                  onClick={handleAddSprite}
                  css={{ minHeight: 48 }}
                >
                  スプライトを追加
                </ToolButton>
              </div>
            </FieldGrid>
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
                <ChevronIcon open={isSelectionOpen} />
              </CollapseToggle>
            </PanelHeaderRow>
            <PanelTitle>選択中のスプライト</PanelTitle>
          </PanelHeader>

          {isSelectionOpen ? (
            <>
              <Field>
                <FieldLabel>スプライト一覧</FieldLabel>
                <div css={{ position: "relative" }}>
                  <SelectInput
                    css={{ paddingRight: 56 }}
                    onChange={(e) => {
                      const next = e.target.value;
                      setSelectedSpriteIndex(
                        next === "" ? O.none : O.some(Number(next)),
                      );
                    }}
                    value={pipe(
                      selectedSpriteIndex,
                      O.match(
                        () => "",
                        (index) => String(index),
                      ),
                    )}
                  >
                    {spritesOnScreen.length === 0 && (
                      <option value="">スプライトが配置されていません</option>
                    )}
                    {spritesOnScreen.map((sprite, index) => (
                      <option key={index} value={index}>
                        {`#${index} spriteIndex:${sprite.spriteIndex} ${sprite.width}x${sprite.height} @ ${sprite.x},${sprite.y} ${sprite.priority === "behindBg" ? "behind" : "front"}`}
                      </option>
                    ))}
                  </SelectInput>
                  <span
                    aria-hidden="true"
                    css={{
                      position: "absolute",
                      right: 18,
                      top: "50%",
                      width: 0,
                      height: 0,
                      borderLeft: "5px solid transparent",
                      borderRight: "5px solid transparent",
                      borderTop: "7px solid #334155",
                      transform: "translateY(-35%)",
                      pointerEvents: "none",
                    }}
                  />
                </div>
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
                        <DetailRow>
                          <DetailKey>元スプライト</DetailKey>
                          <DetailValue>
                            spriteIndex {selectedSprite.spriteIndex}
                          </DetailValue>
                        </DetailRow>
                        <DetailRow>
                          <DetailKey>サイズ</DetailKey>
                          <DetailValue>
                            {selectedSprite.width}×{selectedSprite.height}
                          </DetailValue>
                        </DetailRow>
                        <DetailRow>
                          <DetailKey>優先度</DetailKey>
                          <DetailValue>
                            {selectedSprite.priority === "behindBg"
                              ? "背景の後ろ"
                              : "背景の前"}
                          </DetailValue>
                        </DetailRow>
                        <DetailRow>
                          <DetailKey>反転</DetailKey>
                          <DetailValue>
                            {`${selectedSprite.flipH === true ? "H" : "-"} / ${selectedSprite.flipV === true ? "V" : "-"}`}
                          </DetailValue>
                        </DetailRow>
                      </DetailList>

                      <FieldGrid
                        css={{
                          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                        }}
                      >
                        <Field>
                          <FieldLabel>Position X</FieldLabel>
                          <NumberInput
                            type="number"
                            value={selectedSprite.x}
                            onChange={(e) => {
                              const newX = Number(e.target.value);
                              const newSprites = spritesOnScreen.map((s, i) =>
                                i === selectedIndexValue
                                  ? { ...s, x: newX }
                                  : s,
                              );
                              const newScreen = {
                                ...screen,
                                sprites: newSprites,
                              };
                              const report = scan(newScreen);
                              if (report.ok === false) {
                                alert(
                                  "位置の更新に失敗しました。制約違反:\n" +
                                    report.errors.join("\n"),
                                );
                                return;
                              }
                              setScreenAndSyncNes(newScreen);
                            }}
                          />
                        </Field>
                        <Field>
                          <FieldLabel>Position Y</FieldLabel>
                          <NumberInput
                            type="number"
                            value={selectedSprite.y}
                            onChange={(e) => {
                              const newY = Number(e.target.value);
                              const newSprites = spritesOnScreen.map((s, i) =>
                                i === selectedIndexValue
                                  ? { ...s, y: newY }
                                  : s,
                              );
                              const newScreen = {
                                ...screen,
                                sprites: newSprites,
                              };
                              const report = scan(newScreen);
                              if (report.ok === false) {
                                alert(
                                  "位置の更新に失敗しました。制約違反:\n" +
                                    report.errors.join("\n"),
                                );
                                return;
                              }
                              setScreenAndSyncNes(newScreen);
                            }}
                          />
                        </Field>
                        <Field>
                          <FieldLabel>Priority</FieldLabel>
                          <div css={{ position: "relative" }}>
                            <SelectInput
                              css={{ paddingRight: 56 }}
                              value={selectedSprite.priority}
                              onChange={(e) => {
                                const nextPriority: SpritePriority =
                                  e.target.value === "behindBg"
                                    ? "behindBg"
                                    : "front";
                                const newSprites = spritesOnScreen.map(
                                  (s, i) =>
                                    i === selectedIndexValue
                                      ? { ...s, priority: nextPriority }
                                      : s,
                                );
                                const newScreen = {
                                  ...screen,
                                  sprites: newSprites,
                                };
                                const report = scan(newScreen);
                                if (report.ok === false) {
                                  alert(
                                    "優先度の更新に失敗しました。制約違反:\n" +
                                      report.errors.join("\n"),
                                  );
                                  return;
                                }
                                setScreenAndSyncNes(newScreen);
                              }}
                            >
                              <option value="front">前面</option>
                              <option value="behindBg">背景の後ろ</option>
                            </SelectInput>
                            <span
                              aria-hidden="true"
                              css={{
                                position: "absolute",
                                right: 18,
                                top: "50%",
                                width: 0,
                                height: 0,
                                borderLeft: "5px solid transparent",
                                borderRight: "5px solid transparent",
                                borderTop: "7px solid #334155",
                                transform: "translateY(-35%)",
                                pointerEvents: "none",
                              }}
                            />
                          </div>
                        </Field>
                        <Field>
                          <FieldLabel>Flip</FieldLabel>
                          <FieldGrid
                            css={{
                              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                            }}
                          >
                            <ToolButton
                              type="button"
                              active={selectedSprite.flipH === true}
                              onClick={() => {
                                const newSprites = spritesOnScreen.map(
                                  (s, i) =>
                                    i === selectedIndexValue
                                      ? { ...s, flipH: s.flipH === false }
                                      : s,
                                );
                                const newScreen = {
                                  ...screen,
                                  sprites: newSprites,
                                };
                                setScreenAndSyncNes(newScreen);
                              }}
                            >
                              H反転
                            </ToolButton>
                            <ToolButton
                              type="button"
                              active={selectedSprite.flipV === true}
                              onClick={() => {
                                const newSprites = spritesOnScreen.map(
                                  (s, i) =>
                                    i === selectedIndexValue
                                      ? { ...s, flipV: s.flipV === false }
                                      : s,
                                );
                                const newScreen = {
                                  ...screen,
                                  sprites: newSprites,
                                };
                                setScreenAndSyncNes(newScreen);
                              }}
                            >
                              V反転
                            </ToolButton>
                          </FieldGrid>
                        </Field>
                      </FieldGrid>

                      <ToolButton
                        type="button"
                        tone="danger"
                        onClick={() => {
                          const newSprites = spritesOnScreen.filter(
                            (_, i) => i !== selectedIndexValue,
                          );
                          const newScreen = { ...screen, sprites: newSprites };
                          const report = scan(newScreen);
                          if (report.ok === false) {
                            alert(
                              "削除後の状態で制約違反が検出されました:\n" +
                                report.errors.join("\n"),
                            );
                          }
                          setScreenAndSyncNes(newScreen);
                          setSelectedSpriteIndex(O.none);
                        }}
                        css={{ minHeight: 46 }}
                      >
                        このスプライトを削除
                      </ToolButton>
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
      </ScrollColumn>

      <Panel css={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <PanelHeader>
          <PanelHeaderRow>
            <PanelTitle>画面プレビュー</PanelTitle>
            <ProjectActions
              actions={[
                {
                  label: "PNGエクスポート",
                  onSelect: () => exportPng(getHexArrayForScreen(screen)),
                },
                {
                  label: "SVGエクスポート",
                  onSelect: () => exportSvgSimple(getHexArrayForScreen(screen)),
                },
                { label: "保存", onSelect: () => exportJSON(projectState) },
              ]}
              onImport={handleImport}
            />
          </PanelHeaderRow>
        </PanelHeader>

        <CanvasViewport css={{ flex: 1, minHeight: 0, placeItems: "center" }}>
          <ScreenCanvas scale={2} showGrid={true} />
        </CanvasViewport>

        {scanReport.ok === false && (
          <DetailList css={{ flexShrink: 0 }}>
            {scanReport.errors.map((error: string) => (
              <DetailRow key={error}>
                <DetailKey>警告</DetailKey>
                <DetailValue>{error}</DetailValue>
              </DetailRow>
            ))}
          </DetailList>
        )}
      </Panel>
    </SplitLayout>
  );
};
