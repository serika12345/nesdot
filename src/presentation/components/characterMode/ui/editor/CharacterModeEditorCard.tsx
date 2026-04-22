import React from "react";
import { SurfaceCard } from "../../../common/ui/chrome/SurfaceCard";

/**
 * キャラクター編集画面で繰り返し使うカード枠です。
 * sidebar / inspector / stage tool の基調を 1 箇所にまとめます。
 */
export const CharacterModeEditorCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function CharacterModeEditorCard({ className, ...props }, ref) {
  return <SurfaceCard {...props} ref={ref} className={className} />;
});
