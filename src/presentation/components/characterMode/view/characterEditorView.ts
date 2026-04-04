export type CharacterEditorView = "create" | "edit";

export const resolveCharacterEditorView = (
  requestedView: CharacterEditorView,
  setCount: number,
): CharacterEditorView => (setCount > 0 ? requestedView : "create");
