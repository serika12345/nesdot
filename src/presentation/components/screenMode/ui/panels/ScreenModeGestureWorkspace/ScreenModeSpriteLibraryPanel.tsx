import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import * as O from "fp-ts/Option";
import React from "react";
import { CharacterModeTilePreview } from "../../../../characterMode/ui/preview/CharacterModeTilePreview";
import { type ScreenModeLibraryPresentationState } from "../../../logic/useScreenModeLibraryState";
import { type ScreenModeProjectStateResult } from "../../../logic/useScreenModeProjectState";
import {
  LibrarySectionContent,
  SpriteLibraryGrid,
} from "../../primitives/ScreenModePrimitives";
import {
  isSpriteDragState,
  ScreenLibraryPreviewButton,
  toBooleanDataValue,
} from "./shared";
import {
  collapseChevronStyle,
  createScreenLibraryScrollAreaStyle,
  fieldLabelStyle,
  resolveBadgeStyle,
  screenPreviewLabelStyle,
} from "./styles";

interface ScreenModeSpriteLibraryPanelProps {
  libraryState: ScreenModeLibraryPresentationState;
  sprites: ScreenModeProjectStateResult["sprites"];
  spritePalettes: ScreenModeProjectStateResult["nes"]["spritePalettes"];
}

export const ScreenModeSpriteLibraryPanel: React.FC<
  ScreenModeSpriteLibraryPanelProps
> = ({ libraryState, spritePalettes, sprites }) => {
  const [isOpen, setIsOpen] = React.useState(true);

  return (
    <Stack
      component={Paper}
      variant="outlined"
      position="relative"
      flexShrink={0}
      overflow="hidden"
      p={1.5}
      spacing={1.25}
      useFlexGap
      minHeight={0}
      role="region"
      aria-label="スクリーン配置スプライトライブラリ"
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing="0.75rem"
        flexWrap="wrap"
        useFlexGap
      >
        <Stack direction="row" spacing="0.75rem" alignItems="center">
          <Box component="span" style={fieldLabelStyle}>
            スプライトプレビュー
          </Box>
          <Button
            type="button"
            aria-expanded={isOpen}
            aria-controls="screen-mode-sprite-library-content"
            aria-label={
              isOpen
                ? "スプライトプレビューを閉じる"
                : "スプライトプレビューを開く"
            }
            color={isOpen === true ? "primary" : "inherit"}
            endIcon={
              <ExpandMoreRoundedIcon style={collapseChevronStyle(isOpen)} />
            }
            size="small"
            variant={isOpen === true ? "contained" : "outlined"}
            onClick={() => setIsOpen((previous) => previous === false)}
          >
            {isOpen ? "閉じる" : "開く"}
          </Button>
        </Stack>
      </Stack>

      <LibrarySectionContent
        id="screen-mode-sprite-library-content"
        open={isOpen}
        aria-hidden={isOpen === false}
      >
        <Box style={createScreenLibraryScrollAreaStyle("13.5rem")}>
          <SpriteLibraryGrid>
            {sprites.map((sprite, spriteIndex) => (
              <ScreenLibraryPreviewButton
                key={`screen-library-sprite-${spriteIndex}`}
                type="button"
                aria-label={`スクリーンライブラリスプライト ${spriteIndex}`}
                dragging={isSpriteDragState(
                  libraryState.dragState,
                  spriteIndex,
                )}
                data-dragging-state={toBooleanDataValue(
                  isSpriteDragState(libraryState.dragState, spriteIndex),
                )}
                draggable={false}
                onDragStart={(event: React.DragEvent<HTMLButtonElement>) =>
                  event.preventDefault()
                }
                onPointerDown={(event: React.PointerEvent<HTMLButtonElement>) =>
                  libraryState.handleSpritePointerDown(event, spriteIndex)
                }
              >
                <Stack
                  useFlexGap
                  alignItems="center"
                  justifyContent="center"
                  width="100%"
                  spacing="0.375rem"
                >
                  <CharacterModeTilePreview
                    scale={3}
                    spritePalettes={spritePalettes}
                    tileOption={O.some(sprite)}
                  />
                  <Box component="span" style={screenPreviewLabelStyle}>
                    {`Sprite ${spriteIndex}`}
                  </Box>
                  <span style={resolveBadgeStyle("accent")}>
                    {`${sprite.width}×${sprite.height}`}
                  </span>
                </Stack>
              </ScreenLibraryPreviewButton>
            ))}
          </SpriteLibraryGrid>
        </Box>
      </LibrarySectionContent>
    </Stack>
  );
};
