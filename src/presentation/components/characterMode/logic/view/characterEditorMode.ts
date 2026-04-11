export type CharacterEditorMode = "compose" | "decompose";

/**
 * キャラクター編集モードごとの値選択を一箇所へ集約します。
 * UI 側が `if` や三項演算子を散らさず、モード別コンポーネントへ素直に委譲できるようにします。
 */
export const selectCharacterEditorModeValue = <T>(
  editorMode: CharacterEditorMode,
  values: Readonly<Record<CharacterEditorMode, T>>,
): T => values[editorMode];
