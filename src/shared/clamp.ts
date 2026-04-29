/**
 * 数値を指定した最小値と最大値の範囲に丸め込みます。
 */
export const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));
