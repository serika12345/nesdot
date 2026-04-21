import Paper from "@mui/material/Paper";
import type { StackProps } from "@mui/material/Stack";
import Stack from "@mui/material/Stack";
import React from "react";

/**
 * キャラクター編集画面で繰り返し使うカード枠です。
 * sidebar / inspector / stage tool の基調を 1 箇所にまとめます。
 */
export const CharacterModeEditorCard = React.forwardRef<
  HTMLDivElement,
  StackProps<typeof Paper>
>(function CharacterModeEditorCard({ className, ...props }, ref) {
  return (
    <Stack
      ref={ref}
      component={Paper}
      variant="outlined"
      {...props}
      className={className}
    />
  );
});
