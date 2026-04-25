import * as O from "fp-ts/Option";
import { Badge, Button } from "@radix-ui/themes";
import React from "react";
import { type SpriteTile } from "../../../../../application/state/projectStore";
import { type NesSpritePalettes } from "../../../../../domain/nes/nesProject";
import { ChevronDownIcon } from "../../../common/ui/icons/AppIcons";
import { LibraryPreviewCard } from "../../../common/ui/preview/LibraryPreviewCard";
import { mergeClassNames } from "../../../../styleClassNames";
import { LIBRARY_PREVIEW_SCALE } from "../../logic/characterModeConstants";
import { useCharacterModeSpriteLibrary } from "../../logic/characterModeEditorState";
import { CharacterModeEditorCard } from "../editor/CharacterModeEditorCard";
import { CharacterModeTilePreview } from "../preview/CharacterModeTilePreview";
import styles from "./CharacterModeSidebarLibrary.module.css";

interface CharacterModeSidebarLibraryContentProps {
  handleLibraryPointerDown: (
    event: React.PointerEvent<HTMLButtonElement>,
    spriteIndex: number,
  ) => void;
  id: string;
  library: Readonly<{
    draggingSpriteIndex: number;
    interactive: boolean;
    spritePalettes: NesSpritePalettes;
    sprites: ReadonlyArray<SpriteTile>;
  }>;
}

const areSameLibraryContentProps = (
  previous: CharacterModeSidebarLibraryContentProps,
  next: CharacterModeSidebarLibraryContentProps,
): boolean =>
  previous.handleLibraryPointerDown === next.handleLibraryPointerDown &&
  previous.id === next.id &&
  previous.library.draggingSpriteIndex === next.library.draggingSpriteIndex &&
  previous.library.interactive === next.library.interactive &&
  previous.library.spritePalettes === next.library.spritePalettes &&
  previous.library.sprites === next.library.sprites;

const CharacterModeSidebarLibraryContent = React.memo(
  function CharacterModeSidebarLibraryContent({
    handleLibraryPointerDown,
    id,
    library,
  }: CharacterModeSidebarLibraryContentProps) {
    return (
      <div className={styles.scrollArea} id={id}>
        <div className={styles.grid}>
          {library.sprites.map((spriteTile, spriteIndex) => (
            <LibraryPreviewCard
              key={`library-sprite-${spriteIndex}`}
              type="button"
              dragging={library.draggingSpriteIndex === spriteIndex}
              interactive={library.interactive}
              draggable={false}
              aria-label={`ライブラリスプライト ${spriteIndex}`}
              onDragStart={(event) => event.preventDefault()}
              onPointerDown={(event) =>
                handleLibraryPointerDown(event, spriteIndex)
              }
              label={`Sprite ${spriteIndex}`}
              preview={
                <CharacterModeTilePreview
                  scale={LIBRARY_PREVIEW_SCALE}
                  spritePalettes={library.spritePalettes}
                  tileOption={O.some(spriteTile)}
                />
              }
              badge={
                <Badge color="teal" size="2" variant="surface">
                  {`${spriteTile.width}×${spriteTile.height}`}
                </Badge>
              }
            />
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
            className={mergeClassNames(
              styles.chevron ?? "",
              isLibraryOpen === true ? (styles.chevronOpen ?? "") : false,
            )}
          />
        </Button>
      </div>

      <div
        className={mergeClassNames(
          styles.contentWrap ?? "",
          isLibraryOpen === false ? (styles.contentWrapClosed ?? "") : false,
        )}
        id={libraryContentId}
        aria-hidden={isLibraryOpen === false}
      >
        <CharacterModeSidebarLibraryContent
          library={{
            draggingSpriteIndex:
              spriteLibrary.isLibraryDraggable === true
                ? spriteLibrary.draggingSpriteIndex
                : -1,
            interactive: spriteLibrary.isLibraryDraggable,
            spritePalettes: spriteLibrary.spritePalettes,
            sprites: spriteLibrary.sprites,
          }}
          handleLibraryPointerDown={handleStableLibraryPointerDown}
          id={`${libraryContentId}-scroll`}
        />
      </div>
    </CharacterModeEditorCard>
  );
};
