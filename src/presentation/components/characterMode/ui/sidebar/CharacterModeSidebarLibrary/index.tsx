import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import * as O from "fp-ts/Option";
import React from "react";
import { type SpriteTile } from "../../../../../../application/state/projectStore";
import { LIBRARY_PREVIEW_SCALE } from "../../../logic/characterModeConstants";
import { useCharacterModeSpriteLibrary } from "../../../logic/characterModeEditorState";
import { CharacterModeEditorCard } from "../../editor/CharacterModeEditorCard";
import { CharacterModeTilePreview } from "../../preview/CharacterModeTilePreview";
import { CharacterLibraryGrid } from "../../primitives/CharacterModePrimitives";
import {
  characterLibraryPreviewFrameStyle,
  characterLibraryScrollAreaStyle,
  characterLibrarySpriteTitleStyle,
  collapseChevronStyle,
  createCharacterLibraryInteractionRootStyle,
  createCharacterLibraryPreviewButtonStyle,
} from "./styles";

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

type CharacterLibraryPreviewButtonProps = React.ComponentProps<
  typeof Button
> & {
  dragging?: boolean;
};

const CharacterLibraryPreviewButton = React.forwardRef<
  HTMLButtonElement,
  CharacterLibraryPreviewButtonProps
>(function CharacterLibraryPreviewButton({ dragging, ...props }, ref) {
  return (
    <Button
      ref={ref}
      {...props}
      color={dragging === true ? "primary" : "inherit"}
      fullWidth
      style={createCharacterLibraryPreviewButtonStyle(dragging === true)}
      variant={dragging === true ? "contained" : "outlined"}
    />
  );
});

const CharacterModeSidebarLibraryContent = React.memo(
  function CharacterModeSidebarLibraryContent({
    handleLibraryPointerDown,
    draggingSpriteIndex,
    id,
    sprites,
  }: CharacterModeSidebarLibraryContentProps) {
    return (
      <Box
        id={id}
        flex={1}
        minHeight={0}
        overflow="auto"
        mr={-2.25}
        pr={2.25}
        style={characterLibraryScrollAreaStyle}
      >
        <CharacterLibraryGrid>
          {sprites.map((spriteTile, spriteIndex) => (
            <CharacterLibraryPreviewButton
              key={`library-sprite-${spriteIndex}`}
              type="button"
              dragging={draggingSpriteIndex === spriteIndex}
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
                <Typography
                  component="span"
                  variant="caption"
                  style={characterLibrarySpriteTitleStyle}
                >
                  {`Sprite ${spriteIndex}`}
                </Typography>
                <Stack
                  component={Paper}
                  variant="outlined"
                  alignItems="center"
                  justifyContent="center"
                  spacing={0}
                  style={characterLibraryPreviewFrameStyle}
                >
                  <CharacterModeTilePreview
                    scale={LIBRARY_PREVIEW_SCALE}
                    tileOption={O.some(spriteTile)}
                  />
                </Stack>
                <Chip
                  size="small"
                  color="primary"
                  label={`${spriteTile.width}×${spriteTile.height}`}
                />
              </Stack>
            </CharacterLibraryPreviewButton>
          ))}
        </CharacterLibraryGrid>
      </Box>
    );
  },
  areSameLibraryContentProps,
);

interface CharacterModeSidebarLibraryProps {
  handleLibraryPointerDown: (
    event: React.PointerEvent<HTMLButtonElement>,
    spriteIndex: number,
  ) => void;
}

/**
 * スプライトライブラリ表示カードです。
 */
export const CharacterModeSidebarLibrary: React.FC<
  CharacterModeSidebarLibraryProps
> = ({ handleLibraryPointerDown }) => {
  const spriteLibrary = useCharacterModeSpriteLibrary();
  const [isLibraryOpen, setIsLibraryOpen] = React.useState(true);
  const libraryContentId = React.useId();
  const handleLibraryPointerDownRef = React.useRef(handleLibraryPointerDown);

  handleLibraryPointerDownRef.current = handleLibraryPointerDown;

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
      <Stack direction="row" spacing="0.75rem" alignItems="center">
        <Typography variant="body2">スプライトライブラリ</Typography>
        <Button
          type="button"
          aria-expanded={isLibraryOpen}
          aria-controls={libraryContentId}
          aria-label={
            isLibraryOpen
              ? "スプライトライブラリを閉じる"
              : "スプライトライブラリを開く"
          }
          color={isLibraryOpen === true ? "primary" : "inherit"}
          endIcon={
            <ExpandMoreRoundedIcon
              style={collapseChevronStyle(isLibraryOpen)}
            />
          }
          size="small"
          variant={isLibraryOpen === true ? "contained" : "outlined"}
          onClick={() => setIsLibraryOpen((previous) => !previous)}
        >
          {isLibraryOpen ? "閉じる" : "開く"}
        </Button>
      </Stack>

      <Box
        id={libraryContentId}
        data-open-state={toBooleanDataValue(isLibraryOpen)}
        aria-hidden={isLibraryOpen === false}
        display={isLibraryOpen === true ? "block" : "none"}
        minHeight={0}
      >
        <Box
          data-interactive-state={toBooleanDataValue(
            spriteLibrary.isLibraryDraggable,
          )}
          style={createCharacterLibraryInteractionRootStyle(
            spriteLibrary.isLibraryDraggable,
          )}
        >
          <CharacterModeSidebarLibraryContent
            draggingSpriteIndex={spriteLibrary.draggingSpriteIndex}
            handleLibraryPointerDown={handleStableLibraryPointerDown}
            id={`${libraryContentId}-scroll`}
            sprites={spriteLibrary.sprites}
          />
        </Box>
      </Box>
    </CharacterModeEditorCard>
  );
};
