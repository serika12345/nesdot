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
- **Null Safety**: Avoid using `null` and `undefined`; prefer `Option`-like patterns or early returns.
- **useEffect Usage**: Minimize the use of `useEffect` hooks; prefer other patterns when possible.
- **Browser-Only Execution**: Write no native code; ensure the application runs completely in the browser.
- **Web API Compatibility**: Use only widely available or newly available Web APIs. Avoid APIs with inconsistent browser support.
- **Test-Driven Development**: Implement all features using test-driven development (TDD). Write tests first, then implement the code to pass those tests.
- **Test Implementation First**: When tests themselves need to be modified, implement the test changes completely before making any source code changes.
- **Immutability**: Always use `const` for variable declarations; never use `let` or `var`. Initialize arrays and collections completely at creation; never use `push()` or mutating methods afterward.
- **Immutable Operations**: Write all code using immutable operations. Avoid nested ternary operators to prevent reassignment; extract complex logic into separate functions. IIFE (Immediately Invoked Function Expressions) are acceptable for short logic blocks (a few lines).
- **No Exceptions**: Do not use exceptions for control flow. Handle errors using functional error handling patterns.
- **Functional Error Handling with fp-ts**: Use `fp-ts` library for error handling and functional programming utilities. Use monads (Option, Either, Task, etc.) only when exception handling or lazy evaluation is appropriate; not all values need to be wrapped in monads.
