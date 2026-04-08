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

/**
 * Vite の base パスを決定します。
 * build 時は `VITE_BASE_PATH` を唯一の明示入力として使い、未指定時のみ `/` を返します。
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

  return ROOT_BASE_PATH;
};
