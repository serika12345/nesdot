import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import { type ScreenModeLibraryPresentationState } from "../../logic/useScreenModeLibraryState";

export const toBooleanDataValue = (value?: boolean): "true" | "false" =>
  value === true ? "true" : "false";

export const resolveMenuPosition = (
  menuClientX: number,
  menuClientY: number,
): {
  left: number;
  top: number;
} => {
  const viewportWidth =
    typeof window === "undefined" ? menuClientX : window.innerWidth;
  const viewportHeight =
    typeof window === "undefined" ? menuClientY : window.innerHeight;

  return {
    left: Math.max(12, Math.min(menuClientX, viewportWidth - 232)),
    top: Math.max(12, Math.min(menuClientY, viewportHeight - 272)),
  };
};

export const isSpriteDragState = (
  dragState: ScreenModeLibraryPresentationState["dragState"],
  spriteIndex: number,
): boolean =>
  pipe(
    dragState,
    O.match(
      () => false,
      (drag) => drag.kind === "sprite" && drag.spriteIndex === spriteIndex,
    ),
  );

export const isCharacterDragState = (
  dragState: ScreenModeLibraryPresentationState["dragState"],
  characterId: string,
): boolean =>
  pipe(
    dragState,
    O.match(
      () => false,
      (drag) => drag.kind === "character" && drag.characterId === characterId,
    ),
  );
