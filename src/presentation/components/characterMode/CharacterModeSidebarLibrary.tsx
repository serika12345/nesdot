import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { ButtonBase, Stack } from "@mui/material";
import { styled } from "@mui/material/styles";
import * as O from "fp-ts/Option";
import React from "react";
import { type SpriteTile } from "../../../application/state/projectStore";
import {
  Badge,
  CollapseToggle,
  FieldLabel,
  PanelHeaderRow,
  ScrollArea,
} from "../../App.styles";
import { CharacterModeEditorCard } from "./CharacterModeEditorCard";
import { useCharacterModeSpriteLibrary } from "./CharacterModeStateProvider";
import { CharacterModeTilePreview } from "./CharacterModeTilePreview";
import { LIBRARY_PREVIEW_SCALE } from "./hooks/useCharacterModeState";

const LibraryScrollArea = styled(ScrollArea)({
  scrollbarGutter: "stable",
});

const LibraryGrid = styled("div")({
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "1.25rem",
});

const LibrarySpriteButton = styled(ButtonBase, {
  shouldForwardProp: (prop) => prop !== "dragging",
})<{ dragging?: boolean }>(({ dragging }) => ({
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
  cursor: "inherit",
  userSelect: "none",
  touchAction: "none",
  transition:
    "transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease",
  boxShadow:
    dragging === true
      ? "0 1rem 1.875rem rgba(15, 118, 110, 0.16)"
      : "0 0.625rem 1.125rem rgba(15, 23, 42, 0.08)",
}));

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

const collapseChevronStyle = (open: boolean): React.CSSProperties => ({
  transform: open ? "rotate(180deg)" : "rotate(0deg)",
  transition: "transform 160ms ease",
});

const shouldForwardOpenStateProp = (prop: PropertyKey): boolean =>
  prop !== "openState";

const shouldForwardLibraryContentStateProp = (prop: PropertyKey): boolean =>
  prop !== "interactiveState";

const LibraryContentRoot = styled("div", {
  shouldForwardProp: shouldForwardOpenStateProp,
})<{ openState: boolean }>(({ openState }) => ({
  display: openState === true ? "block" : "none",
  minHeight: 0,
}));

const LibraryInteractionRoot = styled("div", {
  shouldForwardProp: shouldForwardLibraryContentStateProp,
})<{ interactiveState: boolean }>(({ interactiveState }) => ({
  cursor: interactiveState === true ? "grab" : "default",
}));

interface CharacterModeSidebarLibraryContentProps {
  handleLibraryPointerDown: (
    event: React.PointerEvent<HTMLButtonElement>,
    spriteIndex: number,
  ) => void;
  draggingSpriteIndex: O.Option<number>;
  id: string;
  sprites: ReadonlyArray<SpriteTile>;
}

const CharacterModeSidebarLibraryContent = React.memo(
  function CharacterModeSidebarLibraryContent({
    handleLibraryPointerDown,
    draggingSpriteIndex,
    id,
    sprites,
  }: CharacterModeSidebarLibraryContentProps) {
    return (
      <LibraryScrollArea id={id} flex={1} minHeight={0}>
        <LibraryGrid>
          {sprites.map((spriteTile, spriteIndex) => (
            <LibrarySpriteButton
              key={`library-sprite-${spriteIndex}`}
              type="button"
              dragging={
                O.isSome(draggingSpriteIndex) &&
                draggingSpriteIndex.value === spriteIndex
              }
              draggable={false}
              aria-label={`ライブラリスプライト ${spriteIndex}`}
              onDragStart={(event) => event.preventDefault()}
              onPointerDown={(event) =>
                handleLibraryPointerDown(event, spriteIndex)
              }
            >
              <Stack alignItems="center" spacing="0.625rem" width="100%">
                <LibrarySpriteTitle>{`Sprite ${spriteIndex}`}</LibrarySpriteTitle>
                <LibrarySpritePreviewFrame
                  alignItems="center"
                  justifyContent="center"
                  spacing={0}
                >
                  <CharacterModeTilePreview
                    scale={LIBRARY_PREVIEW_SCALE}
                    tileOption={O.some(spriteTile)}
                  />
                </LibrarySpritePreviewFrame>
                <Badge tone="accent">{`${spriteTile.width}×${spriteTile.height}`}</Badge>
              </Stack>
            </LibrarySpriteButton>
          ))}
        </LibraryGrid>
      </LibraryScrollArea>
    );
  },
);

/**
 * スプライトライブラリ表示カードです。
 */
export const CharacterModeSidebarLibrary: React.FC = () => {
  const spriteLibrary = useCharacterModeSpriteLibrary();
  const [isLibraryOpen, setIsLibraryOpen] = React.useState(true);
  const libraryContentId = React.useId();
  const handleLibraryPointerDownRef = React.useRef(
    spriteLibrary.handleLibraryPointerDown,
  );

  React.useEffect(() => {
    handleLibraryPointerDownRef.current =
      spriteLibrary.handleLibraryPointerDown;
  }, [spriteLibrary.handleLibraryPointerDown]);

  const handleStableLibraryPointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLButtonElement>, spriteIndex: number) => {
      handleLibraryPointerDownRef.current(event, spriteIndex);
    },
    [],
  );

  return (
    <CharacterModeEditorCard
      minHeight={0}
      spacing="0.875rem"
      p="1rem"
      useFlexGap
    >
      <PanelHeaderRow>
        <Stack direction="row" spacing="0.75rem" alignItems="center">
          <FieldLabel>スプライトライブラリ</FieldLabel>
          <CollapseToggle
            type="button"
            open={isLibraryOpen}
            aria-expanded={isLibraryOpen}
            aria-controls={libraryContentId}
            aria-label={
              isLibraryOpen
                ? "スプライトライブラリを閉じる"
                : "スプライトライブラリを開く"
            }
            onClick={() => setIsLibraryOpen((previous) => !previous)}
          >
            {isLibraryOpen ? "閉じる" : "開く"}
            <ExpandMoreRoundedIcon
              style={collapseChevronStyle(isLibraryOpen)}
            />
          </CollapseToggle>
        </Stack>
      </PanelHeaderRow>

      <LibraryContentRoot
        id={libraryContentId}
        openState={isLibraryOpen}
        aria-hidden={isLibraryOpen === false}
      >
        <LibraryInteractionRoot
          interactiveState={spriteLibrary.isLibraryDraggable}
        >
          <CharacterModeSidebarLibraryContent
            draggingSpriteIndex={spriteLibrary.draggingSpriteIndex}
            handleLibraryPointerDown={handleStableLibraryPointerDown}
            id={`${libraryContentId}-scroll`}
            sprites={spriteLibrary.sprites}
          />
        </LibraryInteractionRoot>
      </LibraryContentRoot>
    </CharacterModeEditorCard>
  );
};
