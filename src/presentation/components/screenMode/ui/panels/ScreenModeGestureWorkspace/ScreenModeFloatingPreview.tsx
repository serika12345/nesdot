import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React from "react";
import { CharacterModeTilePreview } from "../../../../characterMode/ui/preview/CharacterModeTilePreview";
import { type ScreenModeLibraryPresentationState } from "../../../logic/useScreenModeLibraryState";
import { type ScreenModeProjectStateResult } from "../../../logic/useScreenModeProjectState";
import { ScreenModeCharacterPreview } from "../../preview/ScreenModeCharacterPreview";
import { CharacterPreviewTiles } from "../../primitives/ScreenModePrimitives";
import {
  createFloatingDragPreviewStyle,
  screenPreviewLabelStyle,
} from "./styles";

interface ScreenModeFloatingPreviewProps {
  libraryState: ScreenModeLibraryPresentationState;
  sprites: ScreenModeProjectStateResult["sprites"];
}

export const ScreenModeFloatingPreview: React.FC<
  ScreenModeFloatingPreviewProps
> = ({ libraryState, sprites }) =>
  pipe(
    libraryState.dragState,
    O.match(
      () => <></>,
      (dragState) => {
        const previewCardOption =
          dragState.kind === "character"
            ? O.fromNullable(
                libraryState.characterPreviewCards.find(
                  (card) => card.id === dragState.characterId,
                ),
              )
            : O.none;

        const characterPreviewGrid = pipe(
          previewCardOption,
          O.chain((previewCard) => previewCard.previewGrid),
        );

        const characterPreviewName = pipe(
          previewCardOption,
          O.match(
            () => "Character",
            (previewCard) => previewCard.name,
          ),
        );

        return (
          <Box
            component={Paper}
            variant="outlined"
            style={createFloatingDragPreviewStyle(
              dragState.clientX,
              dragState.clientY,
            )}
          >
            <Stack
              useFlexGap
              alignItems="center"
              justifyContent="center"
              spacing="0.375rem"
            >
              {dragState.kind === "sprite" ? (
                <CharacterModeTilePreview
                  scale={3}
                  tileOption={O.fromNullable(sprites[dragState.spriteIndex])}
                />
              ) : (
                <CharacterPreviewTiles>
                  <ScreenModeCharacterPreview
                    maxHeightPx={88}
                    maxWidthPx={112}
                    preferredScale={3}
                    previewGrid={characterPreviewGrid}
                  />
                </CharacterPreviewTiles>
              )}
              <Box component="span" style={screenPreviewLabelStyle}>
                {dragState.kind === "sprite"
                  ? `Sprite ${dragState.spriteIndex}`
                  : characterPreviewName}
              </Box>
            </Stack>
          </Box>
        );
      },
    ),
  );
