export type CharacterEditorView = "create" | "edit";

/**
 * キャラクター編集画面が作成ビューか編集ビューかを決定します。
 * セットが 1 件もない場合だけ強制的に作成導線へ戻し、空状態での操作を迷わせない意図があります。
 */
export const resolveCharacterEditorView = (
  requestedView: CharacterEditorView,
  setCount: number,
): CharacterEditorView => (setCount > 0 ? requestedView : "create");
