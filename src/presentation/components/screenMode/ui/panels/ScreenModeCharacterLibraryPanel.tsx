import React from "react";
import { AppBadge, AppButton } from "../../../common/ui/forms/AppControls";
import { ChevronDownIcon } from "../../../common/ui/icons/AppIcons";
import { SurfaceCard } from "../../../common/ui/chrome/SurfaceCard";
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
          <AppBadge>{`${libraryState.characterPreviewCards.length} sets`}</AppBadge>
          <AppButton
            aria-controls="screen-mode-character-library-content"
            aria-expanded={isOpen}
            aria-label={
              isOpen
                ? "キャラクタープレビューを閉じる"
                : "キャラクタープレビューを開く"
            }
            size="small"
            tone={isOpen === true ? "accent" : "neutral"}
            variant={isOpen === true ? "solid" : "outline"}
            onClick={() => setIsOpen((previous) => previous === false)}
          >
            {isOpen ? "閉じる" : "開く"}
            <ChevronDownIcon className={styles.chevron} data-open={isOpen} />
          </AppButton>
        </div>
      </div>

      <LibrarySectionContent
        id="screen-mode-character-library-content"
        open={isOpen}
        aria-hidden={isOpen === false}
      >
        {libraryState.characterPreviewCards.length > 0 ? (
          <div className={styles.scrollArea} data-kind="character">
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
                  <div className={styles.previewContent}>
                    <CharacterPreviewTiles>
                      <ScreenModeCharacterPreview
                        maxHeightPx={64}
                        maxWidthPx={96}
                        preferredScale={3}
                        previewGrid={characterCard.previewGrid}
                      />
                    </CharacterPreviewTiles>
                    <span className={styles.previewLabel}>
                      {characterCard.name}
                    </span>
                    <AppBadge tone="accent">
                      {`${characterCard.spriteCount} sprites`}
                    </AppBadge>
                  </div>
                </ScreenLibraryPreviewButton>
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
