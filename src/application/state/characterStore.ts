import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import { create } from "zustand";
import {
  CharacterSet,
  CharacterSprite,
  addCharacterSprite,
  createCharacterSet,
  removeCharacterSprite,
  setCharacterSprite,
} from "../../domain/characters/characterSet";

interface CharacterState {
  characterSets: CharacterSet[];
  selectedCharacterId: O.Option<string>;
  createSet: (params: { name: string }) => string;
  selectSet: (id: O.Option<string>) => void;
  renameSet: (id: string, name: string) => void;
  addSprite: (id: string, sprite: CharacterSprite) => void;
  setSprite: (id: string, index: number, sprite: CharacterSprite) => void;
  removeSprite: (id: string, index: number) => void;
  deleteSet: (id: string) => void;
  setFromJson: (data: CharacterJsonData) => void;
}

export interface CharacterJsonData {
  characterSets: CharacterSet[];
  selectedCharacterId?: string;
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

  const selectedId = O.toNullable(currentSelection);
  const hasSelected = pipe(
    O.fromNullable(selectedId),
    O.match(
      () => false,
      (id) => nextSets.some((set) => set.id === id),
    ),
  );

  if (hasSelected === true) {
    return O.fromNullable(selectedId);
  }

  return pipe(
    O.fromNullable(nextSets[0]),
    O.map((nextSet) => nextSet.id),
  );
};

/**
 * キャラクター状態を永続化しやすい JSON 形へ変換します。
 * `Option` を外部保存向けの plain object に落とし込み、保存時の表現を安定させる意図があります。
 */
export const toCharacterJsonData = (params: {
  characterSets: CharacterSet[];
  selectedCharacterId: O.Option<string>;
}): CharacterJsonData =>
  pipe(
    params.selectedCharacterId,
    O.match(
      () => ({ characterSets: params.characterSets }),
      (selectedCharacterId) => ({
        characterSets: params.characterSets,
        selectedCharacterId,
      }),
    ),
  );

/**
 * 保存済みのキャラクター JSON をアプリ状態へ戻します。
 * 選択中 ID の整合性を確認しつつ、壊れた選択状態を次に有効なセットへ寄せる意図があります。
 */
export const fromCharacterJsonData = (
  data: CharacterJsonData,
): {
  characterSets: CharacterSet[];
  selectedCharacterId: O.Option<string>;
} => {
  const selectedOption = O.fromNullable(data.selectedCharacterId);
  const validatedSelection = pipe(
    selectedOption,
    O.filter((selectedId) =>
      data.characterSets.some((characterSet) => characterSet.id === selectedId),
    ),
  );

  return {
    characterSets: data.characterSets,
    selectedCharacterId: pickNextSelected(
      validatedSelection,
      data.characterSets,
    ),
  };
};

/**
 * キャラクター編集で共有する Zustand ストアを提供します。
 * セットの作成、選択、更新、削除、JSON 復元を一か所に集約して UI から扱いやすくする意図があります。
 */
export const useCharacterState = create<CharacterState>()((set) => ({
  characterSets: [],
  selectedCharacterId: O.none,
  createSet: ({ name }) => {
    const id = createSetId();
    const nextSet = createCharacterSet({
      id,
      name: name !== "" ? name : "New Character",
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
  addSprite: (id, sprite) => {
    set((state) => ({
      characterSets: state.characterSets.map((characterSet) =>
        characterSet.id === id
          ? addCharacterSprite(characterSet, sprite)
          : characterSet,
      ),
    }));
  },
  setSprite: (id, index, sprite) => {
    set((state) => ({
      characterSets: state.characterSets.map((characterSet) => {
        if (characterSet.id !== id) {
          return characterSet;
        }

        const updated = setCharacterSprite(characterSet, index, sprite);
        return O.getOrElse<CharacterSet>(() => characterSet)(
          O.fromEither(updated),
        );
      }),
    }));
  },
  removeSprite: (id, index) => {
    set((state) => ({
      characterSets: state.characterSets.map((characterSet) => {
        if (characterSet.id !== id) {
          return characterSet;
        }

        const updated = removeCharacterSprite(characterSet, index);
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
  setFromJson: (data) => {
    set(fromCharacterJsonData(data));
  },
}));
