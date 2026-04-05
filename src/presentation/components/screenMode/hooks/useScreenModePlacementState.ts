import * as E from "fp-ts/Either";
import { useState, type Dispatch, type SetStateAction } from "react";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import {
  type SpriteInScreen,
} from "../../../../application/state/projectStore";
import { expandCharacterToScreenSprites } from "../../../../domain/characters/characterSet";
import { type ScreenModeProjectStateResult } from "./useScreenModeProjectState";

type ScreenModePlacementDependencies = Pick<
  ScreenModeProjectStateResult,
  | "screen"
  | "sprites"
  | "activeCharacter"
  | "selectCharacterSet"
  | "scan"
  | "setScreenAndSyncNes"
> & {
  selectedSpriteIndex: O.Option<number>;
  setSelectedSpriteIndex: Dispatch<SetStateAction<O.Option<number>>>;
};

export interface ScreenModePlacementStateResult {
  spriteNumber: number;
  setSpriteNumber: Dispatch<SetStateAction<number>>;
  x: number;
  setX: Dispatch<SetStateAction<number>>;
  y: number;
  setY: Dispatch<SetStateAction<number>>;
  isPlacementOpen: boolean;
  setIsPlacementOpen: Dispatch<SetStateAction<boolean>>;
  characterBaseX: number;
  setCharacterBaseX: Dispatch<SetStateAction<number>>;
  characterBaseY: number;
  setCharacterBaseY: Dispatch<SetStateAction<number>>;
  handleCharacterSetSelect: (value: string | number) => void;
  handleAddSprite: () => void;
  handleAddCharacter: () => void;
}

/**
 * `screenMode` の配置追加入力と追加処理を扱います。
 * キャラクター追加とスプライト追加の局所状態をここに閉じ込めます。
 */
export const useScreenModePlacementState = ({
  screen,
  sprites,
  activeCharacter,
  selectCharacterSet,
  scan,
  setScreenAndSyncNes,
  selectedSpriteIndex,
  setSelectedSpriteIndex,
}: ScreenModePlacementDependencies): ScreenModePlacementStateResult => {
  const [spriteNumber, setSpriteNumber] = useState(0);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [isPlacementOpen, setIsPlacementOpen] = useState(true);
  const [characterBaseX, setCharacterBaseX] = useState(0);
  const [characterBaseY, setCharacterBaseY] = useState(0);

  const handleCharacterSetSelect = (value: string | number): void => {
    const nextValue = String(value);
    selectCharacterSet(nextValue === "" ? O.none : O.some(nextValue));
  };

  const handleAddSprite = (): void => {
    const spriteTileOption = O.fromNullable(sprites[spriteNumber]);
    if (O.isNone(spriteTileOption)) {
      alert("指定されたスプライト番号のスプライトが存在しません");
      return;
    }
    const spriteTile = spriteTileOption.value;

    const candidate: SpriteInScreen = {
      ...spriteTile,
      x,
      y,
      spriteIndex: spriteNumber,
      priority: "front",
      flipH: false,
      flipV: false,
    };
    const newScreen = {
      ...screen,
      sprites: [...screen.sprites, candidate],
    };

    const report = scan(newScreen);
    if (report.ok === false) {
      alert(
        "スプライトの追加に失敗しました。制約違反:\n" +
          report.errors.join("\n"),
      );
      return;
    }

    setScreenAndSyncNes(newScreen);
    if (O.isNone(selectedSpriteIndex)) {
      setSelectedSpriteIndex(O.some(newScreen.sprites.length - 1));
    }
    alert(`スプライト#${spriteNumber}を(${x},${y})に追加しました`);
  };

  const handleAddCharacter = (): void => {
    const placement = pipe(
      activeCharacter,
      O.match(
        () => E.left("キャラクターセットを選択してください"),
        (characterSet) =>
          expandCharacterToScreenSprites(characterSet, {
            baseX: characterBaseX,
            baseY: characterBaseY,
            sprites,
          }),
      ),
    );

    if (E.isLeft(placement)) {
      alert(`キャラクター追加に失敗しました: ${placement.left}`);
      return;
    }

    const newScreen = {
      ...screen,
      sprites: [...screen.sprites, ...placement.right],
    };
    const report = scan(newScreen);
    if (report.ok === false) {
      alert(
        "キャラクターの追加に失敗しました。制約違反:\n" +
          report.errors.join("\n"),
      );
      return;
    }

    setScreenAndSyncNes(newScreen);
    if (O.isNone(selectedSpriteIndex) && placement.right.length > 0) {
      setSelectedSpriteIndex(O.some(screen.sprites.length));
    }
    alert(`キャラクターを(${characterBaseX},${characterBaseY})に追加しました`);
  };

  return {
    spriteNumber,
    setSpriteNumber,
    x,
    setX,
    y,
    setY,
    isPlacementOpen,
    setIsPlacementOpen,
    characterBaseX,
    setCharacterBaseX,
    characterBaseY,
    setCharacterBaseY,
    handleCharacterSetSelect,
    handleAddSprite,
    handleAddCharacter,
  };
};
