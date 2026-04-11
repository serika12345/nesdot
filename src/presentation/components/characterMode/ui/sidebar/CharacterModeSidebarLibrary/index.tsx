import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Stack from "@mui/material/Stack";
import * as O from "fp-ts/Option";
import React from "react";
import { type SpriteTile } from "../../../../../../application/state/projectStore";
import {
  Badge,
  CollapseToggle,
  FieldLabel,
  PanelHeaderRow,
  ScrollArea,
} from "../../../../../App.styles";
import {
  CHARACTER_LIBRARY_CONTENT_ROOT_CLASS_NAME,
  CHARACTER_LIBRARY_INTERACTION_ROOT_CLASS_NAME,
  CHARACTER_LIBRARY_SCROLL_AREA_CLASS_NAME,
  CHARACTER_LIBRARY_SPRITE_BUTTON_CLASS_NAME,
  CHARACTER_LIBRARY_SPRITE_PREVIEW_FRAME_CLASS_NAME,
  CHARACTER_LIBRARY_SPRITE_TITLE_CLASS_NAME,
} from "../../../../../styleClassNames";
import { LIBRARY_PREVIEW_SCALE } from "../../../logic/characterModeConstants";
import { useCharacterModeSpriteLibrary } from "../../core/CharacterModeStateProvider";
import { CharacterModeEditorCard } from "../../editor/CharacterModeEditorCard";
import { CharacterModeTilePreview } from "../../preview/CharacterModeTilePreview";
import { CharacterLibraryGrid } from "../../primitives/CharacterModePrimitives";
import { collapseChevronStyle } from "./styles";

const toBooleanDataValue = (value?: boolean): "true" | "false" =>
  value === true ? "true" : "false";

interface CharacterModeSidebarLibraryContentProps {
  handleLibraryPointerDown: (
    event: React.PointerEvent<HTMLButtonElement>,
    spriteIndex: number,
  ) => void;
  draggingSpriteIndex: number;
  id: string;
  sprites: ReadonlyArray<SpriteTile>;
}

const areSameLibraryContentProps = (
  previous: CharacterModeSidebarLibraryContentProps,
  next: CharacterModeSidebarLibraryContentProps,
): boolean =>
  previous.handleLibraryPointerDown === next.handleLibraryPointerDown &&
  previous.draggingSpriteIndex === next.draggingSpriteIndex &&
  previous.id === next.id &&
  previous.sprites === next.sprites;

const CharacterModeSidebarLibraryContent = React.memo(
  function CharacterModeSidebarLibraryContent({
    handleLibraryPointerDown,
    draggingSpriteIndex,
    id,
    sprites,
  }: CharacterModeSidebarLibraryContentProps) {
    return (
      <ScrollArea
        id={id}
        className={CHARACTER_LIBRARY_SCROLL_AREA_CLASS_NAME}
        flex={1}
        minHeight={0}
      >
        <CharacterLibraryGrid>
          {sprites.map((spriteTile, spriteIndex) => (
            <ButtonBase
              key={`library-sprite-${spriteIndex}`}
              className={CHARACTER_LIBRARY_SPRITE_BUTTON_CLASS_NAME}
              type="button"
              data-dragging-state={toBooleanDataValue(
                draggingSpriteIndex === spriteIndex,
              )}
              draggable={false}
              aria-label={`ライブラリスプライト ${spriteIndex}`}
              onDragStart={(event) => event.preventDefault()}
              onPointerDown={(event) =>
                handleLibraryPointerDown(event, spriteIndex)
              }
            >
              <Stack alignItems="center" spacing="0.625rem" width="100%">
                <span className={CHARACTER_LIBRARY_SPRITE_TITLE_CLASS_NAME}>
                  {`Sprite ${spriteIndex}`}
                </span>
                <Stack
                  className={CHARACTER_LIBRARY_SPRITE_PREVIEW_FRAME_CLASS_NAME}
                  alignItems="center"
                  justifyContent="center"
                  spacing={0}
                  width="5.5rem"
                  minHeight="4rem"
                >
                  <CharacterModeTilePreview
                    scale={LIBRARY_PREVIEW_SCALE}
                    tileOption={O.some(spriteTile)}
                  />
                </Stack>
                <Badge tone="accent">{`${spriteTile.width}×${spriteTile.height}`}</Badge>
              </Stack>
            </ButtonBase>
          ))}
        </CharacterLibraryGrid>
      </ScrollArea>
    );
  },
  areSameLibraryContentProps,
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

      <Box
        className={CHARACTER_LIBRARY_CONTENT_ROOT_CLASS_NAME}
        id={libraryContentId}
        data-open-state={toBooleanDataValue(isLibraryOpen)}
        aria-hidden={isLibraryOpen === false}
        display={isLibraryOpen === true ? "block" : "none"}
        minHeight={0}
      >
        <div
          className={CHARACTER_LIBRARY_INTERACTION_ROOT_CLASS_NAME}
          data-interactive-state={toBooleanDataValue(
            spriteLibrary.isLibraryDraggable,
          )}
        >
          <CharacterModeSidebarLibraryContent
            draggingSpriteIndex={spriteLibrary.draggingSpriteIndex}
            handleLibraryPointerDown={handleStableLibraryPointerDown}
            id={`${libraryContentId}-scroll`}
            sprites={spriteLibrary.sprites}
          />
        </div>
      </Box>
    </CharacterModeEditorCard>
  );
};
