export type ViteCommand = "build" | "serve";

type BuildEnvironment = {
  readonly GITHUB_ACTIONS?: string;
  readonly GITHUB_REPOSITORY?: string;
};

const getRepositoryName = (githubRepository?: string): string => {
  if (typeof githubRepository !== "string") {
    return "";
  }

  const repositoryParts = githubRepository.split("/");

  if (repositoryParts.length !== 2) {
    return "";
  }

  return repositoryParts[1] ?? "";
};

/**
 * 実行環境に応じた Vite の base パスを決定します。
 * GitHub Pages 用ビルドと通常開発で配信ルートを切り替え、同じ設定から安全に公開できるようにします。
 */
export const getViteBase = (
  command: ViteCommand,
  environment: BuildEnvironment,
): string => {
  if (command !== "build") {
    return "/";
  }

  if (environment.GITHUB_ACTIONS !== "true") {
    return "/";
  }

  const repositoryName = getRepositoryName(environment.GITHUB_REPOSITORY);

  if (repositoryName.length === 0) {
    return "/";
  }

  return `/${repositoryName}/`;
};
