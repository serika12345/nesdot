import * as O from "fp-ts/Option";

export type FileShareActionId =
  | "share-export-chr"
  | "share-export-png"
  | "share-export-svg"
  | "share-save-project"
  | "share-export-character-json";

export type FileShareAction = {
  id: FileShareActionId;
  label: string;
  onSelect: () => void;
};

export type FileRestoreAction = {
  label: string;
  onSelect: () => Promise<void> | void;
};

export type FileMenuState = {
  shareActions: ReadonlyArray<FileShareAction>;
  restoreAction: O.Option<FileRestoreAction>;
};

export const emptyFileMenuState: FileMenuState = {
  shareActions: [],
  restoreAction: O.none,
};
