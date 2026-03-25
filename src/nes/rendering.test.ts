import { describe, expect, it } from "vitest";
import { NES_PALETTE_HEX } from "./palette";
import { renderScreenToHexArray, renderSpriteTileToHexArray } from "./rendering";
import { BackgroundTile, ColorIndexOfPalette, Palettes, Screen, SpriteInScreen, SpriteTile } from "../store/projectState";

const palettes: Palettes = [
    [45, 1, 21, 34],
    [13, 2, 22, 35],
    [7, 3, 23, 36],
    [9, 4, 24, 37],
];

function createSpriteTile(fill: ColorIndexOfPalette = 0): SpriteTile {
    return {
        width: 8,
        height: 8,
        paletteIndex: 0,
        pixels: Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => fill)),
    };
}

function createBackgroundTile(fill: ColorIndexOfPalette, paletteIndex = 1): BackgroundTile {
    return {
        width: 8,
        height: 8,
        paletteIndex: paletteIndex as 0 | 1 | 2 | 3,
        pixels: Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => fill)),
    };
}

function createScreen(sprites: SpriteInScreen[], backgroundTiles: BackgroundTile[][]): Screen {
    return {
        width: 256,
        height: 240,
        backgroundTiles,
        sprites,
    };
}

describe("renderSpriteTileToHexArray", () => {
    it("keeps palette slot 0 transparent for sprite exports", () => {
        const tile = createSpriteTile();
        tile.pixels[0][1] = 1;
        tile.pixels[0][2] = 2;
        tile.pixels[0][3] = 3;

        const rendered = renderSpriteTileToHexArray(tile, palettes);

        expect(rendered[0][0]).toBe(NES_PALETTE_HEX[0]);
        expect(rendered[0][1]).toBe(NES_PALETTE_HEX[1]);
        expect(rendered[0][2]).toBe(NES_PALETTE_HEX[21]);
        expect(rendered[0][3]).toBe(NES_PALETTE_HEX[34]);
    });
});

describe("renderScreenToHexArray", () => {
    it("renders sprite pixels over the background and treats sprite slot 0 as transparent", () => {
        const background = createBackgroundTile(2, 1);

        const sprite: SpriteInScreen = {
            ...createSpriteTile(),
            x: 0,
            y: 0,
            spriteIndex: 0,
        };
        sprite.pixels[0][0] = 0;
        sprite.pixels[0][1] = 1;

        const rendered = renderScreenToHexArray(createScreen([sprite], [[background]]), palettes);

        expect(rendered[0][0]).toBe(NES_PALETTE_HEX[22]);
        expect(rendered[0][1]).toBe(NES_PALETTE_HEX[1]);
    });

    it("draws higher spriteIndex entries last when sprites overlap", () => {
        const backSprite: SpriteInScreen = {
            ...createSpriteTile(1),
            x: 4,
            y: 4,
            spriteIndex: 0,
        };
        const frontSprite: SpriteInScreen = {
            ...createSpriteTile(3),
            x: 4,
            y: 4,
            spriteIndex: 1,
        };

        const rendered = renderScreenToHexArray(createScreen([frontSprite, backSprite], []), palettes);

        expect(rendered[4][4]).toBe(NES_PALETTE_HEX[34]);
    });
});
