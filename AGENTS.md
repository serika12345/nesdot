# Repository Instructions

## Development Environment

- Run all project commands inside the flake dev shell.
- For one-shot commands, prefer `nix develop -c zsh -lc '<command>'`.
- For longer workflows, start `nix develop` first and keep all subsequent commands inside that shell.
- Do not run project tools such as `node`, `pnpm`, `cargo`, `rustc`, `tauri`, `vite`, or `tsc` directly from the host shell.
- If a command fails outside the dev shell, rerun it through `nix develop` instead of working around the missing environment.
- If a tool you want to use is not available in the current shell, you may invoke it via a temporary nix shell command (for example: `nix develop -c zsh -lc '<command>'`).

## Coding Guidelines

- **Functional Programming**: Adopt functional programming paradigms throughout the codebase.
- **I/O Separation**: Isolate I/O operations from pure functions; keep business logic pure.
- **Function Size**: Pure functions must not exceed 100 lines of code.
- **Type Safety**: Do not use `any` type; always use explicit types.
- **No `as` Assertions**: Do not use TypeScript `as` type assertions. Prefer explicit type-safe data flow, type guards, and narrowed function interfaces.
- **No Non-Null Assertions**: Do not use the `!` non-null assertion operator. Prefer explicit `Option` handling, guards, or early returns.
- **Runtime Validation for External Data**: Validate all externally sourced data (for example `JSON.parse` results, file imports, storage reads, and network responses) with runtime checks before passing values into state setters or core domain functions.
- **Runtime Validation Library**: Use `zod` for runtime validation schemas and parsing of external data.
- **Strict Null Checks**: Keep `strictNullChecks` enabled and fix type issues through explicit narrowing rather than assertions.
- **Type Safety Check Cycle**: In each implementation/verification cycle, run `pnpm typecheck:safety` and resolve reported issues before completion.
- **Null Safety**: Avoid using `null` and `undefined`; prefer `Option`-like patterns or early returns.
- **useEffect Usage**: Minimize the use of `useEffect` hooks; prefer other patterns when possible.
- **Browser-Only Execution**: Write no native code; ensure the application runs completely in the browser.
- **Web API Compatibility**: Use only widely available or newly available Web APIs. Avoid APIs with inconsistent browser support.
- **Test-Driven Development**: Implement all features using test-driven development (TDD). Write tests first, then implement the code to pass those tests.
- **Test Implementation First**: When tests themselves need to be modified, implement the test changes completely before making any source code changes.
- **UI Change Validation**: After modifying UI-related code, run both `vitest` and E2E tests. Verify that no errors are emitted in the browser console during E2E execution.
- **Immutability**: Always use `const` for variable declarations; never use `let` or `var`. Initialize arrays and collections completely at creation; never use `push()` or mutating methods afterward.
- **Immutable Operations**: Write all code using immutable operations. Avoid nested ternary operators to prevent reassignment; extract complex logic into separate functions. IIFE (Immediately Invoked Function Expressions) are acceptable for short logic blocks (a few lines).
- **No Exceptions**: Do not use exceptions for control flow. Handle errors using functional error handling patterns.
- **Functional Error Handling with fp-ts**: Use `fp-ts` library for error handling and functional programming utilities. Use monads (Option, Either, Task, etc.) only when exception handling or lazy evaluation is appropriate; not all values need to be wrapped in monads.
- **No typeof/instanceof Operators**: Do not use runtime `typeof` or `instanceof` operators. Prefer explicit type-safe data flow and predicate functions. Type-level `typeof` (TypeScript type query) is allowed.
- **No Truthy/Falsy Semantics**: Do not rely on truthy/falsy coercion. Use explicit boolean expressions and strict equality/inequality checks (`===`, `!==`).
- **No Bare Value Conditions**: Prohibit patterns such as `if (value)` and `if (!value)` mechanically. Always compare explicitly (for example, `value === true`, `value !== ""`, `value !== 0`, `value !== null`).
- **No Implicit Coercion**: Do not use implicit type coercion operators or shorthand coercion patterns. Prefer explicit conversions and comparisons.
- **React Hooks Rules**: Always follow the Rules of Hooks, and keep hook dependency arrays explicit and consistent with referenced values.
- **No Unsafe Type Operations**: Avoid unsafe assignment/member access/calls/returns/arguments across untyped boundaries. Narrow unknown data before use and keep unsafe operations lint-clean.
- **ESLint Compliance**: All code must pass ESLint checks without errors. Run `pnpm lint` in every implementation/verification cycle and resolve all reported issues before completion.
