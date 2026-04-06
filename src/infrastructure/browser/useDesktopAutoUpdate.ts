import { useEffect } from "react";

const hasTauriRuntime = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  return Reflect.has(window, "__TAURI_INTERNALS__");
};

const resolveUpdateNotes = (updateBody: unknown): string => {
  if (typeof updateBody !== "string") {
    return "";
  }

  const trimmedNotes = updateBody.trim();

  if (trimmedNotes.length === 0) {
    return "";
  }

  return `\n\nリリースノート:\n${trimmedNotes}`;
};

const buildUpdatePromptMessage = (
  version: string,
  updateBody: unknown,
): string => {
  const notes = resolveUpdateNotes(updateBody);
  return `新しいバージョン ${version} が利用できます。今すぐ更新を適用しますか？${notes}`;
};

const resolveErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return "unknown error";
};

const runDesktopAutoUpdate = async (): Promise<void> => {
  if (import.meta.env.DEV === true) {
    return;
  }

  if (hasTauriRuntime() !== true) {
    return;
  }

  const updaterModule = await import("@tauri-apps/plugin-updater");
  const update = await updaterModule.check();

  if (update instanceof Object !== true) {
    return;
  }

  const shouldInstall = window.confirm(
    buildUpdatePromptMessage(update.version, update.body),
  );

  if (shouldInstall !== true) {
    return;
  }

  await update.downloadAndInstall();

  const shouldRestart = window.confirm(
    "更新を適用しました。再起動して新しいバージョンを起動しますか？",
  );

  if (shouldRestart !== true) {
    return;
  }

  const processModule = await import("@tauri-apps/plugin-process");
  await processModule.relaunch();
};

export const useDesktopAutoUpdate = (): void => {
  useEffect(() => {
    const run = async (): Promise<void> => {
      try {
        await runDesktopAutoUpdate();
      } catch (error: unknown) {
        console.info(`[updater] auto-update check skipped: ${resolveErrorMessage(error)}`);
      }
    };

    void run();
  }, []);
};
