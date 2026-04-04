# Repository Instructions

## 1. Execution Environment

- Run all project commands inside the flake dev shell.
- For one-shot commands, use `nix develop -c zsh -lc '<command>'`.
- Do not run project tools such as `node`, `pnpm`, `cargo`, `rustc`, `tauri`, `vite`, or `tsc` directly from the host shell.
- If a command fails outside the dev shell, rerun it inside the dev shell instead of working around the environment.

## 2. Priority Order

When instructions conflict, follow this order:

1. Commands that must pass mechanically (`lint`, `typecheck`, `test`, `e2e`)
2. Existing repository architecture and public types
3. Design principles in this file
4. Local convenience

Do not violate a mechanical gate to satisfy a style preference.

## 3. Required Workflow

For every task, follow this sequence:

1. Read the relevant existing code before editing.
2. Identify the smallest safe change.
3. Add or update tests before changing implementation when the behavior is observable and testable.
4. Implement the code.
5. Run the required verification commands for the change scope.
6. Do not finish while required commands are failing.

## 4. Verification Matrix

Run the minimum required checks below.

### 4.1 Any code change
- `pnpm lint`
- `pnpm typecheck:safety`
- `pnpm test`

### 4.2 UI code change
A UI change means edits under React components, hooks used by components, styling, rendering flow, or user interactions.

Run:
- `pnpm lint`
- `pnpm typecheck:safety`
- `pnpm test`
- `pnpm test:e2e:console`

If the change affects visible behavior or interaction flow, also run:
- `pnpm test:e2e`

### 4.3 Config or toolchain change
For changes to lint config, tsconfig, vite config, playwright config, vitest config, package scripts, or nix/dev-shell settings, run all of:
- `pnpm lint`
- `pnpm typecheck:safety`
- `pnpm test`
- `pnpm test:e2e:console`

## 5. Non-Negotiable Coding Constraints

These constraints are expected to be enforced by repository configuration and must not be bypassed:

- Do not use `any`.
- Do not use TypeScript `as` assertions.
- Do not use non-null assertions (`!`).
- Do not use `let` or `var`; use `const`.
- Do not reassign function parameters or mutate their properties.
- Do not use mutating array methods such as `push`, `pop`, `shift`, `unshift`, `splice`, `sort`, or `reverse`.
- Do not rely on truthy/falsy coercion. Use explicit boolean expressions.
- Do not introduce lint disables unless explicitly requested and justified in code review.
- Do not ignore failing tests or type errors.
- Do not weaken tsconfig, ESLint rules, or tests just to make a change pass.

## 6. External Data Boundaries

Any data that crosses into the application from outside trusted in-memory domain values must be validated at runtime before use.

Examples:
- `JSON.parse`
- file imports
- local storage / IndexedDB reads
- network responses
- Tauri plugin results
- browser APIs returning untyped data

Rules:
- Use `zod` for runtime validation.
- Parse external data into validated domain values before passing it to state setters or core logic.
- Keep unsafe operations localized at the boundary.
- Prefer `unknown` at boundaries and narrow explicitly.

## 7. Type and State Design

- Prefer explicit domain types over broad structural objects.
- Prefer small pure functions for domain transformations.
- Isolate I/O from domain logic where practical.
- Model absence explicitly. Prefer `Option`-like patterns or clear early returns over ad hoc nullable flows.
- Use `fp-ts` where it improves boundary handling, composability, or error flow. Do not wrap every value in monads without reason.
- Prefer immutable updates and derived values over stepwise mutation.

## 8. React Guidance

- Follow the Rules of Hooks.
- Keep dependency arrays explicit and correct.
- Do not introduce `useEffect` when derivation, event handlers, memoization, or state restructuring can solve the problem more directly.
- Put domain logic outside components unless the logic is inherently view-local.
- Keep components focused on rendering and orchestration.

## 8.1 MUI Styling Discipline

Use MUI, but keep styling decisions centralized and mechanically constrained.

- Prefer theme configuration, `styled(...)`, and shared wrapper components over per-call-site styling.
- Treat `sx` as restricted, not as the default styling API.
- Do not use `sx` for layout architecture, spacing system design, color decisions, typography decisions, breakpoint design, or repeated visual patterns.
- Do not copy-paste large `sx` objects between components. If styling repeats, extract a shared component or theme override.
- Do not introduce raw hex colors, pixel constants, ad hoc z-index values, or one-off breakpoint values inside `sx`.
- Prefer tokens from the MUI theme for spacing, palette, typography, shadows, shape, and z-index.

Allowed `sx` usage is limited to small, local, non-reusable adjustments when all of the following are true:

1. the change is specific to a single call site,
2. the change is visually minor,
3. extracting a wrapper or theme override would add more complexity than value,
4. only theme-backed values are used.

Good examples of allowed `sx` usage:
- one-off flex alignment for a single container,
- a small gap adjustment using theme spacing,
- temporary composition glue between existing shared components.

Disallowed examples of `sx` usage:
- building full component skins,
- defining button or card variants inline,
- repeated page-level layout patterns,
- encoding product-specific visual identity at the call site,
- solving a shared styling need without extraction.

When a component needs recurring styling, use one of these, in order:

1. existing shared UI component,
2. new wrapper component in the shared UI layer,
3. theme component override or variant,
4. `styled(...)` colocated with the component when the styling is still component-owned.

If `sx` is used, keep it small and shallow:

- prefer a single short object,
- avoid nested selectors unless required by MUI integration,
- avoid composing complex conditional styling logic inline,
- do not pass `sx` through multiple abstraction layers unless that passthrough is already part of the public API.

For agent implementations, assume this default rule:

- if you are about to write more than a small handful of `sx` properties, stop and extract structure instead.

## 9. Testing Policy

- When behavior is observable, add or update tests to describe the intended behavior.
- Prefer unit tests for domain logic.
- Use E2E only for integration points, user interactions, navigation, and browser/runtime validation.
- When fixing a bug, first add a test that fails for the bug when practical.
- Do not delete or loosen tests to make unrelated changes pass.

## 10. Change Scope Discipline

- Prefer minimal patches.
- Do not perform broad refactors unless they are required for correctness or explicitly requested.
- Do not rename public symbols, move files, or reshape modules without a concrete reason.
- Preserve existing comments unless they are made incorrect by the change.

## 11. Completion Criteria

A task is not complete unless all of the following are true:

- The requested change is implemented.
- Required tests for the change scope pass.
- Lint passes.
- Type safety checks pass.
- New external-data paths are validated.
- No obvious unrelated regressions were introduced by the patch.

## 12. Output Expectations for Coding Agents

In the final report for a coding task, include:

- what changed
- which commands were run
- whether they passed
- any remaining risks or follow-up items

Do not claim completion without reporting the verification results.
