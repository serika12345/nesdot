import { ButtonBase, OutlinedInput, Stack } from "@mui/material";
import { styled } from "@mui/material/styles";
import React from "react";
import {
  type ProjectSpriteSize,
  type SpriteTile,
} from "../../../application/state/projectStore";
import {
  Badge,
  Field,
  FieldLabel,
  PanelHeaderRow,
  ScrollArea,
  ToolButton,
} from "../../App.styles";

type CharacterEditorMode = "compose" | "decompose";

const editorCardStyles = {
  position: "relative",
  zIndex: 1,
  borderRadius: "1.375rem",
  background: "rgba(248, 250, 252, 0.84)",
  border: "0.0625rem solid rgba(148, 163, 184, 0.16)",
  boxShadow: "inset 0 0.0625rem 0 rgba(255, 255, 255, 0.72)",
} satisfies React.CSSProperties;

const EditorCardRoot = styled("div")(editorCardStyles);

const WideToolButton = styled(ToolButton)({
  width: "100%",
});

const LibraryScrollArea = styled(ScrollArea)({
  scrollbarGutter: "stable",
});

const OptionGrid = styled("div")({
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "1.25rem",
});

const LibraryGrid = styled("div")({
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "1.25rem",
});

const LibrarySpriteButton = styled(ButtonBase, {
  shouldForwardProp: (prop) => prop !== "dragging" && prop !== "draggableState",
})<{ dragging?: boolean; draggableState?: boolean }>(
  ({ dragging, draggableState }) => ({
    appearance: "none",
    minHeight: "7.375rem",
    padding: "0.75rem",
    borderRadius: "1.125rem",
    border:
      dragging === true
        ? "0.0625rem solid rgba(15, 118, 110, 0.42)"
        : "0.0625rem solid rgba(148, 163, 184, 0.2)",
    background:
      dragging === true
        ? "rgba(240, 253, 250, 0.96)"
        : "linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(241, 245, 249, 0.94))",
    color: "var(--ink-strong)",
    cursor: draggableState === true ? "grab" : "default",
    userSelect: "none",
    touchAction: "none",
    transition:
      "transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease",
    boxShadow:
      dragging === true
        ? "0 1rem 1.875rem rgba(15, 118, 110, 0.16)"
        : "0 0.625rem 1.125rem rgba(15, 23, 42, 0.08)",
  }),
);

const LibrarySpriteTitle = styled("span")({
  fontSize: "0.6875rem",
  fontWeight: 800,
  letterSpacing: "0.08em",
  color: "var(--ink-soft)",
});

const LibrarySpritePreviewFrame = styled(Stack)({
  width: "5.5rem",
  minHeight: "4rem",
  borderRadius: "0.875rem",
  background:
    "linear-gradient(180deg, rgba(15, 23, 42, 0.06), rgba(148, 163, 184, 0.08))",
});

interface CharacterModeComposeSidebarProps {
  activeSetAvailable: boolean;
  activeSetName: string;
  editorMode: CharacterEditorMode;
  projectSpriteSize: ProjectSpriteSize;
  projectSpriteSizeLocked: boolean;
  sprites: SpriteTile[];
  isLibraryDraggable: boolean;
  isSpriteDragging: (spriteIndex: number) => boolean;
  onSetNameChange: (name: string) => void;
  onEditorModeChange: (mode: CharacterEditorMode) => void;
  onProjectSpriteSizeChange: (size: ProjectSpriteSize) => void;
  onLibraryPointerDown: (
    event: React.PointerEvent<HTMLButtonElement>,
    spriteIndex: number,
  ) => void;
  renderSpritePixels: (spriteIndex: number, scale: number) => React.ReactNode;
  libraryPreviewScale: number;
}

/**
 * キャラクター合成モード用のサイドバーを描画します。
 * セット名、編集モード、スプライト単位、ライブラリ一覧をまとめて編集できる導線を提供します。
 */
export const CharacterModeComposeSidebar: React.FC<
  CharacterModeComposeSidebarProps
> = ({
  activeSetAvailable,
  activeSetName,
  editorMode,
  projectSpriteSize,
  projectSpriteSizeLocked,
  sprites,
  isLibraryDraggable,
  isSpriteDragging,
  onSetNameChange,
  onEditorModeChange,
  onProjectSpriteSizeChange,
  onLibraryPointerDown,
  renderSpritePixels,
  libraryPreviewScale,
}) => {
  return (
    <Stack
      minWidth={0}
      minHeight={0}
      spacing="1rem"
      overflow="auto"
      pr="0.25rem"
    >
      <Stack
        component={EditorCardRoot}
        minHeight={0}
        spacing="0.875rem"
        p="1rem"
        useFlexGap
      >
        <Field>
          <FieldLabel>セット名</FieldLabel>
          <OutlinedInput
            type="text"
            value={activeSetName}
            disabled={activeSetAvailable === false}
            inputProps={{
              "aria-label": "セット名",
            }}
            onChange={(event) => onSetNameChange(event.target.value)}
          />
        </Field>

        <Stack component="label" spacing="0.625rem">
          <FieldLabel>編集モード</FieldLabel>
          <OptionGrid>
            <WideToolButton
              type="button"
              aria-label="編集モード 合成"
              active={editorMode === "compose"}
              onClick={() => onEditorModeChange("compose")}
            >
              合成
            </WideToolButton>
            <WideToolButton
              type="button"
              aria-label="編集モード 分解"
              active={editorMode === "decompose"}
              onClick={() => onEditorModeChange("decompose")}
            >
              分解
            </WideToolButton>
          </OptionGrid>
        </Stack>

        <Stack component="label" spacing="0.625rem">
          <PanelHeaderRow>
            <FieldLabel>スプライト単位</FieldLabel>
            <Badge tone={projectSpriteSizeLocked ? "neutral" : "accent"}>
              {projectSpriteSizeLocked === true ? "locked" : "editable"}
            </Badge>
          </PanelHeaderRow>
          <OptionGrid>
            <WideToolButton
              type="button"
              aria-label="プロジェクトスプライトサイズ 8x8"
              active={projectSpriteSize === 8}
              disabled={
                projectSpriteSizeLocked === true && projectSpriteSize !== 8
              }
              onClick={() => onProjectSpriteSizeChange(8)}
            >
              8×8
            </WideToolButton>
            <WideToolButton
              type="button"
              aria-label="プロジェクトスプライトサイズ 8x16"
              active={projectSpriteSize === 16}
              disabled={
                projectSpriteSizeLocked === true && projectSpriteSize !== 16
              }
              onClick={() => onProjectSpriteSizeChange(16)}
            >
              8×16
            </WideToolButton>
          </OptionGrid>
        </Stack>
      </Stack>

      <Stack
        component={EditorCardRoot}
        minHeight={0}
        spacing="0.875rem"
        p="1rem"
        useFlexGap
      >
        <PanelHeaderRow>
          <FieldLabel>スプライトライブラリ</FieldLabel>
        </PanelHeaderRow>

        <LibraryScrollArea flex={1} minHeight={0} pr={0}>
          <LibraryGrid>
            {sprites.map((spriteTile, spriteIndex) => (
              <LibrarySpriteButton
                key={`library-sprite-${spriteIndex}`}
                type="button"
                dragging={isSpriteDragging(spriteIndex)}
                draggableState={isLibraryDraggable}
                draggable={false}
                aria-label={`ライブラリスプライト ${spriteIndex}`}
                onDragStart={(event) => event.preventDefault()}
                onPointerDown={(event) =>
                  onLibraryPointerDown(event, spriteIndex)
                }
              >
                <Stack alignItems="center" spacing="0.625rem" width="100%">
                  <LibrarySpriteTitle>{`Sprite ${spriteIndex}`}</LibrarySpriteTitle>
                  <LibrarySpritePreviewFrame
                    alignItems="center"
                    justifyContent="center"
                    spacing={0}
                  >
                    {renderSpritePixels(spriteIndex, libraryPreviewScale)}
                  </LibrarySpritePreviewFrame>
                  <Badge tone="accent">{`${spriteTile.width}×${spriteTile.height}`}</Badge>
                </Stack>
              </LibrarySpriteButton>
            ))}
          </LibraryGrid>
        </LibraryScrollArea>
      </Stack>
    </Stack>
  );
};
