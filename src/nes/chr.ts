import { ColorIndexOfPalette, SpriteTile } from "../../src/store/projectState";

/**
 * 8x8 タイルを 16 バイトCHRに変換（先頭8B: bitplane0, 次の8B: bitplane1）
 * NESの2bitピクセル値(0..3)の下位ビットがplane0、上位ビットがplane1となる想定。
 */
export function tile8x8ToChr(tile: SpriteTile): Uint8Array {
    if (tile.width !== 8 || tile.height !== 8) {
        throw new Error("tile8x8ToChr: 8x8のみ対応");
    }
    const plane0 = new Uint8Array(8);
    const plane1 = new Uint8Array(8);

    for (let y = 0; y < 8; y++) {
        let p0 = 0;
        let p1 = 0;
        for (let x = 0; x < 8; x++) {
            const pix: ColorIndexOfPalette = tile.pixels[y][x];
            const b0 = pix & 1;
            const b1 = (pix >> 1) & 1;
            // NESはビット7が左端ピクセル
            p0 |= b0 << (7 - x);
            p1 |= b1 << (7 - x);
        }
        plane0[y] = p0;
        plane1[y] = p1;
    }

    const out = new Uint8Array(16);
    out.set(plane0, 0);
    out.set(plane1, 8);
    return out;
}

/**
 * 8x16はCHR上では8x8が上下に2枚並ぶ（合計32バイト）。
 * NES仕様上、上下で同一パレットを使う前提で扱います。
 */
export function tile8x16ToChr(top: SpriteTile, bottom: SpriteTile): Uint8Array {
    if (top.width !== 8 || top.height !== 8 || bottom.width !== 8 || bottom.height !== 8) {
        throw new Error("tile8x16ToChr: 上下とも8x8タイルを渡してください");
    }
    const topChr = tile8x8ToChr(top);
    const bottomChr = tile8x8ToChr(bottom);
    const out = new Uint8Array(32);
    out.set(topChr, 0);
    out.set(bottomChr, 16);
    return out;
}
