import { spawn } from "node:child_process";

const DEV_SERVER_PORT = 1420;
const DEV_SERVER_URLS = [
  `http://localhost:${DEV_SERVER_PORT}/`,
  `http://127.0.0.1:${DEV_SERVER_PORT}/`,
  `http://[::1]:${DEV_SERVER_PORT}/`,
];
const EXPECTED_MARKERS = ["<title>nesdot</title>", "/src/main.tsx"];

async function inspectUrl(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "text/html",
      },
    });
    const html = await response.text();
    const isExpectedServer = EXPECTED_MARKERS.some((marker) =>
      html.includes(marker),
    );

    return { isRunning: true, isExpectedServer, url };
  } catch (error) {
    const message = Error.prototype.isPrototypeOf(error)
      ? String(error.message)
      : String(error);
    const isConnectionError =
      message.includes("ECONNREFUSED") ||
      message.includes("fetch failed") ||
      message.includes("timed out") ||
      message.includes("aborted");

    if (isConnectionError) {
      return { isRunning: false, isExpectedServer: false, url };
    }

    return {
      isRunning: false,
      isExpectedServer: false,
      url,
      error: message,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function inspectExistingDevServer() {
  for (const url of DEV_SERVER_URLS) {
    const result = await inspectUrl(url);
    if (result.error) {
      return result;
    }
    if (result.isRunning) {
      return result;
    }
  }

  return {
    isRunning: false,
    isExpectedServer: false,
    url: DEV_SERVER_URLS[0],
  };
}

function runFrontendDevServer() {
  const child = spawn("pnpm", ["dev"], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  const forwardSignal = (signal) => {
    if (!child.killed) {
      child.kill(signal);
    }
  };

  process.on("SIGINT", forwardSignal);
  process.on("SIGTERM", forwardSignal);

  child.on("exit", (code, signal) => {
    process.off("SIGINT", forwardSignal);
    process.off("SIGTERM", forwardSignal);

    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });
}

const existingServer = await inspectExistingDevServer();

if (existingServer.isRunning && existingServer.isExpectedServer) {
  console.log(
    `[tauri] Reusing existing frontend dev server at ${existingServer.url}`,
  );
  process.exit(0);
}

if (existingServer.error) {
  console.error(
    `[tauri] Failed to inspect dev server status: ${existingServer.error}`,
  );
  process.exit(1);
}

if (existingServer.isRunning && !existingServer.isExpectedServer) {
  console.error(
    `[tauri] Port ${DEV_SERVER_PORT} is already in use by another service. Stop it or run nesdot on a different port.`,
  );
  process.exit(1);
}

console.log("[tauri] No frontend dev server detected. Starting `pnpm dev`...");
runFrontendDevServer();
