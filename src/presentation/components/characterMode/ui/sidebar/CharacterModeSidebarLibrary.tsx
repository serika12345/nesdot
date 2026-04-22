import * as O from "fp-ts/Option";
import React from "react";
import { type SpriteTile } from "../../../../../application/state/projectStore";
import { type NesSpritePalettes } from "../../../../../domain/nes/nesProject";
import { AppBadge, AppButton } from "../../../common/ui/forms/AppControls";
import { ChevronDownIcon } from "../../../common/ui/icons/AppIcons";
import { LIBRARY_PREVIEW_SCALE } from "../../logic/characterModeConstants";
import { useCharacterModeSpriteLibrary } from "../../logic/characterModeEditorState";
import { CharacterModeEditorCard } from "../editor/CharacterModeEditorCard";
import { CharacterModeTilePreview } from "../preview/CharacterModeTilePreview";
import styles from "./CharacterModeSidebarLibrary.module.css";

const toBooleanDataValue = (value?: boolean): "true" | "false" =>
  value === true ? "true" : "false";

interface CharacterModeSidebarLibraryContentProps {
  draggingSpriteIndex: number;
  handleLibraryPointerDown: (
    event: React.PointerEvent<HTMLButtonElement>,
    spriteIndex: number,
  ) => void;
  id: string;
  spritePalettes: NesSpritePalettes;
  sprites: ReadonlyArray<SpriteTile>;
}

const areSameLibraryContentProps = (
  previous: CharacterModeSidebarLibraryContentProps,
  next: CharacterModeSidebarLibraryContentProps,
): boolean =>
  previous.handleLibraryPointerDown === next.handleLibraryPointerDown &&
  previous.draggingSpriteIndex === next.draggingSpriteIndex &&
  previous.id === next.id &&
  previous.spritePalettes === next.spritePalettes &&
  previous.sprites === next.sprites;

type CharacterLibraryPreviewButtonProps = React.ComponentProps<
  typeof AppButton
> & {
  dragging?: boolean;
};

const CharacterLibraryPreviewButton = React.forwardRef<
  HTMLButtonElement,
  CharacterLibraryPreviewButtonProps
>(function CharacterLibraryPreviewButton({ dragging, ...props }, ref) {
  return (
    <AppButton
      ref={ref}
      {...props}
      className={styles.previewButton}
      data-dragging-state={toBooleanDataValue(dragging)}
      fullWidth
      tone={dragging === true ? "accent" : "neutral"}
      variant={dragging === true ? "solid" : "outline"}
    >
      {props.children}
    </AppButton>
  );
});

const CharacterModeSidebarLibraryContent = React.memo(
  function CharacterModeSidebarLibraryContent({
    handleLibraryPointerDown,
    draggingSpriteIndex,
    id,
    spritePalettes,
    sprites,
  }: CharacterModeSidebarLibraryContentProps) {
    return (
      <div className={styles.scrollArea} id={id}>
        <div className={styles.grid}>
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
              <div className={styles.previewContent}>
                <span className={styles.spriteTitle}>
                  {`Sprite ${spriteIndex}`}
                </span>
                <div className={styles.previewFrame}>
                  <CharacterModeTilePreview
                    scale={LIBRARY_PREVIEW_SCALE}
                    spritePalettes={spritePalettes}
                    tileOption={O.some(spriteTile)}
                  />
                </div>
                <AppBadge tone="accent">
                  {`${spriteTile.width}×${spriteTile.height}`}
                </AppBadge>
              </div>
            </CharacterLibraryPreviewButton>
          ))}
        </div>
      </div>
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
    <CharacterModeEditorCard className={styles.root}>
      <div className={styles.headerRow}>
        <span className={styles.headerLabel}>スプライトライブラリ</span>
        <AppButton
          aria-controls={libraryContentId}
          aria-expanded={isLibraryOpen}
          aria-label={
            isLibraryOpen
              ? "スプライトライブラリを閉じる"
              : "スプライトライブラリを開く"
          }
          size="small"
          tone={isLibraryOpen === true ? "accent" : "neutral"}
          variant={isLibraryOpen === true ? "solid" : "outline"}
          onClick={() => setIsLibraryOpen((previous) => !previous)}
        >
          {isLibraryOpen ? "閉じる" : "開く"}
          <ChevronDownIcon
            className={styles.chevron}
            data-open={isLibraryOpen}
          />
        </AppButton>
      </div>

      <div
        className={styles.contentWrap}
        id={libraryContentId}
        data-open-state={toBooleanDataValue(isLibraryOpen)}
        aria-hidden={isLibraryOpen === false}
      >
        <div
          className={styles.interactionRoot}
          data-interactive-state={toBooleanDataValue(
            spriteLibrary.isLibraryDraggable,
          )}
        >
          <CharacterModeSidebarLibraryContent
            draggingSpriteIndex={spriteLibrary.draggingSpriteIndex}
            handleLibraryPointerDown={handleStableLibraryPointerDown}
            id={`${libraryContentId}-scroll`}
            spritePalettes={spriteLibrary.spritePalettes}
            sprites={spriteLibrary.sprites}
          />
        </div>
      </div>
    </CharacterModeEditorCard>
  );
};
