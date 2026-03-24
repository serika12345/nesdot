# Repository Instructions

- Run all project commands inside the flake dev shell.
- For one-shot commands, prefer `nix develop -c zsh -lc '<command>'`.
- For longer workflows, start `nix develop` first and keep all subsequent commands inside that shell.
- Do not run project tools such as `node`, `pnpm`, `cargo`, `rustc`, `tauri`, `vite`, or `tsc` directly from the host shell.
- If a command fails outside the dev shell, rerun it through `nix develop` instead of working around the missing environment.
