import * as O from "fp-ts/Option";

export type ViteCommand = "build" | "serve";
type ViteEnvironment = NodeJS.ProcessEnv;

const ROOT_BASE_PATH = "/";

const ensureLeadingSlash = (basePath: string): string => {
  return basePath.startsWith("/") ? basePath : `/${basePath}`;
};

const ensureTrailingSlash = (basePath: string): string => {
  return basePath.endsWith("/") ? basePath : `${basePath}/`;
};

const normalizeBasePath = (basePath: string): string => {
  const trimmedBasePath = basePath.trim();

  if (trimmedBasePath === "") {
    return ROOT_BASE_PATH;
  }

  return ensureTrailingSlash(ensureLeadingSlash(trimmedBasePath));
};

const getRepositoryName = (repositorySlug: string): O.Option<string> => {
  const segments = repositorySlug.split("/");

  if (segments.length !== 2) {
    return O.none;
  }

  const repositoryNameOption = O.fromNullable(segments[1]);

  if (O.isNone(repositoryNameOption)) {
    return O.none;
  }

  if (repositoryNameOption.value === "") {
    return O.none;
  }

  return repositoryNameOption;
};

/**
 * 実行環境に応じた Vite の base パスを決定します。
 * GitHub Pages ビルドでは `/repo-name/` を返し、通常開発とデスクトップ向けビルドでは `/` を返します。
 */
export const getViteBase = (
  command: ViteCommand,
  env: ViteEnvironment = process.env,
): string => {
  if (command !== "build") {
    return ROOT_BASE_PATH;
  }

  const configuredBasePathOption = O.fromNullable(env.VITE_BASE_PATH);

  if (O.isSome(configuredBasePathOption)) {
    const normalizedConfiguredBasePath = normalizeBasePath(
      configuredBasePathOption.value,
    );

    return normalizedConfiguredBasePath;
  }

  const isGitHubActions = env.GITHUB_ACTIONS === "true";

  if (isGitHubActions !== true) {
    return ROOT_BASE_PATH;
  }

  const repositorySlugOption = O.fromNullable(env.GITHUB_REPOSITORY);

  if (O.isNone(repositorySlugOption)) {
    return ROOT_BASE_PATH;
  }

  const repositoryNameOption = getRepositoryName(repositorySlugOption.value);

  if (O.isNone(repositoryNameOption)) {
    return ROOT_BASE_PATH;
  }

  return normalizeBasePath(repositoryNameOption.value);
};
