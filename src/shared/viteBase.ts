export type ViteCommand = "build" | "serve";

/**
 * 実行環境に応じた Vite の base パスを決定します。
 * GitHub Pages 用ビルドと通常開発で配信ルートを切り替え、同じ設定から安全に公開できるようにします。
 */
export const getViteBase = (
  command: ViteCommand,
): string => {
  if (command !== "build") {
    return "/";
  }

  // Pages builds pass --base explicitly in workflow; desktop bundles must stay on root.
  return "/";
};
