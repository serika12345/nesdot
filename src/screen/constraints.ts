import { Screen } from "../store/projectState";

export const MAX_SCREEN_SPRITES = 64;
export const MAX_SPRITES_PER_SCANLINE = 8;

export type ScreenConstraintReport = { ok: true } | { ok: false; errors: string[] };

export function scanScreenSpriteConstraints(screen: Screen): ScreenConstraintReport {
    const errors: string[] = [];

    if (screen.sprites.length > MAX_SCREEN_SPRITES) {
        errors.push(`スプライト総数が上限(${MAX_SCREEN_SPRITES})を超えています: ${screen.sprites.length}`);
    }

    const scanlineCount = new Array<number>(screen.height).fill(0);

    for (const sprite of screen.sprites) {
        const visibleTop = Math.max(0, sprite.y);
        const visibleBottom = Math.min(screen.height - 1, sprite.y + sprite.height - 1);

        for (let y = visibleTop; y <= visibleBottom; y++) {
            scanlineCount[y]++;
        }
    }

    const violatedLines: number[] = [];
    for (let y = 0; y < screen.height; y++) {
        if (scanlineCount[y] > MAX_SPRITES_PER_SCANLINE) {
            violatedLines.push(y);
        }
    }

    if (violatedLines.length > 0) {
        const sample = violatedLines.slice(0, 10).join(", ");
        errors.push(`同一スキャンライン上のスプライト数が上限(${MAX_SPRITES_PER_SCANLINE})を超えています。y=${sample}`);
    }

    return errors.length > 0 ? { ok: false, errors } : { ok: true };
}
