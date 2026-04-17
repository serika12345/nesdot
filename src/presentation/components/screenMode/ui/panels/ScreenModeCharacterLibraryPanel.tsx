import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import React from "react";
import { type ScreenModeLibraryPresentationState } from "../../logic/useScreenModeLibraryState";
import { ScreenModeCharacterPreview } from "../preview/ScreenModeCharacterPreview";
import {
  CharacterLibraryGrid,
  CharacterPreviewTiles,
  LibrarySectionContent,
} from "../primitives/ScreenModePrimitives";
import {
  isCharacterDragState,
  ScreenLibraryPreviewButton,
  toBooleanDataValue,
} from "./ScreenModeGestureWorkspaceShared";
import {
  collapseChevronStyle,
  createScreenLibraryScrollAreaStyle,
  fieldLabelStyle,
  helperTextStyle,
  resolveBadgeStyle,
  screenPreviewLabelStyle,
} from "./ScreenModeGestureWorkspaceStyle";

interface ScreenModeCharacterLibraryPanelProps {
  libraryState: ScreenModeLibraryPresentationState;
}

export const ScreenModeCharacterLibraryPanel: React.FC<
  ScreenModeCharacterLibraryPanelProps
> = ({ libraryState }) => {
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
      aria-label="スクリーン配置キャラクターライブラリ"
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing="0.75rem"
        flexWrap="wrap"
        useFlexGap
      >
        <Box component="span" style={fieldLabelStyle}>
          キャラクタープレビュー
        </Box>
        <Stack direction="row" spacing="0.5rem" alignItems="center">
          <span style={resolveBadgeStyle("neutral")}>
            {`${libraryState.characterPreviewCards.length} sets`}
          </span>
          <Button
            type="button"
            aria-expanded={isOpen}
            aria-controls="screen-mode-character-library-content"
            aria-label={
              isOpen
                ? "キャラクタープレビューを閉じる"
                : "キャラクタープレビューを開く"
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
        id="screen-mode-character-library-content"
        open={isOpen}
        aria-hidden={isOpen === false}
      >
        {libraryState.characterPreviewCards.length > 0 ? (
          <Box style={createScreenLibraryScrollAreaStyle("15.5rem")}>
            <CharacterLibraryGrid>
              {libraryState.characterPreviewCards.map((characterCard) => (
                <ScreenLibraryPreviewButton
                  key={`screen-library-character-${characterCard.id}`}
                  type="button"
                  aria-label={`スクリーンキャラクタープレビュー ${characterCard.name}`}
                  dragging={isCharacterDragState(
                    libraryState.dragState,
                    characterCard.id,
                  )}
                  data-dragging-state={toBooleanDataValue(
                    isCharacterDragState(
                      libraryState.dragState,
                      characterCard.id,
                    ),
                  )}
                  draggable={false}
                  onDragStart={(event: React.DragEvent<HTMLButtonElement>) =>
                    event.preventDefault()
                  }
                  onPointerDown={(
                    event: React.PointerEvent<HTMLButtonElement>,
                  ) =>
                    libraryState.handleCharacterPointerDown(
                      event,
                      characterCard.id,
                    )
                  }
                >
                  <Stack
                    useFlexGap
                    alignItems="center"
                    justifyContent="center"
                    width="100%"
                    spacing="0.375rem"
                  >
                    <CharacterPreviewTiles>
                      <ScreenModeCharacterPreview
                        maxHeightPx={64}
                        maxWidthPx={96}
                        preferredScale={3}
                        previewGrid={characterCard.previewGrid}
                      />
                    </CharacterPreviewTiles>
                    <Box component="span" style={screenPreviewLabelStyle}>
                      {characterCard.name}
                    </Box>
                    <span style={resolveBadgeStyle("accent")}>
                      {`${characterCard.spriteCount} sprites`}
                    </span>
                  </Stack>
                </ScreenLibraryPreviewButton>
              ))}
            </CharacterLibraryGrid>
          </Box>
        ) : (
          <Box component="p" m={0} style={helperTextStyle}>
            先にキャラクター編集モードでセットを作成すると、ここからドラッグ配置できます。
          </Box>
        )}
      </LibrarySectionContent>
    </Stack>
  );
};
