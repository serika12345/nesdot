import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React from "react";
import { CharacterModeTilePreview } from "../../../characterMode/ui/preview/CharacterModeTilePreview";
import { applyRuntimeStyle } from "../../../common/ui/runtimeStyle";
import { type ScreenModeLibraryPresentationState } from "../../logic/useScreenModeLibraryState";
import { type ScreenModeProjectStateResult } from "../../logic/useScreenModeProjectState";
import { ScreenModeCharacterPreview } from "../preview/ScreenModeCharacterPreview";
import { CharacterPreviewTiles } from "../primitives/ScreenModePrimitives";
import styles from "./ScreenModeFloatingPreview.module.css";
import { createFloatingDragPreviewStyle } from "./ScreenModeGestureWorkspaceStyle";

interface ScreenModeFloatingPreviewProps {
  libraryState: ScreenModeLibraryPresentationState;
  sprites: ScreenModeProjectStateResult["sprites"];
  spritePalettes: ScreenModeProjectStateResult["spritePalettes"];
}

export const ScreenModeFloatingPreview: React.FC<
  ScreenModeFloatingPreviewProps
> = ({ libraryState, spritePalettes, sprites }) =>
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
          <div
            className={styles.card}
            ref={(element) => {
              applyRuntimeStyle(
                element,
                createFloatingDragPreviewStyle(
                  dragState.clientX,
                  dragState.clientY,
                ),
              );
            }}
          >
            <div className={styles.stack}>
              {dragState.kind === "sprite" ? (
                <CharacterModeTilePreview
                  scale={3}
                  spritePalettes={spritePalettes}
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
              <span className={styles.label}>
                {dragState.kind === "sprite"
                  ? `Sprite ${dragState.spriteIndex}`
                  : characterPreviewName}
              </span>
            </div>
          </div>
        );
      },
    ),
  );
