import { NES_PALETTE_HEX } from "./palette";
import type { Palettes, Screen, SpriteTile } from "../store/projectState";

export function renderSpriteTileToHexArray(tile: SpriteTile, palettes: Palettes): string[][] {
    const palette = palettes[tile.paletteIndex];

    return tile.pixels.map((row) =>
        row.map((colorIndexOfPalette) =>
            colorIndexOfPalette === 0 ? NES_PALETTE_HEX[0] : NES_PALETTE_HEX[palette[colorIndexOfPalette]]
        )
    );
}

export function renderScreenToHexArray(screen: Screen, palettes: Palettes): string[][] {
    const backgroundLayer = Array.from({ length: screen.height }, () =>
        Array.from({ length: screen.width }, () => NES_PALETTE_HEX[0])
    );
    const spriteLayer = Array.from({ length: screen.height }, () =>
        Array.from({ length: screen.width }, () => null as string | null)
    );

    for (let tileY = 0; tileY < screen.backgroundTiles.length; tileY++) {
        const row = screen.backgroundTiles[tileY];
        for (let tileX = 0; tileX < row.length; tileX++) {
            const tile = row[tileX];
            const palette = palettes[tile.paletteIndex];
            const baseY = tileY * 8;
            const baseX = tileX * 8;

            for (let pixelY = 0; pixelY < 8; pixelY++) {
                for (let pixelX = 0; pixelX < 8; pixelX++) {
                    const colorIndex = tile.pixels[pixelY][pixelX];
                    const hex = NES_PALETTE_HEX[palette[colorIndex]];
                    const y = baseY + pixelY;
                    const x = baseX + pixelX;

                    if (y >= 0 && y < screen.height && x >= 0 && x < screen.width) {
                        backgroundLayer[y][x] = hex;
                    }
                }
            }
        }
    }

    const spritesSorted = [...screen.sprites].sort((a, b) => a.spriteIndex - b.spriteIndex);

    for (const sprite of spritesSorted) {
        const palette = palettes[sprite.paletteIndex];

        for (let pixelY = 0; pixelY < sprite.height; pixelY++) {
            const row = sprite.pixels[pixelY];
            if (!row) continue;

            for (let pixelX = 0; pixelX < sprite.width; pixelX++) {
                const colorIndex = row[pixelX];
                if (colorIndex == null || colorIndex === 0) continue;

                const x = (sprite.x | 0) + pixelX;
                const y = (sprite.y | 0) + pixelY;

                if (y < 0 || y >= screen.height || x < 0 || x >= screen.width) {
                    continue;
                }

                spriteLayer[y][x] = NES_PALETTE_HEX[palette[colorIndex]];
            }
        }
    }

    return Array.from({ length: screen.height }, (_, y) =>
        Array.from({ length: screen.width }, (_, x) => spriteLayer[y][x] ?? backgroundLayer[y][x])
    );
}
