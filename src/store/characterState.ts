import * as O from "fp-ts/Option";
import { create } from "zustand";
import {
  CharacterCell,
  CharacterSet,
  createCharacterSet,
  resizeCharacterSet,
  setCharacterCell,
} from "../characters/characterSet";

interface CharacterState {
  characterSets: CharacterSet[];
  selectedCharacterId: O.Option<string>;
  createSet: (params: { name: string; rows: number; cols: number }) => string;
  selectSet: (id: O.Option<string>) => void;
  renameSet: (id: string, name: string) => void;
  resizeSet: (id: string, rows: number, cols: number) => void;
  setCell: (id: string, index: number, cell: CharacterCell) => void;
  deleteSet: (id: string) => void;
}

const createSetId = (): string =>
  [
    "character",
    `${Date.now()}`,
    `${Math.floor(Math.random() * 1_000_000)}`,
  ].join("-");

const pickNextSelected = (
  currentSelection: O.Option<string>,
  nextSets: CharacterSet[],
): O.Option<string> => {
  if (nextSets.length === 0) {
    return O.none;
  }

  const selected = O.toNullable(currentSelection);
  const hasSelected =
    selected !== null && nextSets.some((set) => set.id === selected);

  if (hasSelected === true && selected !== null) {
    return O.some(selected);
  }

  return O.some(nextSets[0].id);
};

export const useCharacterState = create<CharacterState>()((set) => ({
  characterSets: [],
  selectedCharacterId: O.none,
  createSet: ({ name, rows, cols }) => {
    const id = createSetId();
    const nextSet = createCharacterSet({
      id,
      name: name !== "" ? name : "New Character",
      rows,
      cols,
    });

    set((state) => ({
      characterSets: [...state.characterSets, nextSet],
      selectedCharacterId: O.some(id),
    }));

    return id;
  },
  selectSet: (id) => {
    set({ selectedCharacterId: id });
  },
  renameSet: (id, name) => {
    set((state) => ({
      characterSets: state.characterSets.map((characterSet) =>
        characterSet.id === id
          ? { ...characterSet, name: name !== "" ? name : "Untitled Character" }
          : characterSet,
      ),
    }));
  },
  resizeSet: (id, rows, cols) => {
    set((state) => ({
      characterSets: state.characterSets.map((characterSet) =>
        characterSet.id === id
          ? resizeCharacterSet(characterSet, rows, cols)
          : characterSet,
      ),
    }));
  },
  setCell: (id, index, cell) => {
    set((state) => ({
      characterSets: state.characterSets.map((characterSet) => {
        if (characterSet.id !== id) {
          return characterSet;
        }

        const updated = setCharacterCell(characterSet, index, cell);
        return O.getOrElse<CharacterSet>(() => characterSet)(
          O.fromEither(updated),
        );
      }),
    }));
  },
  deleteSet: (id) => {
    set((state) => {
      const nextSets = state.characterSets.filter(
        (characterSet) => characterSet.id !== id,
      );
      return {
        characterSets: nextSets,
        selectedCharacterId: pickNextSelected(
          state.selectedCharacterId,
          nextSets,
        ),
      };
    });
  },
}));
