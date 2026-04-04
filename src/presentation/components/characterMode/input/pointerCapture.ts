export const trySetPointerCapture = (
  target: HTMLElement,
  pointerId: number,
): void => {
  try {
    target.setPointerCapture(pointerId);
  } catch {
    // Synthetic pointer events used in tests may not have a capturable pointer.
  }
};
