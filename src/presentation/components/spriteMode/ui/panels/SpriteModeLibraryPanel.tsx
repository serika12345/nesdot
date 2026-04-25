import { Badge, Button } from "@radix-ui/themes";
import * as O from "fp-ts/Option";
import React from "react";
import { LIBRARY_PREVIEW_SCALE } from "../../../characterMode/logic/characterModeConstants";
import { CharacterModeTilePreview } from "../../../characterMode/ui/preview/CharacterModeTilePreview";
import { SurfaceCard } from "../../../common/ui/chrome/SurfaceCard";
import { ChevronDownIcon } from "../../../common/ui/icons/AppIcons";
import { LibraryPreviewCard } from "../../../common/ui/preview/LibraryPreviewCard";
import { type SpriteModeLibraryPanelState } from "../../logic/spriteModeLibraryState";
import styles from "./SpriteModeLibraryPanel.module.css";

interface SpriteModeLibraryPanelProps {
  libraryPanelState: SpriteModeLibraryPanelState;
}

/**
 * スプライト編集モードの左ペインに表示するスプライトライブラリです。
 */
export const SpriteModeLibraryPanel: React.FC<SpriteModeLibraryPanelProps> = ({
  libraryPanelState,
}) => {
  const [isLibraryOpen, setIsLibraryOpen] = React.useState(true);
  const libraryContentId = React.useId();

  return (
    <SurfaceCard
      className={styles.panel}
      role="region"
      aria-label="スプライトライブラリ"
    >
      <div className={styles.headerRow}>
        <div className={styles.titleRow}>
          <h2 className={styles.label}>スプライトライブラリ</h2>
          <div className={styles.badgeRow}>
            <Badge color="gray" size="2" variant="surface">
              {`${libraryPanelState.sprites.length} sprites`}
            </Badge>
            <Badge color="teal" size="2" variant="surface">
              {libraryPanelState.projectSpriteSize === 8
                ? "Project Sprite Size 8x8"
                : "Project Sprite Size 8x16"}
            </Badge>
          </div>
        </div>
        <Button
          aria-controls={libraryContentId}
          aria-expanded={isLibraryOpen}
          aria-label={
            isLibraryOpen
              ? "スプライトライブラリを閉じる"
              : "スプライトライブラリを開く"
          }
          color={isLibraryOpen === true ? "teal" : "gray"}
          size="1"
          variant={isLibraryOpen === true ? "solid" : "outline"}
          onClick={() => setIsLibraryOpen((previous) => !previous)}
        >
          {isLibraryOpen ? "閉じる" : "開く"}
          <ChevronDownIcon
            className={styles.chevron}
            data-open={isLibraryOpen}
          />
        </Button>
      </div>

      <div
        className={styles.contentWrap}
        id={libraryContentId}
        data-open-state={isLibraryOpen === true ? "true" : "false"}
        aria-hidden={isLibraryOpen === false}
      >
        <div className={styles.scrollArea} id={`${libraryContentId}-scroll`}>
          <div className={styles.grid}>
            {libraryPanelState.sprites.map((spriteTile, spriteIndex) => {
              const isSelected = libraryPanelState.activeSprite === spriteIndex;

              return (
                <LibraryPreviewCard
                  key={`sprite-library-sprite-${spriteIndex}`}
                  type="button"
                  aria-label={`スプライト ${spriteIndex}`}
                  selected={isSelected}
                  interactive={false}
                  draggable={false}
                  onClick={() =>
                    libraryPanelState.handleSpriteSelect(spriteIndex)
                  }
                  label={`Sprite ${spriteIndex}`}
                  preview={
                    <CharacterModeTilePreview
                      scale={LIBRARY_PREVIEW_SCALE}
                      spritePalettes={libraryPanelState.spritePalettes}
                      tileOption={O.some(spriteTile)}
                    />
                  }
                  badge={
                    <Badge
                      color={isSelected === true ? "teal" : "gray"}
                      size="2"
                      variant="surface"
                    >
                      {isSelected === true
                        ? `選択中 ${spriteTile.width}×${spriteTile.height}`
                        : `${spriteTile.width}×${spriteTile.height}`}
                    </Badge>
                  }
                />
              );
            })}
          </div>
        </div>
      </div>
    </SurfaceCard>
  );
};
