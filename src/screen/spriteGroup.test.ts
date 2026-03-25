import { describe, expect, it } from "vitest";
import { SpriteInScreen } from "../store/projectState";
import {
  getGroupBounds,
  isValidGroupMovement,
  moveGroupByDelta,
} from "./spriteGroup";

describe("spriteGroup", () => {
  const createTestSprite = (
    index: number,
    x: number,
    y: number,
  ): SpriteInScreen => ({
    width: 8,
    height: 8,
    pixels: [[]],
    paletteIndex: 0,
    x,
    y,
    spriteIndex: index,
    priority: "front",
    flipH: false,
    flipV: false,
  });

  describe("getGroupBounds", () => {
    it("returns correct bounds for single sprite", () => {
      const sprites = [createTestSprite(0, 10, 20)];
      const indices = new Set([0]);
      const bounds = getGroupBounds(sprites, indices);
      expect(bounds).toEqual({
        minX: 10,
        minY: 20,
        maxX: 18, // 10 + 8
        maxY: 28, // 20 + 8
      });
    });

    it("returns correct bounds for multiple sprites", () => {
      const sprites = [
        createTestSprite(0, 10, 20),
        createTestSprite(1, 30, 40),
        createTestSprite(2, 50, 10),
      ];
      const indices = new Set([0, 1, 2]);
      const bounds = getGroupBounds(sprites, indices);
      expect(bounds).toEqual({
        minX: 10,
        minY: 10,
        maxX: 58, // 50 + 8
        maxY: 48, // 40 + 8
      });
    });

    it("returns correct bounds for subset of sprites", () => {
      const sprites = [
        createTestSprite(0, 10, 20),
        createTestSprite(1, 30, 40),
        createTestSprite(2, 50, 10),
      ];
      const indices = new Set([0, 2]);
      const bounds = getGroupBounds(sprites, indices);
      expect(bounds).toEqual({
        minX: 10,
        minY: 10,
        maxX: 58,
        maxY: 28,
      });
    });

    it("returns empty bounds for empty selection", () => {
      const sprites = [createTestSprite(0, 10, 20)];
      const indices = new Set<number>();
      const bounds = getGroupBounds(sprites, indices);
      expect(bounds).toEqual({
        minX: Infinity,
        minY: Infinity,
        maxX: -Infinity,
        maxY: -Infinity,
      });
    });
  });

  describe("moveGroupByDelta", () => {
    it("moves all selected sprites by delta", () => {
      const sprites = [
        createTestSprite(0, 10, 20),
        createTestSprite(1, 30, 40),
      ];
      const indices = new Set([0, 1]);
      const moved = moveGroupByDelta(sprites, indices, 5, 10);

      expect(moved).toHaveLength(2);
      expect(moved[0]).toEqual({ ...sprites[0], x: 15, y: 30 });
      expect(moved[1]).toEqual({ ...sprites[1], x: 35, y: 50 });
    });

    it("moves only selected sprites", () => {
      const sprites = [
        createTestSprite(0, 10, 20),
        createTestSprite(1, 30, 40),
        createTestSprite(2, 50, 10),
      ];
      const indices = new Set([0, 2]);
      const moved = moveGroupByDelta(sprites, indices, -5, -10);

      expect(moved).toHaveLength(3);
      expect(moved[0]).toEqual({ ...sprites[0], x: 5, y: 10 });
      expect(moved[1]).toEqual(sprites[1]); // unchanged
      expect(moved[2]).toEqual({ ...sprites[2], x: 45, y: 0 });
    });

    it("preserves unselected sprites", () => {
      const sprites = [
        createTestSprite(0, 10, 20),
        createTestSprite(1, 30, 40),
      ];
      const indices = new Set([0]);
      const moved = moveGroupByDelta(sprites, indices, 100, 100);

      expect(moved[1]).toBe(sprites[1]);
    });

    it("handles negative deltas", () => {
      const sprites = [createTestSprite(0, 50, 50)];
      const indices = new Set([0]);
      const moved = moveGroupByDelta(sprites, indices, -20, -30);

      expect(moved[0]).toEqual({ ...sprites[0], x: 30, y: 20 });
    });
  });

  describe("isValidGroupMovement", () => {
    it("returns true for movement within bounds", () => {
      const sprites = [
        createTestSprite(0, 10, 20),
        createTestSprite(1, 30, 40),
      ];
      const indices = new Set([0, 1]);
      const valid = isValidGroupMovement(sprites, indices, 5, 10);
      expect(valid).toBe(true);
    });

    it("returns false when movement takes sprite below x=0", () => {
      const sprites = [createTestSprite(0, 5, 20)];
      const indices = new Set([0]);
      const valid = isValidGroupMovement(sprites, indices, -10, 0);
      expect(valid).toBe(false);
    });

    it("returns false when movement takes sprite below y=0", () => {
      const sprites = [createTestSprite(0, 10, 5)];
      const indices = new Set([0]);
      const valid = isValidGroupMovement(sprites, indices, 0, -10);
      expect(valid).toBe(false);
    });

    it("returns false when movement takes sprite beyond screen width", () => {
      const sprites = [createTestSprite(0, 252, 20)]; // 252 + 8 = 260 > 256
      const indices = new Set([0]);
      const valid = isValidGroupMovement(sprites, indices, 10, 0);
      expect(valid).toBe(false);
    });

    it("returns false when movement takes sprite beyond screen height", () => {
      const sprites = [createTestSprite(0, 10, 232)]; // 232 + 8 = 240 > 240
      const indices = new Set([0]);
      const valid = isValidGroupMovement(sprites, indices, 0, 10);
      expect(valid).toBe(false);
    });

    it("allows sprites to be at screen boundaries", () => {
      const sprites = [
        createTestSprite(0, 0, 0), // top-left
        createTestSprite(1, 248, 232), // bottom-right (248 + 8 = 256, 232 + 8 = 240)
      ];
      const indices = new Set([0, 1]);
      const valid = isValidGroupMovement(sprites, indices, 0, 0);
      expect(valid).toBe(true);
    });
  });
});
