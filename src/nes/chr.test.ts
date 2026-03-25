import { describe, expect, it } from "vitest";
import { isLeft, isRight } from "fp-ts/Either";
import { tile8x16ToChr, tile8x8ToChr } from "./chr";
import { ColorIndexOfPalette, SpriteTile } from "../store/projectState";

function create8x8Tile(fill: ColorIndexOfPalette): SpriteTile {
    return {
        width: 8,
        height: 8,
        paletteIndex: 0,
        pixels: Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => fill)),
    };
}

describe("tile8x8ToChr", () => {
    it("converts 2-bit pixels into CHR bitplanes", () => {
        const row = [0, 1, 2, 3, 0, 1, 2, 3] as ColorIndexOfPalette[];
        const tile: SpriteTile = {
            width: 8,
            height: 8,
            paletteIndex: 0,
            pixels: Array.from({ length: 8 }, () => row.slice()),
        };

        const result = tile8x8ToChr(tile);
        expect(isRight(result)).toBe(true);
        if (isRight(result)) {
            expect(Array.from(result.right)).toEqual([
                0x55,
                0x55,
                0x55,
                0x55,
                0x55,
                0x55,
                0x55,
                0x55,
                0x33,
                0x33,
                0x33,
                0x33,
                0x33,
                0x33,
                0x33,
                0x33,
            ]);
        }
    });

    it("rejects non-8x8 tiles", () => {
        const tile: SpriteTile = {
            width: 8,
            height: 16,
            paletteIndex: 0,
            pixels: Array.from({ length: 16 }, () => Array.from({ length: 8 }, () => 0 as ColorIndexOfPalette)),
        };

        const result = tile8x8ToChr(tile);
        expect(isLeft(result)).toBe(true);
        if (isLeft(result)) {
            expect(result.left).toBe("tile8x8ToChr: 8x8のみ対応");
        }
    });
});

describe("tile8x16ToChr", () => {
    it("concatenates the upper and lower CHR tiles", () => {
        const top = create8x8Tile(1);
        const bottom = create8x8Tile(2);

        const result = tile8x16ToChr(top, bottom);
        expect(isRight(result)).toBe(true);
        if (isRight(result)) {
            expect(Array.from(result.right)).toEqual([
                0xff,
                0xff,
                0xff,
                0xff,
                0xff,
                0xff,
                0xff,
                0xff,
                0x00,
                0x00,
                0x00,
                0x00,
                0x00,
                0x00,
                0x00,
                0x00,
                0x00,
                0x00,
                0x00,
                0x00,
                0x00,
                0x00,
                0x00,
                0x00,
                0xff,
                0xff,
                0xff,
                0xff,
                0xff,
                0xff,
                0xff,
                0xff,
            ]);
        }
    });
});
