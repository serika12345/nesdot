import * as O from "fp-ts/Option";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mockedDependencies = vi.hoisted(() => {
  return {
    createPwaUpdateCheck: vi.fn(() => vi.fn()),
    requestDesktopAutoUpdateCheck: vi.fn(),
  };
});

vi.mock("./useDesktopAutoUpdate", () => {
  return {
    requestDesktopAutoUpdateCheck:
      mockedDependencies.requestDesktopAutoUpdateCheck,
  };
});

vi.mock("./pwaUpdateMonitor", () => {
  return {
    createPwaUpdateCheck: mockedDependencies.createPwaUpdateCheck,
  };
});

import {
  requestUpdateCheckForTarget,
  resolveUpdateCheckTargetFromFlags,
  type UpdateCheckAvailabilityFlags,
} from "./updateCheck";

const createAvailabilityFlags = (
  overrides: Partial<UpdateCheckAvailabilityFlags> = {},
): UpdateCheckAvailabilityFlags => {
  return {
    hasTauriRuntime: false,
    isPwaRuntime: false,
    isProduction: true,
    hasWindow: true,
    hasDocument: true,
    hasNavigator: true,
    hasServiceWorker: true,
    ...overrides,
  };
};

describe("resolveUpdateCheckTargetFromFlags", () => {
  test("prefers desktop update checks inside Tauri", () => {
    expect(
      resolveUpdateCheckTargetFromFlags(
        createAvailabilityFlags({
          hasTauriRuntime: true,
        }),
      ),
    ).toEqual(O.some("desktop"));
  });

  test("enables pwa update checks inside standalone pwa runtime", () => {
    expect(
      resolveUpdateCheckTargetFromFlags(
        createAvailabilityFlags({
          isPwaRuntime: true,
        }),
      ),
    ).toEqual(O.some("pwa"));
  });

  test("keeps update checks unavailable on general production web", () => {
    expect(
      resolveUpdateCheckTargetFromFlags(createAvailabilityFlags()),
    ).toEqual(O.none);
  });

  test("keeps update checks unavailable when service workers cannot be used", () => {
    expect(
      resolveUpdateCheckTargetFromFlags(
        createAvailabilityFlags({
          isPwaRuntime: true,
          hasServiceWorker: false,
        }),
      ),
    ).toEqual(O.none);
  });
});

describe("requestUpdateCheckForTarget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("routes desktop checks to the tauri updater", () => {
    requestUpdateCheckForTarget("desktop", O.none);

    expect(
      mockedDependencies.requestDesktopAutoUpdateCheck,
    ).toHaveBeenCalledTimes(1);
    expect(mockedDependencies.createPwaUpdateCheck).not.toHaveBeenCalled();
  });

  test("routes pwa checks through the service worker registration", () => {
    const runUpdateCheck = vi.fn();
    const serviceWorker = {
      ready: Promise.resolve({
        update: vi.fn(async () => {}),
      }),
    };

    mockedDependencies.createPwaUpdateCheck.mockReturnValueOnce(runUpdateCheck);

    requestUpdateCheckForTarget("pwa", O.some(serviceWorker));

    expect(mockedDependencies.createPwaUpdateCheck).toHaveBeenCalledWith(
      serviceWorker,
    );
    expect(runUpdateCheck).toHaveBeenCalledTimes(1);
  });

  test("keeps pwa checks inert when service worker support is missing", () => {
    requestUpdateCheckForTarget("pwa", O.none);

    expect(
      mockedDependencies.requestDesktopAutoUpdateCheck,
    ).not.toHaveBeenCalled();
    expect(mockedDependencies.createPwaUpdateCheck).not.toHaveBeenCalled();
  });
});
