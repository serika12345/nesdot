import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import {
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  type SpriteInScreen,
  type SpritePriority,
  useProjectState,
} from "../../../../application/state/projectStore";
import { type ScreenModeProjectStateResult } from "./useScreenModeProjectState";

type ScreenModeSelectionDependencies = Pick<
  ScreenModeProjectStateResult,
  "screen" | "spritesOnScreen" | "scan" | "setScreenAndSyncNes"
>;

export interface ScreenModeSelectionStateResult {
  selectedSpriteIndex: O.Option<number>;
  setSelectedSpriteIndex: Dispatch<SetStateAction<O.Option<number>>>;
  isSelectionOpen: boolean;
  setIsSelectionOpen: Dispatch<SetStateAction<boolean>>;
  activeSprite: O.Option<SpriteInScreen>;
  handleSelectedSpriteListChange: (value: string | number) => void;
  handleSelectedSpriteXChange: (value: string) => void;
  handleSelectedSpriteYChange: (value: string) => void;
  handleSelectedSpritePriorityChange: (value: string | number) => void;
  handleToggleSelectedSpriteFlipH: () => void;
  handleToggleSelectedSpriteFlipV: () => void;
  handleDeleteSelectedSprite: () => void;
}

const resolveSelectedSprite = (
  selectedSpriteIndex: O.Option<number>,
  spritesOnScreen: ScreenModeProjectStateResult["spritesOnScreen"],
): O.Option<SpriteInScreen> =>
  pipe(
    selectedSpriteIndex,
    O.chain((index) => O.fromNullable(spritesOnScreen[index])),
  );

/**
 * `screenMode` の単体選択と選択中スプライト編集を扱います。
 */
export const useScreenModeSelectionState = ({
  screen,
  spritesOnScreen,
  scan,
  setScreenAndSyncNes,
}: ScreenModeSelectionDependencies): ScreenModeSelectionStateResult => {
  const [selectedSpriteIndex, setSelectedSpriteIndex] = useState<
    O.Option<number>
  >(() =>
    useProjectState.getState().screen.sprites.length > 0 ? O.some(0) : O.none,
  );
  const [isSelectionOpen, setIsSelectionOpen] = useState(false);

  const activeSprite = useMemo(
    () => resolveSelectedSprite(selectedSpriteIndex, spritesOnScreen),
    [selectedSpriteIndex, spritesOnScreen],
  );

  const handleSelectedSpriteListChange = (value: string | number): void => {
    const nextValue = String(value);
    setSelectedSpriteIndex(
      nextValue === "" ? O.none : O.some(Number(nextValue)),
    );
  };

  const updateSelectedSpriteWithValidation = (
    transform: (sprite: SpriteInScreen) => SpriteInScreen,
    violationMessage: string,
  ): void => {
    pipe(
      selectedSpriteIndex,
      O.chain((spriteIndex) =>
        pipe(
          O.fromNullable(spritesOnScreen[spriteIndex]),
          O.map((sprite) => ({ spriteIndex, sprite })),
        ),
      ),
      O.map(({ spriteIndex, sprite }) => {
        const newSprites = spritesOnScreen.map((entry, index) =>
          index === spriteIndex ? transform(sprite) : entry,
        );
        const newScreen = {
          ...screen,
          sprites: newSprites,
        };
        const report = scan(newScreen);

        if (report.ok === false) {
          alert(violationMessage + "\n" + report.errors.join("\n"));
          return;
        }

        setScreenAndSyncNes(newScreen);
      }),
    );
  };

  const updateSelectedSpriteWithoutValidation = (
    transform: (sprite: SpriteInScreen) => SpriteInScreen,
  ): void => {
    pipe(
      selectedSpriteIndex,
      O.chain((spriteIndex) =>
        pipe(
          O.fromNullable(spritesOnScreen[spriteIndex]),
          O.map((sprite) => ({ spriteIndex, sprite })),
        ),
      ),
      O.map(({ spriteIndex, sprite }) => {
        const newSprites = spritesOnScreen.map((entry, index) =>
          index === spriteIndex ? transform(sprite) : entry,
        );
        const newScreen = {
          ...screen,
          sprites: newSprites,
        };

        setScreenAndSyncNes(newScreen);
      }),
    );
  };

  const handleSelectedSpriteXChange = (value: string): void => {
    const nextX = Number(value);
    updateSelectedSpriteWithValidation(
      (sprite) => ({ ...sprite, x: nextX }),
      "位置の更新に失敗しました。制約違反:",
    );
  };

  const handleSelectedSpriteYChange = (value: string): void => {
    const nextY = Number(value);
    updateSelectedSpriteWithValidation(
      (sprite) => ({ ...sprite, y: nextY }),
      "位置の更新に失敗しました。制約違反:",
    );
  };

  const handleSelectedSpritePriorityChange = (value: string | number): void => {
    const nextValue = String(value);
    if (nextValue !== "front" && nextValue !== "behindBg") {
      return;
    }

    const nextPriority: SpritePriority = nextValue;
    updateSelectedSpriteWithValidation(
      (sprite) => ({ ...sprite, priority: nextPriority }),
      "優先度の更新に失敗しました。制約違反:",
    );
  };

  const handleToggleSelectedSpriteFlipH = (): void => {
    updateSelectedSpriteWithoutValidation((sprite) => ({
      ...sprite,
      flipH: sprite.flipH === false,
    }));
  };

  const handleToggleSelectedSpriteFlipV = (): void => {
    updateSelectedSpriteWithoutValidation((sprite) => ({
      ...sprite,
      flipV: sprite.flipV === false,
    }));
  };

  const handleDeleteSelectedSprite = (): void => {
    pipe(
      selectedSpriteIndex,
      O.map((spriteIndex) => {
        const newSprites = spritesOnScreen.filter(
          (_, index) => index !== spriteIndex,
        );
        const newScreen = {
          ...screen,
          sprites: newSprites,
        };
        const report = scan(newScreen);

        if (report.ok === false) {
          alert(
            "削除後の状態で制約違反が検出されました:\n" +
              report.errors.join("\n"),
          );
        }

        setScreenAndSyncNes(newScreen);
        setSelectedSpriteIndex(O.none);
      }),
    );
  };

  return {
    selectedSpriteIndex,
    setSelectedSpriteIndex,
    isSelectionOpen,
    setIsSelectionOpen,
    activeSprite,
    handleSelectedSpriteListChange,
    handleSelectedSpriteXChange,
    handleSelectedSpriteYChange,
    handleSelectedSpritePriorityChange,
    handleToggleSelectedSpriteFlipH,
    handleToggleSelectedSpriteFlipV,
    handleDeleteSelectedSprite,
  };
};
