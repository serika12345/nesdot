import { invoke, isTauri } from "@tauri-apps/api/core";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";

type RuntimeDiagnosticsSelfTest = "none" | "console" | "style";
type RuntimeDiagnosticKind =
  | "console-error"
  | "page-error"
  | "unhandledrejection"
  | "securitypolicyviolation";

interface RuntimeDiagnosticsConfig {
  readonly enabled: boolean;
  readonly selfTest: RuntimeDiagnosticsSelfTest;
}

interface RuntimeDiagnosticPayload {
  readonly kind: RuntimeDiagnosticKind;
  readonly message: string;
  readonly details?: string;
  readonly time: string;
}

const runtimeDiagnosticsSelfTests: ReadonlyArray<RuntimeDiagnosticsSelfTest> = [
  "none",
  "console",
  "style",
];
const runtimeDiagnosticKinds: ReadonlyArray<RuntimeDiagnosticKind> = [
  "console-error",
  "page-error",
  "unhandledrejection",
  "securitypolicyviolation",
];

const disabledRuntimeDiagnosticsConfig: RuntimeDiagnosticsConfig = {
  enabled: false,
  selfTest: "none",
};

const isRuntimeDiagnosticsSelfTest = (
  value: unknown,
): value is RuntimeDiagnosticsSelfTest => {
  return (
    typeof value === "string" &&
    runtimeDiagnosticsSelfTests.some((candidate) => candidate === value)
  );
};

const isRuntimeDiagnosticKind = (
  value: unknown,
): value is RuntimeDiagnosticKind => {
  return (
    typeof value === "string" &&
    runtimeDiagnosticKinds.some((candidate) => candidate === value)
  );
};

const readRecordBoolean = (
  value: object,
  key: string,
): ReadonlyArray<boolean> => {
  const candidate: unknown = Reflect.get(value, key);

  return typeof candidate === "boolean" ? [candidate] : [];
};

const readRecordString = (
  value: object,
  key: string,
): ReadonlyArray<string> => {
  const candidate: unknown = Reflect.get(value, key);

  return typeof candidate === "string" ? [candidate] : [];
};

const parseRuntimeDiagnosticsConfig = (
  value: unknown,
): RuntimeDiagnosticsConfig => {
  if (!(value instanceof Object)) {
    return disabledRuntimeDiagnosticsConfig;
  }

  const [enabled] = readRecordBoolean(value, "enabled");
  const [selfTestValue] = readRecordString(value, "selfTest");

  if (
    typeof enabled !== "boolean" ||
    isRuntimeDiagnosticsSelfTest(selfTestValue) !== true
  ) {
    return disabledRuntimeDiagnosticsConfig;
  }

  return {
    enabled,
    selfTest: selfTestValue,
  };
};

const createRuntimeDiagnosticPayload = (
  kind: RuntimeDiagnosticKind,
  message: string,
  details: ReadonlyArray<string>,
): O.Option<RuntimeDiagnosticPayload> => {
  if (isRuntimeDiagnosticKind(kind) !== true || message.length === 0) {
    return O.none;
  }

  const detailsText = details.join(" ");
  const time = new Date().toISOString();

  return detailsText.length > 0
    ? O.some({
        kind,
        message,
        details: detailsText,
        time,
      })
    : O.some({
        kind,
        message,
        time,
      });
};

const stringifyRuntimeDiagnosticValue = (value: unknown): string => {
  if (value instanceof Error) {
    return value.message;
  }

  if (typeof value === "string") {
    return value;
  }

  if (value instanceof Object) {
    try {
      const serializedValue = JSON.stringify(value);

      return typeof serializedValue === "string"
        ? serializedValue
        : String(value);
    } catch {
      return String(value);
    }
  }

  return String(value);
};

const toDetailParts = (value: string): ReadonlyArray<string> => {
  return value.length > 0 ? [value] : [];
};

const loadRuntimeDiagnosticsConfig =
  async (): Promise<RuntimeDiagnosticsConfig> => {
    if (isTauri() !== true) {
      return disabledRuntimeDiagnosticsConfig;
    }

    try {
      const response = await invoke("get_runtime_diagnostics_config");

      return parseRuntimeDiagnosticsConfig(response);
    } catch {
      return disabledRuntimeDiagnosticsConfig;
    }
  };

const runtimeDiagnosticsConfigPromise = loadRuntimeDiagnosticsConfig();

const recordRuntimeDiagnostic = (
  payload: RuntimeDiagnosticPayload,
): Promise<void> => {
  return runtimeDiagnosticsConfigPromise.then((config) => {
    if (config.enabled !== true) {
      return;
    }

    void invoke("record_runtime_diagnostic", { payload }).catch(() => {});
  });
};

const emitRuntimeDiagnostic = (
  kind: RuntimeDiagnosticKind,
  message: string,
  details: ReadonlyArray<string> = [],
): void => {
  const payload = createRuntimeDiagnosticPayload(kind, message, details);

  pipe(
    payload,
    O.match(
      () => {
        return;
      },
      (resolvedPayload) => {
        void recordRuntimeDiagnostic(resolvedPayload);
      },
    ),
  );
};

const installConsoleErrorRuntimeDiagnostics = (): void => {
  const originalConsoleError: Console["error"] = console.error;

  console.error = (...data: unknown[]): void => {
    const message = data.map(stringifyRuntimeDiagnosticValue).join(" ");

    Reflect.apply(originalConsoleError, console, data);
    emitRuntimeDiagnostic(
      "console-error",
      message.length > 0 ? message : "console.error called with no arguments",
    );
  };
};

const installWindowErrorRuntimeDiagnostics = (): void => {
  window.addEventListener("error", (event: ErrorEvent) => {
    const details = [
      ...toDetailParts(event.filename),
      ...(event.lineno > 0 ? [`line=${event.lineno}`] : []),
      ...(event.colno > 0 ? [`column=${event.colno}`] : []),
    ];

    emitRuntimeDiagnostic(
      "page-error",
      event.message.length > 0 ? event.message : "window error event",
      details,
    );
  });
};

const installUnhandledRejectionRuntimeDiagnostics = (): void => {
  window.addEventListener(
    "unhandledrejection",
    (event: PromiseRejectionEvent) => {
      const message = stringifyRuntimeDiagnosticValue(event.reason);

      emitRuntimeDiagnostic(
        "unhandledrejection",
        message.length > 0 ? message : "unhandled promise rejection",
      );
    },
  );
};

const installSecurityPolicyViolationRuntimeDiagnostics = (): void => {
  window.addEventListener(
    "securitypolicyviolation",
    (event: SecurityPolicyViolationEvent) => {
      const details = [
        `directive=${event.effectiveDirective}`,
        ...toDetailParts(event.blockedURI),
        ...toDetailParts(event.sourceFile),
      ];

      emitRuntimeDiagnostic(
        "securitypolicyviolation",
        event.violatedDirective.length > 0
          ? event.violatedDirective
          : "security policy violation",
        details,
      );
    },
  );
};

const runRuntimeDiagnosticsSelfTest = (
  config: RuntimeDiagnosticsConfig,
): void => {
  if (config.enabled !== true) {
    return;
  }

  if (config.selfTest === "console") {
    console.error("verify-tauri-csp-console-self-test");
    return;
  }

  if (config.selfTest === "style") {
    const diagnosticStyle = document.createElement("style");
    diagnosticStyle.textContent = "body { outline: 2px solid red; }";
    const styleParent =
      document.head instanceof HTMLHeadElement
        ? document.head
        : document.documentElement;

    styleParent.append(diagnosticStyle);
  }
};

const installTauriRuntimeDiagnostics = (): void => {
  if (isTauri() !== true) {
    return;
  }

  installConsoleErrorRuntimeDiagnostics();
  installWindowErrorRuntimeDiagnostics();
  installUnhandledRejectionRuntimeDiagnostics();
  installSecurityPolicyViolationRuntimeDiagnostics();

  void runtimeDiagnosticsConfigPromise.then(runRuntimeDiagnosticsSelfTest);
};

installTauriRuntimeDiagnostics();
