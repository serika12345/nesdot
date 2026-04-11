/**
 * 可能な環境だけで pointer capture を設定します。
 * テスト環境や合成イベントで例外が出ても操作全体を壊さないよう、安全側で吸収するための関数です。
 */
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
