import * as O from "fp-ts/Option";

/**
 * 数値が指定範囲内に収まっているかを判定します。
 * ステージ座標や入力値の境界判定を、読みやすい名前で共通化するための関数です。
 */
export const isInRange = (value: number, min: number, max: number): boolean =>
  value >= min && value <= max;

/**
 * 文字列入力を整数へ変換し、失敗時は `Option.none` を返します。
 * 空文字や不正値を UI 境界で落とし、以後の計算を数値だけで扱えるようにします。
 */
export const toNumber = (value: string): O.Option<number> => {
  if (value === "") {
    return O.none;
  }

  const parsed = Number(value);
  if (Number.isInteger(parsed) === false) {
    return O.none;
  }

  return O.some(parsed);
};

/**
 * 数値を指定した最小値と最大値の範囲に丸め込みます。
 * ステージ寸法や座標更新が許容範囲を超えないようにする基本ユーティリティです。
 */
export const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));
