import { readFileSync, readdirSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const safeReadTextFile = (filePath) => {
  try {
    return readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
};

const safeRealPath = (filePath) => {
  try {
    return realpathSync(filePath);
  } catch {
    return filePath;
  }
};

const hasNonEmptyEnv = (name) => {
  const value = process.env[name];

  return typeof value === "string" && value.length > 0;
};

const directoryHasEntries = (directoryPath) => {
  try {
    return readdirSync(directoryPath).length > 0;
  } catch {
    return false;
  }
};

const procVersion = safeReadTextFile("/proc/version").toLowerCase();
const pidOneCommand = safeReadTextFile("/proc/1/comm").trim().toLowerCase();
const distroName = process.env.WSL_DISTRO_NAME;
const isWsl =
  typeof distroName === "string" || procVersion.includes("microsoft");
const repoPath = safeRealPath(process.cwd());
const isWindowsMount = repoPath.startsWith("/mnt/");
const hasWaylandDisplay = hasNonEmptyEnv("WAYLAND_DISPLAY");
const hasX11Display = hasNonEmptyEnv("DISPLAY");
const hasRuntimeDirectory = hasNonEmptyEnv("XDG_RUNTIME_DIR");
const hasDbusSession = hasNonEmptyEnv("DBUS_SESSION_BUS_ADDRESS");
const hasDirenvLoaded = hasNonEmptyEnv("DIRENV_FILE");
const isInNixShell = hasNonEmptyEnv("IN_NIX_SHELL");
const usesSystemd = pidOneCommand === "systemd";
const hasWslg = (hasWaylandDisplay || hasX11Display) && hasRuntimeDirectory;
const playwrightBrowsersPath = join(homedir(), ".cache", "ms-playwright");
const hasPlaywrightBrowsers = directoryHasEntries(playwrightBrowsersPath);
const wslOnlyDetail = "This check only applies when running inside WSL.";

const checks = [
  {
    status: isWsl ? "PASS" : "WARN",
    label: "WSL detection",
    detail: isWsl
      ? `Detected ${distroName ?? "a WSL environment"}.`
      : "WSL was not detected. This command is informational outside WSL.",
  },
  {
    status: isWindowsMount ? "FAIL" : "PASS",
    label: "Repository filesystem",
    detail: isWindowsMount
      ? `${repoPath} is under /mnt/. Move the repository into the WSL filesystem, for example ~/src/nesdot.`
      : isWsl
        ? `${repoPath} is in the WSL filesystem, which is recommended for file watching and I/O.`
        : `${repoPath} is not under /mnt/, so it avoids Windows-mounted filesystem overhead.`,
  },
  {
    status: isInNixShell ? "PASS" : "WARN",
    label: "Nix dev shell",
    detail: isInNixShell
      ? "The current shell is inside nix develop."
      : "The current shell is not inside nix develop. Run project commands through the flake dev shell.",
  },
  {
    status: isWsl ? (usesSystemd ? "PASS" : "WARN") : "PASS",
    label: "systemd session",
    detail: isWsl
      ? usesSystemd
        ? "systemd is running as PID 1."
        : "systemd is not running as PID 1. GUI helpers and DBus integration can be less reliable without it."
      : wslOnlyDetail,
  },
  {
    status: isWsl ? (hasWslg ? "PASS" : "WARN") : "PASS",
    label: "WSLg display",
    detail: isWsl
      ? hasWslg
        ? "Display and runtime variables were detected for GUI apps."
        : "WAYLAND_DISPLAY or DISPLAY, or XDG_RUNTIME_DIR is missing. Tauri desktop windows usually need WSLg."
      : wslOnlyDetail,
  },
  {
    status: isWsl ? (hasDbusSession ? "PASS" : "WARN") : "PASS",
    label: "DBus session",
    detail: isWsl
      ? hasDbusSession
        ? "DBUS_SESSION_BUS_ADDRESS is available."
        : "DBUS_SESSION_BUS_ADDRESS is missing. Reopening the shell after enabling systemd usually fixes this."
      : wslOnlyDetail,
  },
  {
    status: hasDirenvLoaded ? "PASS" : "WARN",
    label: "direnv integration",
    detail: hasDirenvLoaded
      ? "The repository environment is currently loaded through direnv."
      : "direnv is not active in this shell. Install direnv + nix-direnv and run `direnv allow` in the repository root.",
  },
  {
    status: isWsl ? (hasPlaywrightBrowsers ? "PASS" : "WARN") : "PASS",
    label: "Playwright browsers",
    detail: isWsl
      ? hasPlaywrightBrowsers
        ? `Found Playwright browsers in ${playwrightBrowsersPath}.`
        : "Playwright browsers were not found. Run `pnpm e2e:install` in the dev shell before E2E tests."
      : wslOnlyDetail,
  },
];

console.log("WSL development diagnostics for nesdot");
console.log("");

checks.forEach((check) => {
  console.log(`[${check.status}] ${check.label}: ${check.detail}`);
});

const nextSteps = [
  !isWsl
    ? "If you intended to use the supported WSL workflow, reopen the repository through VS Code Remote - WSL."
    : "",
  isWindowsMount
    ? "Reclone or move the repository under your WSL home directory, for example ~/src/nesdot."
    : "",
  !usesSystemd && isWsl
    ? "Enable systemd in /etc/wsl.conf, then restart WSL from Windows with `wsl --shutdown`."
    : "",
  !hasWslg && isWsl
    ? "Use WSLg if you want `pnpm start` to open the Tauri desktop window. Frontend-only workflows can still use `pnpm dev`."
    : "",
  !hasDirenvLoaded
    ? "Install direnv + nix-direnv and run `direnv allow` in the repository root so the flake loads automatically."
    : "",
  !hasPlaywrightBrowsers && isWsl
    ? "Run `nix develop -c zsh -lc 'pnpm e2e:install'` before Playwright-based checks."
    : "",
].filter((step) => step.length > 0);

if (nextSteps.length > 0) {
  console.log("");
  console.log("Next steps:");
  nextSteps.forEach((step) => {
    console.log(`- ${step}`);
  });
}

const hasFailures = checks.some((check) => check.status === "FAIL");

process.exit(hasFailures ? 1 : 0);
