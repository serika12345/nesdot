import Stack, { type StackProps } from "@mui/material/Stack";
import React from "react";
import {
  CHARACTER_EDITOR_CARD_CLASS_NAME,
  mergeClassNames,
} from "../../../../styleClassNames";

/**
 * キャラクター編集画面で繰り返し使うカード枠です。
 * sidebar / inspector / stage tool の基調を 1 箇所にまとめます。
 */
export const CharacterModeEditorCard = React.forwardRef<
  HTMLDivElement,
  StackProps
>(function CharacterModeEditorCard({ className, ...props }, ref) {
  return (
    <Stack
      ref={ref}
      {...props}
      className={mergeClassNames(
        CHARACTER_EDITOR_CARD_CLASS_NAME,
        typeof className === "string" ? className : false,
      )}
    />
  );
});
