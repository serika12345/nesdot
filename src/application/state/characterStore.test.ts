import * as O from "fp-ts/Option";
import { describe, expect, it } from "vitest";
import {
  CharacterJsonData,
  fromCharacterJsonData,
  toCharacterJsonData,
} from "./characterStore";

describe("characterState json conversion", () => {
  it("serializes selected id when selected exists", () => {
    const json = toCharacterJsonData({
      characterSets: [
        {
          id: "hero",
          name: "Hero",
          rows: 1,
          cols: 1,
          cells: [{ kind: "empty" }],
        },
      ],
      selectedCharacterId: O.some("hero"),
    });

    expect(json).toEqual({
      characterSets: [
        {
          id: "hero",
          name: "Hero",
          rows: 1,
          cols: 1,
          cells: [{ kind: "empty" }],
        },
      ],
      selectedCharacterId: "hero",
    });
  });

  it("does not include selected id when selection is none", () => {
    const json = toCharacterJsonData({
      characterSets: [],
      selectedCharacterId: O.none,
    });

    expect(json).toEqual({ characterSets: [] });
  });

  it("restores selected id only when it exists in sets", () => {
    const restored = fromCharacterJsonData({
      characterSets: [
        {
          id: "hero",
          name: "Hero",
          rows: 1,
          cols: 1,
          cells: [{ kind: "empty" }],
        },
      ],
      selectedCharacterId: "hero",
    });

    expect(restored.characterSets).toHaveLength(1);
    expect(O.isSome(restored.selectedCharacterId)).toBe(true);
    if (O.isSome(restored.selectedCharacterId)) {
      expect(restored.selectedCharacterId.value).toBe("hero");
    }
  });

  it("falls back to first set when selected id is missing", () => {
    const restored = fromCharacterJsonData({
      characterSets: [
        {
          id: "hero",
          name: "Hero",
          rows: 1,
          cols: 1,
          cells: [{ kind: "empty" }],
        },
        {
          id: "enemy",
          name: "Enemy",
          rows: 1,
          cols: 1,
          cells: [{ kind: "empty" }],
        },
      ],
      selectedCharacterId: "missing",
    });

    expect(O.isSome(restored.selectedCharacterId)).toBe(true);
    if (O.isSome(restored.selectedCharacterId)) {
      expect(restored.selectedCharacterId.value).toBe("hero");
    }
  });

  it("restores empty state when no sets are present", () => {
    const restored = fromCharacterJsonData({
      characterSets: [],
    });

    expect(restored.characterSets).toEqual([]);
    expect(O.isNone(restored.selectedCharacterId)).toBe(true);
  });

  it("accepts minimal json shape", () => {
    const input: CharacterJsonData = { characterSets: [] };
    const restored = fromCharacterJsonData(input);

    expect(restored.characterSets).toEqual([]);
    expect(O.isNone(restored.selectedCharacterId)).toBe(true);
  });
});
