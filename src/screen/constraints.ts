import { Screen } from "../store/projectState";

export const MAX_SCREEN_SPRITES = 64;
export const MAX_SPRITES_PER_SCANLINE = 8;

export type ScreenConstraintReport = { ok: true } | { ok: false; errors: string[] };

export function scanScreenSpriteConstraints(screen: Screen): ScreenConstraintReport {
    const scanlineCount = screen.sprites.reduce(
        (counts, sprite) => {
            const visibleTop = Math.max(0, sprite.y);
            const visibleBottom = Math.min(screen.height - 1, sprite.y + sprite.height - 1);

            return counts.map((count, y) => (y >= visibleTop && y <= visibleBottom ? count + 1 : count));
        },
        Array.from({ length: screen.height }, () => 0)
    );

    const violatedLines = scanlineCount.flatMap((count, y) => (count > MAX_SPRITES_PER_SCANLINE ? [y] : []));
    const spriteCountError =
        screen.sprites.length > MAX_SCREEN_SPRITES
            ? [`スプライト総数が上限(${MAX_SCREEN_SPRITES})を超えています: ${screen.sprites.length}`]
            : [];
    const scanlineError =
        violatedLines.length > 0
            ? [
                  `同一スキャンライン上のスプライト数が上限(${MAX_SPRITES_PER_SCANLINE})を超えています。y=${violatedLines
                      .slice(0, 10)
                      .join(", ")}`,
              ]
            : [];
    const errors = [...spriteCountError, ...scanlineError];

    return errors.length > 0 ? { ok: false, errors } : { ok: true };
}
