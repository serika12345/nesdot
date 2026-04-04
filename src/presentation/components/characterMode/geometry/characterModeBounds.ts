import * as O from "fp-ts/Option";

export const isInRange = (value: number, min: number, max: number): boolean =>
  value >= min && value <= max;

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

export const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));
