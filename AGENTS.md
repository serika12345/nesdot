# Repository Instructions

## Development Environment

- Run all project commands inside the flake dev shell.
- For one-shot commands, prefer `nix develop -c zsh -lc '<command>'`.
- For longer workflows, start `nix develop` first and keep all subsequent commands inside that shell.
- Do not run project tools such as `node`, `pnpm`, `cargo`, `rustc`, `tauri`, `vite`, or `tsc` directly from the host shell.
- If a command fails outside the dev shell, rerun it through `nix develop` instead of working around the missing environment.

## Coding Guidelines

- **Functional Programming**: Adopt functional programming paradigms throughout the codebase.
- **I/O Separation**: Isolate I/O operations from pure functions; keep business logic pure.
- **Function Size**: Pure functions must not exceed 100 lines of code.
- **Type Safety**: Do not use `any` type; always use explicit types.
- **Null Safety**: Avoid using `null`; prefer `undefined`, `Option`-like patterns, or early returns.
- **useEffect Usage**: Minimize the use of `useEffect` hooks; prefer other patterns when possible.
- **Browser-Only Execution**: Write no native code; ensure the application runs completely in the browser.
