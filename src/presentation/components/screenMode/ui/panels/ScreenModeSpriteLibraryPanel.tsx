import { Badge, Button } from "@radix-ui/themes";
import * as O from "fp-ts/Option";
import React from "react";
import { CharacterModeTilePreview } from "../../../characterMode/ui/preview/CharacterModeTilePreview";
import { SurfaceCard } from "../../../common/ui/chrome/SurfaceCard";
import { ChevronDownIcon } from "../../../common/ui/icons/AppIcons";
import { LibraryPreviewCard } from "../../../common/ui/preview/LibraryPreviewCard";
import { type ScreenModeLibraryPresentationState } from "../../logic/useScreenModeLibraryState";
import { type ScreenModeProjectStateResult } from "../../logic/useScreenModeProjectState";
import {
  LibrarySectionContent,
  SpriteLibraryGrid,
} from "../primitives/ScreenModePrimitives";
import { isSpriteDragState } from "./ScreenModeGestureWorkspaceShared";
import styles from "./ScreenModeLibraryPanels.module.css";

interface ScreenModeSpriteLibraryPanelProps {
  libraryState: ScreenModeLibraryPresentationState;
  sprites: ScreenModeProjectStateResult["sprites"];
  spritePalettes: ScreenModeProjectStateResult["spritePalettes"];
}

export const ScreenModeSpriteLibraryPanel: React.FC<
  ScreenModeSpriteLibraryPanelProps
> = ({ libraryState, spritePalettes, sprites }) => {
  const [isOpen, setIsOpen] = React.useState(true);
  const chevronClassName = [
    styles.chevron ?? "",
    isOpen === true ? (styles.chevronOpen ?? "") : "",
  ]
    .filter((value): value is string => value.length > 0)
    .join(" ");
  const scrollAreaClassName = [
    styles.scrollArea ?? "",
    styles.scrollAreaSprite ?? "",
  ]
    .filter((value): value is string => value.length > 0)
    .join(" ");

  return (
    <SurfaceCard
      className={styles.panel}
      role="region"
      aria-label="スクリーン配置スプライトライブラリ"
    >
      <div className={styles.headerRow}>
        <div className={styles.titleRow}>
          <span className={styles.label}>スプライトプレビュー</span>
          <Button
            aria-controls="screen-mode-sprite-library-content"
            aria-expanded={isOpen}
            aria-label={
              isOpen
                ? "スプライトプレビューを閉じる"
                : "スプライトプレビューを開く"
            }
            color={isOpen === true ? "teal" : "gray"}
            size="1"
            variant={isOpen === true ? "solid" : "outline"}
            onClick={() => setIsOpen((previous) => previous === false)}
          >
            {isOpen ? "閉じる" : "開く"}
            <ChevronDownIcon className={chevronClassName} />
          </Button>
        </div>
      </div>

      <LibrarySectionContent
        id="screen-mode-sprite-library-content"
        open={isOpen}
        aria-hidden={isOpen === false}
      >
        <div className={scrollAreaClassName}>
          <SpriteLibraryGrid>
            {sprites.map((sprite, spriteIndex) => (
              <LibraryPreviewCard
                key={`screen-library-sprite-${spriteIndex}`}
                type="button"
                previewFrame="sprite"
                aria-label={`スクリーンライブラリスプライト ${spriteIndex}`}
                dragging={isSpriteDragState(
                  libraryState.dragState,
                  spriteIndex,
                )}
                draggable={false}
                onDragStart={(event: React.DragEvent<HTMLButtonElement>) =>
                  event.preventDefault()
                }
                onPointerDown={(event: React.PointerEvent<HTMLButtonElement>) =>
                  libraryState.handleSpritePointerDown(event, spriteIndex)
                }
                label={`Sprite ${spriteIndex}`}
                preview={
                  <CharacterModeTilePreview
                    scale={3}
                    spritePalettes={spritePalettes}
                    tileOption={O.some(sprite)}
                  />
                }
                badge={
                  <Badge color="teal" size="2" variant="surface">
                    {`${sprite.width}×${sprite.height}`}
                  </Badge>
                }
              />
            ))}
          </SpriteLibraryGrid>
        </div>
      </LibrarySectionContent>
    </SurfaceCard>
  );
};
