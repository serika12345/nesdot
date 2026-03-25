import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React, { useMemo, useState } from "react";
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
  SelectInput,
  SplitLayout,
  ToolButton,
} from "../App.styles";
import {
  buildCharacterPreviewHexGrid,
  CharacterCell,
  CharacterSet,
} from "../../domain/characters/characterSet";
import { useCharacterState } from "../../application/state/characterStore";
import { useProjectState } from "../../application/state/projectStore";

const toCellDisplayValue = (cell: CharacterCell): string =>
  cell.kind === "empty" ? "" : String(cell.spriteIndex);

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

const createCellLabel = (row: number, col: number): string =>
  `r${row + 1} c${col + 1}`;

type CharacterPreviewState =
  | { kind: "none" }
  | { kind: "error"; message: string }
  | { kind: "ready"; characterSet: CharacterSet; grid: string[][] };

const PREVIEW_PIXEL_SIZE = 6;
const PREVIEW_TRANSPARENT_HEX = "#00000000";

export const CharacterMode: React.FC = () => {
  const [newName, setNewName] = useState("New Character");
  const [newRows, setNewRows] = useState(2);
  const [newCols, setNewCols] = useState(2);

  const characterSets = useCharacterState((s) => s.characterSets);
  const selectedCharacterId = useCharacterState((s) => s.selectedCharacterId);
  const createSet = useCharacterState((s) => s.createSet);
  const selectSet = useCharacterState((s) => s.selectSet);
  const renameSet = useCharacterState((s) => s.renameSet);
  const resizeSet = useCharacterState((s) => s.resizeSet);
  const setCell = useCharacterState((s) => s.setCell);
  const deleteSet = useCharacterState((s) => s.deleteSet);
  const sprites = useProjectState((s) => s.sprites);
  const spritePalettes = useProjectState((s) => s.nes.spritePalettes);

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

  const handleCreate = () => {
    if (newRows <= 0 || newCols <= 0) {
      return;
    }
    createSet({
      name: newName,
      rows: newRows,
      cols: newCols,
    });
  };

  const handleCellChange = (
    setId: string,
    cellIndex: number,
    rawValue: string,
  ) => {
    const parsed = toNumber(rawValue);

    pipe(
      parsed,
      O.match(
        () => setCell(setId, cellIndex, { kind: "empty" }),
        (spriteIndex) => {
          const isInRange = spriteIndex >= 0 && spriteIndex < 64;
          if (isInRange === false) {
            return;
          }
          setCell(setId, cellIndex, { kind: "sprite", spriteIndex });
        },
      ),
    );
  };

  return (
    <SplitLayout>
      <Panel css={{ gridTemplateRows: "auto minmax(0, 1fr)" }}>
        <PanelHeader>
          <PanelTitle>キャラクター編集</PanelTitle>
        </PanelHeader>

        <ScrollArea css={{ display: "grid", gap: 14, alignContent: "start" }}>
          <FieldGrid css={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
            <Field>
              <FieldLabel>名前</FieldLabel>
              <NumberInput
                as="input"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>行</FieldLabel>
              <NumberInput
                type="number"
                value={newRows}
                min={1}
                max={16}
                onChange={(e) => setNewRows(Number(e.target.value))}
              />
            </Field>
            <Field>
              <FieldLabel>列</FieldLabel>
              <NumberInput
                type="number"
                value={newCols}
                min={1}
                max={16}
                onChange={(e) => setNewCols(Number(e.target.value))}
              />
            </Field>
            <div css={{ display: "grid", alignItems: "end" }}>
              <ToolButton type="button" tone="primary" onClick={handleCreate}>
                セットを作成
              </ToolButton>
            </div>
          </FieldGrid>

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
                    {characterSet.name} ({characterSet.rows}x{characterSet.cols}
                    )
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
                  キャラクターセットを作成または選択してください。
                </HelperText>
              ),
              (characterSet) => (
                <>
                  <FieldGrid
                    css={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}
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
                    <Field>
                      <FieldLabel>行数</FieldLabel>
                      <NumberInput
                        type="number"
                        min={1}
                        max={16}
                        value={characterSet.rows}
                        onChange={(e) =>
                          resizeSet(
                            characterSet.id,
                            Number(e.target.value),
                            characterSet.cols,
                          )
                        }
                      />
                    </Field>
                    <Field>
                      <FieldLabel>列数</FieldLabel>
                      <NumberInput
                        type="number"
                        min={1}
                        max={16}
                        value={characterSet.cols}
                        onChange={(e) =>
                          resizeSet(
                            characterSet.id,
                            characterSet.rows,
                            Number(e.target.value),
                          )
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
                      <FieldLabel>セル設定 (0-63)</FieldLabel>
                      <Badge tone="accent">
                        {characterSet.rows}x{characterSet.cols}
                      </Badge>
                    </DetailRow>
                  </DetailList>

                  <div
                    css={{
                      display: "grid",
                      gridTemplateColumns: `repeat(${characterSet.cols}, minmax(0, 1fr))`,
                      gap: 8,
                    }}
                  >
                    {characterSet.cells.map((cell, index) => {
                      const row = Math.floor(index / characterSet.cols);
                      const col = index % characterSet.cols;
                      return (
                        <Field key={[characterSet.id, `${index}`].join("-")}>
                          <FieldLabel>{createCellLabel(row, col)}</FieldLabel>
                          <NumberInput
                            type="number"
                            min={0}
                            max={63}
                            value={toCellDisplayValue(cell)}
                            onChange={(e) =>
                              handleCellChange(
                                characterSet.id,
                                index,
                                e.target.value,
                              )
                            }
                            placeholder="empty"
                          />
                          <DetailValue css={{ justifySelf: "start" }}>
                            {cell.kind === "empty"
                              ? "未設定"
                              : `sprite #${cell.spriteIndex}`}
                          </DetailValue>
                        </Field>
                      );
                    })}
                  </div>
                </>
              ),
            ),
          )}
        </ScrollArea>
      </Panel>

      <Panel css={{ display: "grid", alignContent: "start", gap: 14 }}>
        <PanelHeader>
          <PanelHeaderRow>
            <PanelTitle>キャラクタープレビュー</PanelTitle>
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
                  {previewState.characterSet.cols * 8}x
                  {previewState.grid.length}
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
                  gridTemplateColumns: `repeat(${previewState.characterSet.cols * 8}, ${PREVIEW_PIXEL_SIZE}px)`,
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
              キャラクターセットは既存スプライト番号の行列です。画面配置では基準座標から8px刻みで展開されます。
            </DetailValue>
          </DetailRow>
          <DetailRow>
            <DetailValue css={{ textAlign: "left" }}>
              セルを空欄にすると、その位置にはスプライトを配置しません。
            </DetailValue>
          </DetailRow>
        </DetailList>
      </Panel>
    </SplitLayout>
  );
};
