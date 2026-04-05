import { Stack } from "@mui/material";
import { styled } from "@mui/material/styles";

/**
 * キャラクター編集画面で繰り返し使うカード枠です。
 * sidebar / inspector / stage tool の基調を 1 箇所にまとめます。
 */
export const CharacterModeEditorCard = styled(Stack)({
  position: "relative",
  zIndex: 1,
  borderRadius: "1.375rem",
  background: "rgba(248, 250, 252, 0.84)",
  border: "0.0625rem solid rgba(148, 163, 184, 0.16)",
  boxShadow: "inset 0 0.0625rem 0 rgba(255, 255, 255, 0.72)",
});
