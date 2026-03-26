import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React, { useMemo, useState } from "react";
import { useCharacterState } from "../../application/state/characterStore";
import { useProjectState } from "../../application/state/projectStore";
import {
  buildCharacterPreviewHexGrid,
  CharacterSet,
  CharacterSprite,
} from "../../domain/characters/characterSet";
import useExportImage from "../../infrastructure/browser/useExportImage";
import {
  Badge,
  DetailList,
  DetailRow,
  DetailValue,
  Field,
  FieldGrid,
  FieldLabel,
  HelperText,
  NumberInput,
  Panel,
  PanelHeader,
  PanelHeaderRow,
  PanelTitle,
  ScrollArea,
  SegmentedButton,
  SegmentedControl,
  SelectInput,
  SplitLayout,
  ToolButton,
} from "../App.styles";
import {
  CharacterEditorView,
  resolveCharacterEditorView,
} from "./characterEditorView";
import { ProjectActions } from "./ProjectActions";

const toNumber = (value: string): O.Option<number> => {
  if (value === "") {
    return O.none;
  }

  const parsed = Number(value);
  if (Number.isInteger(parsed) === false) {
    return O.none;
  }

  return O.some(parsed);
};

const getPreviewGridWidth = (grid: string[][]): number =>
  pipe(
    O.fromNullable(grid[0]),
    O.match(
      () => 0,
      (firstRow) => firstRow.length,
    ),
  );

const isInRange = (value: number, min: number, max: number): boolean =>
  value >= min && value <= max;

type CharacterPreviewState =
  | { kind: "none" }
  | { kind: "error"; message: string }
  | { kind: "ready"; characterSet: CharacterSet; grid: string[][] };

const PREVIEW_PIXEL_SIZE = 6;
const PREVIEW_TRANSPARENT_HEX = "#00000000";

export const CharacterMode: React.FC = () => {
  const [requestedEditorView, setRequestedEditorView] =
    useState<CharacterEditorView>("create");
  const [newName, setNewName] = useState("New Character");
  const [newSpriteIndex, setNewSpriteIndex] = useState(0);
  const [newSpriteX, setNewSpriteX] = useState(0);
  const [newSpriteY, setNewSpriteY] = useState(0);
  const [newSpriteLayer, setNewSpriteLayer] = useState(0);

  const characterSets = useCharacterState((s) => s.characterSets);
  const selectedCharacterId = useCharacterState((s) => s.selectedCharacterId);
  const createSet = useCharacterState((s) => s.createSet);
  const selectSet = useCharacterState((s) => s.selectSet);
  const renameSet = useCharacterState((s) => s.renameSet);
  const addSprite = useCharacterState((s) => s.addSprite);
  const setSprite = useCharacterState((s) => s.setSprite);
  const removeSprite = useCharacterState((s) => s.removeSprite);
  const deleteSet = useCharacterState((s) => s.deleteSet);
  const sprites = useProjectState((s) => s.sprites);
  const spritePalettes = useProjectState((s) => s.nes.spritePalettes);
  const { exportPng, exportSvgSimple, exportCharacterJson } = useExportImage();

  const editorView = resolveCharacterEditorView(
    requestedEditorView,
    characterSets.length,
  );

  const activeSet = useMemo(
    () =>
      pipe(
        selectedCharacterId,
        O.chain((id) =>
          O.fromNullable(
            characterSets.find((characterSet) => characterSet.id === id),
          ),
        ),
      ),
    [characterSets, selectedCharacterId],
  );

  const previewState: CharacterPreviewState = useMemo(
    () =>
      pipe(
        activeSet,
        O.match(
          (): CharacterPreviewState => ({ kind: "none" }),
          (characterSet): CharacterPreviewState => {
            const preview = buildCharacterPreviewHexGrid(characterSet, {
              sprites,
              palettes: spritePalettes,
              transparentHex: PREVIEW_TRANSPARENT_HEX,
            });

            if (E.isLeft(preview)) {
              return { kind: "error", message: preview.left };
            }

            return {
              kind: "ready",
              characterSet,
              grid: preview.right,
            };
          },
        ),
      ),
    [activeSet, sprites, spritePalettes],
  );

  const previewWidth =
    previewState.kind === "ready" ? getPreviewGridWidth(previewState.grid) : 0;

  const handleCreate = () => {
    createSet({ name: newName });
    setRequestedEditorView("edit");
  };

  const handleAddSprite = (setId: string) => {
    if (
      isInRange(newSpriteIndex, 0, 63) === false ||
      isInRange(newSpriteX, 0, 255) === false ||
      isInRange(newSpriteY, 0, 239) === false ||
      isInRange(newSpriteLayer, 0, 63) === false
    ) {
      return;
    }

    addSprite(setId, {
      spriteIndex: newSpriteIndex,
      x: newSpriteX,
      y: newSpriteY,
      layer: newSpriteLayer,
    });
  };

  const handleUpdateSprite = (
    setId: string,
    index: number,
    current: CharacterSprite,
    field: "spriteIndex" | "x" | "y" | "layer",
    rawValue: string,
  ) => {
    const parsed = toNumber(rawValue);
    if (O.isNone(parsed)) {
      return;
    }

    const nextValue = parsed.value;
    const nextSprite: CharacterSprite = {
      spriteIndex: field === "spriteIndex" ? nextValue : current.spriteIndex,
      x: field === "x" ? nextValue : current.x,
      y: field === "y" ? nextValue : current.y,
      layer: field === "layer" ? nextValue : current.layer,
    };

    const isValid =
      isInRange(nextSprite.spriteIndex, 0, 63) &&
      isInRange(nextSprite.x, 0, 255) &&
      isInRange(nextSprite.y, 0, 239) &&
      isInRange(nextSprite.layer, 0, 63);

    if (isValid === false) {
      return;
    }

    setSprite(setId, index, nextSprite);
  };

  return (
    <SplitLayout>
      <Panel css={{ gridTemplateRows: "auto minmax(0, 1fr)" }}>
        <PanelHeader>
          <PanelTitle>キャラクター編集</PanelTitle>
        </PanelHeader>

        <ScrollArea css={{ display: "grid", gap: 14, alignContent: "start" }}>
          <SegmentedControl>
            <SegmentedButton
              type="button"
              active={editorView === "create"}
              onClick={() => setRequestedEditorView("create")}
            >
              1. 作成
            </SegmentedButton>
            <SegmentedButton
              type="button"
              active={editorView === "edit"}
              onClick={() => setRequestedEditorView("edit")}
            >
              2. 編集
            </SegmentedButton>
            <SegmentedButton
              type="button"
              active={false}
              onClick={() => setRequestedEditorView("edit")}
            >
              {characterSets.length} セット
            </SegmentedButton>
          </SegmentedControl>

          {editorView === "create" && (
            <>
              <HelperText>
                新規キャラクターセットを作成します。作成後に座標ベースでスプライトを追加できます。
              </HelperText>
              <FieldGrid
                css={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}
              >
                <Field>
                  <FieldLabel>名前</FieldLabel>
                  <NumberInput
                    as="input"
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </Field>
                <div css={{ display: "grid", alignItems: "end" }}>
                  <ToolButton
                    type="button"
                    tone="primary"
                    onClick={handleCreate}
                  >
                    セットを作成
                  </ToolButton>
                </div>
              </FieldGrid>
            </>
          )}

          {editorView === "edit" && (
            <>
              <Field>
                <FieldLabel>セット一覧</FieldLabel>
                <div css={{ position: "relative" }}>
                  <SelectInput
                    css={{ paddingRight: 56 }}
                    onChange={(e) => {
                      const value = e.target.value;
                      selectSet(value === "" ? O.none : O.some(value));
                    }}
                    value={pipe(
                      selectedCharacterId,
                      O.match(
                        () => "",
                        (value) => value,
                      ),
                    )}
                  >
                    {characterSets.length === 0 && (
                      <option value="">キャラクターセットがありません</option>
                    )}
                    {characterSets.map((characterSet) => (
                      <option key={characterSet.id} value={characterSet.id}>
                        {`${characterSet.name} (${characterSet.sprites.length} sprites)`}
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
                activeSet,
                O.match(
                  () => (
                    <HelperText>
                      編集するキャラクターセットを選択してください。
                    </HelperText>
                  ),
                  (characterSet) => (
                    <>
                      <FieldGrid
                        css={{
                          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                        }}
                      >
                        <Field>
                          <FieldLabel>セット名</FieldLabel>
                          <NumberInput
                            as="input"
                            type="text"
                            value={characterSet.name}
                            onChange={(e) =>
                              renameSet(characterSet.id, e.target.value)
                            }
                          />
                        </Field>
                        <div css={{ display: "grid", alignItems: "end" }}>
                          <ToolButton
                            type="button"
                            tone="danger"
                            onClick={() => deleteSet(characterSet.id)}
                          >
                            セットを削除
                          </ToolButton>
                        </div>
                      </FieldGrid>

                      <DetailList>
                        <DetailRow>
                          <FieldLabel>スプライト一覧</FieldLabel>
                          <Badge tone="accent">
                            {characterSet.sprites.length} sprites
                          </Badge>
                        </DetailRow>
                      </DetailList>

                      <FieldGrid
                        css={{
                          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                        }}
                      >
                        <Field>
                          <FieldLabel>sprite</FieldLabel>
                          <NumberInput
                            type="number"
                            min={0}
                            max={63}
                            value={newSpriteIndex}
                            onChange={(e) =>
                              setNewSpriteIndex(Number(e.target.value))
                            }
                          />
                        </Field>
                        <Field>
                          <FieldLabel>x</FieldLabel>
                          <NumberInput
                            type="number"
                            min={0}
                            max={255}
                            value={newSpriteX}
                            onChange={(e) =>
                              setNewSpriteX(Number(e.target.value))
                            }
                          />
                        </Field>
                        <Field>
                          <FieldLabel>y</FieldLabel>
                          <NumberInput
                            type="number"
                            min={0}
                            max={239}
                            value={newSpriteY}
                            onChange={(e) =>
                              setNewSpriteY(Number(e.target.value))
                            }
                          />
                        </Field>
                        <Field>
                          <FieldLabel>layer</FieldLabel>
                          <NumberInput
                            type="number"
                            min={0}
                            max={63}
                            value={newSpriteLayer}
                            onChange={(e) =>
                              setNewSpriteLayer(Number(e.target.value))
                            }
                          />
                        </Field>
                        <div css={{ gridColumn: "1 / -1", display: "grid" }}>
                          <ToolButton
                            type="button"
                            tone="primary"
                            onClick={() => handleAddSprite(characterSet.id)}
                          >
                            スプライトを追加
                          </ToolButton>
                        </div>
                      </FieldGrid>

                      <div css={{ display: "grid", gap: 8 }}>
                        {characterSet.sprites.map((sprite, index) => (
                          <Field
                            key={[characterSet.id, `${index}`].join("-")}
                            css={{
                              border: "1px solid rgba(148, 163, 184, 0.2)",
                              borderRadius: 12,
                              padding: 10,
                            }}
                          >
                            <FieldLabel>{`sprite ${index + 1}`}</FieldLabel>
                            <FieldGrid
                              css={{
                                gridTemplateColumns:
                                  "repeat(4, minmax(0, 1fr)) auto",
                                alignItems: "end",
                              }}
                            >
                              <Field>
                                <FieldLabel>sprite</FieldLabel>
                                <NumberInput
                                  type="number"
                                  min={0}
                                  max={63}
                                  value={sprite.spriteIndex}
                                  onChange={(e) =>
                                    handleUpdateSprite(
                                      characterSet.id,
                                      index,
                                      sprite,
                                      "spriteIndex",
                                      e.target.value,
                                    )
                                  }
                                />
                              </Field>
                              <Field>
                                <FieldLabel>x</FieldLabel>
                                <NumberInput
                                  type="number"
                                  min={0}
                                  max={255}
                                  value={sprite.x}
                                  onChange={(e) =>
                                    handleUpdateSprite(
                                      characterSet.id,
                                      index,
                                      sprite,
                                      "x",
                                      e.target.value,
                                    )
                                  }
                                />
                              </Field>
                              <Field>
                                <FieldLabel>y</FieldLabel>
                                <NumberInput
                                  type="number"
                                  min={0}
                                  max={239}
                                  value={sprite.y}
                                  onChange={(e) =>
                                    handleUpdateSprite(
                                      characterSet.id,
                                      index,
                                      sprite,
                                      "y",
                                      e.target.value,
                                    )
                                  }
                                />
                              </Field>
                              <Field>
                                <FieldLabel>layer</FieldLabel>
                                <NumberInput
                                  type="number"
                                  min={0}
                                  max={63}
                                  value={sprite.layer}
                                  onChange={(e) =>
                                    handleUpdateSprite(
                                      characterSet.id,
                                      index,
                                      sprite,
                                      "layer",
                                      e.target.value,
                                    )
                                  }
                                />
                              </Field>
                              <ToolButton
                                type="button"
                                tone="danger"
                                onClick={() =>
                                  removeSprite(characterSet.id, index)
                                }
                              >
                                削除
                              </ToolButton>
                            </FieldGrid>
                          </Field>
                        ))}
                      </div>
                    </>
                  ),
                ),
              )}
            </>
          )}
        </ScrollArea>
      </Panel>

      <Panel css={{ display: "grid", alignContent: "start", gap: 14 }}>
        <PanelHeader>
          <PanelHeaderRow>
            <PanelTitle>キャラクタープレビュー</PanelTitle>
            <ProjectActions
              actions={pipe(
                activeSet,
                O.match(
                  () => [],
                  (characterSet) => [
                    {
                      label: "PNGエクスポート",
                      onSelect: () => {
                        if (previewState.kind !== "ready") {
                          return;
                        }
                        void exportPng(
                          previewState.grid,
                          `${characterSet.name}.png`,
                        );
                      },
                    },
                    {
                      label: "SVGエクスポート",
                      onSelect: () => {
                        if (previewState.kind !== "ready") {
                          return;
                        }
                        void exportSvgSimple(
                          previewState.grid,
                          8,
                          `${characterSet.name}.svg`,
                        );
                      },
                    },
                    {
                      label: "キャラクターJSON書き出し",
                      onSelect: () =>
                        void exportCharacterJson(
                          {
                            characterSets: [characterSet],
                            selectedCharacterId: characterSet.id,
                          },
                          `${characterSet.name}.json`,
                        ),
                    },
                  ],
                ),
              )}
            />
          </PanelHeaderRow>
        </PanelHeader>

        {previewState.kind === "none" && (
          <HelperText>
            プレビューするキャラクターセットを選択してください。
          </HelperText>
        )}

        {previewState.kind === "error" && (
          <HelperText>{`プレビュー生成に失敗しました: ${previewState.message}`}</HelperText>
        )}

        {previewState.kind === "ready" && (
          <>
            <DetailList>
              <DetailRow>
                <FieldLabel>プレビューサイズ</FieldLabel>
                <Badge tone="accent">
                  {previewWidth}x{previewState.grid.length}
                </Badge>
              </DetailRow>
            </DetailList>

            <div
              css={{
                overflow: "auto",
                borderRadius: 18,
                border: "1px solid rgba(148, 163, 184, 0.2)",
                padding: 12,
                background:
                  "linear-gradient(45deg, rgba(148, 163, 184, 0.12) 25%, transparent 25%, transparent 75%, rgba(148, 163, 184, 0.12) 75%), linear-gradient(45deg, rgba(148, 163, 184, 0.12) 25%, transparent 25%, transparent 75%, rgba(148, 163, 184, 0.12) 75%)",
                backgroundSize: "12px 12px",
                backgroundPosition: "0 0, 6px 6px",
              }}
            >
              <div
                css={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${previewWidth}, ${PREVIEW_PIXEL_SIZE}px)`,
                  width: "fit-content",
                }}
              >
                {previewState.grid.map((row, rowIndex) =>
                  row.map((hex, colIndex) => {
                    const isTransparent = hex === PREVIEW_TRANSPARENT_HEX;
                    return (
                      <div
                        key={`preview-${rowIndex}-${colIndex}`}
                        css={{
                          width: PREVIEW_PIXEL_SIZE,
                          height: PREVIEW_PIXEL_SIZE,
                          backgroundColor: isTransparent ? "transparent" : hex,
                        }}
                      />
                    );
                  }),
                )}
              </div>
            </div>
          </>
        )}

        <PanelHeader>
          <PanelHeaderRow>
            <PanelTitle>説明</PanelTitle>
          </PanelHeaderRow>
        </PanelHeader>

        <DetailList>
          <DetailRow>
            <DetailValue css={{ textAlign: "left" }}>
              キャラクターセットは座標指定のスプライト集合です。x/y
              で配置し、layer は小さいほど前面になります。
            </DetailValue>
          </DetailRow>
          <DetailRow>
            <DetailValue css={{ textAlign: "left" }}>
              画面へ追加する際は、スクリーン側でスキャンライン制約を検査します。
            </DetailValue>
          </DetailRow>
        </DetailList>
      </Panel>
    </SplitLayout>
  );
};
