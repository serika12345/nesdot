import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import { resolveIsStandalonePwaRuntime } from "./pwaRuntime";
import {
  createPwaUpdateCheck,
  type PwaServiceWorkerLike,
} from "./pwaUpdateMonitor";
import { requestDesktopAutoUpdateCheck } from "./useDesktopAutoUpdate";

type UpdateCheckTarget = "desktop" | "pwa";

export interface UpdateCheckAvailabilityFlags {
  readonly hasTauriRuntime: boolean;
  readonly isPwaRuntime: boolean;
  readonly isProduction: boolean;
  readonly hasWindow: boolean;
  readonly hasDocument: boolean;
  readonly hasNavigator: boolean;
  readonly hasServiceWorker: boolean;
}

export const resolveUpdateCheckTargetFromFlags = (
  flags: UpdateCheckAvailabilityFlags,
): O.Option<UpdateCheckTarget> => {
  if (flags.hasTauriRuntime === true) {
    return O.some("desktop");
  }

  if (
    flags.isPwaRuntime === true &&
    flags.isProduction === true &&
    flags.hasWindow === true &&
    flags.hasDocument === true &&
    flags.hasNavigator === true &&
    flags.hasServiceWorker === true
  ) {
    return O.some("pwa");
  }

  return O.none;
};

const resolveHasTauriRuntime = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  return Reflect.has(window, "__TAURI_INTERNALS__");
};

const resolveNavigatorServiceWorker = (): O.Option<PwaServiceWorkerLike> => {
  if ("navigator" in globalThis && "serviceWorker" in navigator) {
    return O.some(navigator.serviceWorker);
  }

  return O.none;
};

const resolveUpdateCheckTarget = (): O.Option<UpdateCheckTarget> => {
  return resolveUpdateCheckTargetFromFlags({
    hasTauriRuntime: resolveHasTauriRuntime(),
    isPwaRuntime: resolveIsStandalonePwaRuntime(),
    isProduction: import.meta.env.PROD,
    hasWindow: "window" in globalThis,
    hasDocument: "document" in globalThis,
    hasNavigator: "navigator" in globalThis,
    hasServiceWorker: pipe(
      resolveNavigatorServiceWorker(),
      O.match(
        () => false,
        () => true,
      ),
    ),
  });
};

export const canRequestAvailableUpdateCheck = (): boolean => {
  return O.isSome(resolveUpdateCheckTarget());
};

export const requestUpdateCheckForTarget = (
  target: UpdateCheckTarget,
  serviceWorker: O.Option<PwaServiceWorkerLike>,
): void => {
  if (target === "desktop") {
    requestDesktopAutoUpdateCheck();
    return;
  }

  pipe(
    serviceWorker,
    O.match(
      () => {
        return;
      },
      (resolvedServiceWorker) => {
        createPwaUpdateCheck(resolvedServiceWorker)();
      },
    ),
  );
};

export const requestAvailableUpdateCheck = (): void => {
  pipe(
    resolveUpdateCheckTarget(),
    O.match(
      () => {
        return;
      },
      (target) => {
        requestUpdateCheckForTarget(target, resolveNavigatorServiceWorker());
      },
    ),
  );
};
