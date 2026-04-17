import { useState, type Dispatch, type SetStateAction } from "react";
import {
  isValidGroupMovement,
  moveGroupByDelta,
} from "../../../../domain/screen/spriteGroup";
import { type ScreenModeProjectStateResult } from "./useScreenModeProjectState";

type ScreenModeGroupMoveDependencies = Pick<
  ScreenModeProjectStateResult,
  "screen" | "spritesOnScreen" | "scan" | "setScreenAndSyncNes"
>;

interface ScreenModeGroupMoveStateResult {
  isGroupMoveOpen: boolean;
  setIsGroupMoveOpen: Dispatch<SetStateAction<boolean>>;
  selectedSpriteIndices: Set<number>;
  groupMoveDeltaX: number;
  setGroupMoveDeltaX: Dispatch<SetStateAction<number>>;
  groupMoveDeltaY: number;
  setGroupMoveDeltaY: Dispatch<SetStateAction<number>>;
  clearGroupSelection: () => void;
  handleMoveSelectedGroup: () => void;
  handleGroupSelectionToggleFromSelect: (value: string | number) => void;
}

/**
 * `screenMode` のグループ選択と一括移動を扱います。
 */
export const useScreenModeGroupMoveState = ({
  screen,
  spritesOnScreen,
  scan,
  setScreenAndSyncNes,
}: ScreenModeGroupMoveDependencies): ScreenModeGroupMoveStateResult => {
  const [isGroupMoveOpen, setIsGroupMoveOpen] = useState(false);
  const [selectedSpriteIndices, setSelectedSpriteIndices] = useState<
    Set<number>
  >(() => new Set());
  const [groupMoveDeltaX, setGroupMoveDeltaX] = useState(0);
  const [groupMoveDeltaY, setGroupMoveDeltaY] = useState(0);

  const addToGroupSelection = (index: number): void => {
    setSelectedSpriteIndices((previous) => new Set([...previous, index]));
  };

  const removeFromGroupSelection = (index: number): void => {
    setSelectedSpriteIndices(
      (previous) =>
        new Set(Array.from(previous).filter((value) => value !== index)),
    );
  };

  const clearGroupSelection = (): void => {
    setSelectedSpriteIndices(new Set());
  };

  const handleMoveSelectedGroup = (): void => {
    if (selectedSpriteIndices.size === 0) {
      alert("グループを選択してください");
      return;
    }

    const isValid = isValidGroupMovement(
      spritesOnScreen,
      selectedSpriteIndices,
      groupMoveDeltaX,
      groupMoveDeltaY,
    );

    if (isValid !== true) {
      alert(
        "移動により一部のスプライトがスクリーン外に出ます。\n位置を調整してください。",
      );
      return;
    }

    const movedSprites = moveGroupByDelta(
      spritesOnScreen,
      selectedSpriteIndices,
      groupMoveDeltaX,
      groupMoveDeltaY,
    );

    const newScreen = {
      ...screen,
      sprites: movedSprites,
    };

    const report = scan(newScreen);
    if (report.ok === false) {
      alert(
        "グループの移動に失敗しました。制約違反:\n" + report.errors.join("\n"),
      );
      return;
    }

    setScreenAndSyncNes(newScreen);
    alert(
      `グループを (${groupMoveDeltaX > 0 ? "+" : ""}${groupMoveDeltaX}, ${groupMoveDeltaY > 0 ? "+" : ""}${groupMoveDeltaY}) 移動しました`,
    );
    setGroupMoveDeltaX(0);
    setGroupMoveDeltaY(0);
  };

  const handleGroupSelectionToggleFromSelect = (
    value: string | number,
  ): void => {
    const nextValue = String(value);
    if (nextValue === "") {
      return;
    }

    const index = Number(nextValue);
    if (selectedSpriteIndices.has(index)) {
      removeFromGroupSelection(index);
      return;
    }

    addToGroupSelection(index);
  };

  return {
    isGroupMoveOpen,
    setIsGroupMoveOpen,
    selectedSpriteIndices,
    groupMoveDeltaX,
    setGroupMoveDeltaX,
    groupMoveDeltaY,
    setGroupMoveDeltaY,
    clearGroupSelection,
    handleMoveSelectedGroup,
    handleGroupSelectionToggleFromSelect,
  };
};
