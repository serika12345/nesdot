import { Badge, Button } from "@radix-ui/themes";
import React from "react";
import { mergeClassNames } from "../../../../styleClassNames";
import { SurfaceCard } from "../../../common/ui/chrome/SurfaceCard";
import { ChevronDownIcon } from "../../../common/ui/icons/AppIcons";
import { LibraryPreviewCard } from "../../../common/ui/preview/LibraryPreviewCard";
import { type ScreenModeLibraryPresentationState } from "../../logic/useScreenModeLibraryState";
import { ScreenModeCharacterPreview } from "../preview/ScreenModeCharacterPreview";
import {
  CharacterLibraryGrid,
  CharacterPreviewTiles,
  LibrarySectionContent,
} from "../primitives/ScreenModePrimitives";
import { isCharacterDragState } from "./ScreenModeGestureWorkspaceShared";
import styles from "./ScreenModeLibraryPanels.module.css";

interface ScreenModeCharacterLibraryPanelProps {
  libraryState: ScreenModeLibraryPresentationState;
}

export const ScreenModeCharacterLibraryPanel: React.FC<
  ScreenModeCharacterLibraryPanelProps
> = ({ libraryState }) => {
  const [isOpen, setIsOpen] = React.useState(true);

  return (
    <SurfaceCard
      className={styles.panel}
      role="region"
      aria-label="スクリーン配置キャラクターライブラリ"
    >
      <div className={styles.headerRow}>
        <span className={styles.label}>キャラクタープレビュー</span>
        <div className={styles.badgeRow}>
          <Button
            aria-controls="screen-mode-character-library-content"
            aria-expanded={isOpen}
            aria-label={
              isOpen
                ? "キャラクタープレビューを閉じる"
                : "キャラクタープレビューを開く"
            }
            color={isOpen === true ? "teal" : "gray"}
            size="1"
            variant={isOpen === true ? "solid" : "outline"}
            onClick={() => setIsOpen((previous) => previous === false)}
          >
            {isOpen ? "閉じる" : "開く"}
            <ChevronDownIcon
              className={mergeClassNames(
                styles.chevron ?? "",
                isOpen === true ? (styles.chevronOpen ?? "") : false,
              )}
            />
          </Button>
        </div>
      </div>

      <LibrarySectionContent
        id="screen-mode-character-library-content"
        open={isOpen}
        aria-hidden={isOpen === false}
      >
        {libraryState.characterPreviewCards.length > 0 ? (
          <div
            className={mergeClassNames(
              styles.scrollArea ?? "",
              styles.characterScrollArea ?? "",
            )}
          >
            <CharacterLibraryGrid>
              {libraryState.characterPreviewCards.map((characterCard) => (
                <LibraryPreviewCard
                  key={`screen-library-character-${characterCard.id}`}
                  type="button"
                  aria-label={`スクリーンキャラクタープレビュー ${characterCard.name}`}
                  dragging={isCharacterDragState(
                    libraryState.dragState,
                    characterCard.id,
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
                  label={characterCard.name}
                  preview={
                    <CharacterPreviewTiles>
                      <ScreenModeCharacterPreview
                        maxHeightPx={64}
                        maxWidthPx={96}
                        preferredScale={3}
                        previewGrid={characterCard.previewGrid}
                      />
                    </CharacterPreviewTiles>
                  }
                  badge={
                    <Badge color="teal" size="2" variant="surface">
                      {`${characterCard.spriteCount} sprites`}
                    </Badge>
                  }
                />
              ))}
            </CharacterLibraryGrid>
          </div>
        ) : (
          <p className={styles.helperText}>
            先にキャラクター編集モードでセットを作成すると、ここからドラッグ配置できます。
          </p>
        )}
      </LibrarySectionContent>
    </SurfaceCard>
  );
};
