## 1. Execution Environment

- Run all project commands inside the flake dev shell.
- For one-shot commands, use `nix develop -c zsh -lc '<command>'`.
- Do not run project tools such as `node`, `pnpm`, `cargo`, `rustc`, `tauri`, `vite`, or `tsc` directly from the host shell.
- If a command fails outside the dev shell, rerun it inside the dev shell instead of working around the environment.

## 2. Priority Order

When instructions conflict, follow this order:

1. Commands that must pass mechanically (`format`, `lint`, `typecheck`, `test`, `e2e`, `rust:fmt`, `rust:check`, `rust:lint`, `rust:test`)
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
5. Run the required verification commands for the change scope, including `pnpm format:check`, `pnpm verify:security`, and `pnpm verify:rust` when Rust-native files or Rust-specific tooling are touched.
6. Do not finish while required commands are failing.

## 4. Verification Matrix

Run the minimum required checks below.

### 4.1 Any code change

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck:safety`
- `pnpm verify:security`
- `pnpm test`

### 4.2 UI code change

A UI change means edits under React components, hooks used by components, styling, rendering flow, or user interactions.

Run:

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck:safety`
- `pnpm verify:security`
- `pnpm test`
- `pnpm test:e2e:console`

If the change affects visible behavior or interaction flow, also run:

- `pnpm test:e2e`

### 4.3 Config or toolchain change

For changes to lint config, tsconfig, vite config, playwright config, vitest config, package scripts, or nix/dev-shell settings, run all of:

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck:safety`
- `pnpm verify:security`
- `pnpm test`
- `pnpm test:e2e:console`

### 4.4 Rust or Tauri native change

For changes under `src-tauri`, `src-tauri/Cargo.toml`, or Rust-specific scripts and release workflows, run all of:

- `pnpm rust:fmt:check`
- `pnpm rust:check`
- `pnpm rust:lint`
- `pnpm rust:test`

If the change also touches TypeScript, frontend tooling, or UI behavior, run the corresponding checks above in addition to `pnpm verify:rust`.

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
- Exception policy for lint disable:
  - The only permitted local disable is `functional/immutable-data`.
  - It is allowed only when the user explicitly instructs it.
  - It must be narrowly scoped (single line or smallest possible block) and include an inline reason comment.
  - External immutability must still hold: never mutate function inputs, parameters, shared state, or values that escape the function boundary; only locally allocated internal buffers may be mutated.
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

## 8.1 UI Styling Discipline

Use the repository's static styling architecture. The current default stack is `Radix Themes + CSS Modules + src/assets/global.css`, and [`docs/static-css-architecture.md`](./docs/static-css-architecture.md) is the style-layer reference.

- Prefer semantic Radix props, shared static UI components, CSS Modules, and theme-backed globals over per-call-site styling.
- Treat `sx` as restricted, not as the default styling API.
- Do not introduce new `styled(...)` wrappers or other runtime style injection paths.
- Do not use `sx` for layout architecture, spacing system design, color decisions, typography decisions, breakpoint design, or repeated visual patterns.
- Do not copy-paste large `sx` objects between components. If styling repeats, extract a shared component, a CSS Module pattern, or a theme-backed variant.
- Do not introduce raw hex colors, pixel constants, rem constants, ad hoc z-index values, or one-off breakpoint values inside `sx`.
- Prefer repository tokens, CSS custom properties, and component-library theme scales for spacing, palette, typography, shadows, shape, and z-index.
- Do not use fixed styling values when a shared token, semantic prop, or existing pattern can express the same intent.

Note:
The repository still has a mechanical `restrict-sx` lint rule with some historical wording that mentions `styled(...)`. Treat that rule as a guardrail for keeping `sx` tiny, not as permission to add new `styled(...)` code.

### 8.1.1 Layout ownership

Layout should be expressed with component structure and static styling first.

- Prefer an existing shared layout component when one already fits.
- Prefer semantic component props and small compositional wrappers when the library already expresses the structure clearly.
- Prefer colocated CSS Modules for feature-owned layout.
- Use inline `style` only for narrow typed runtime geometry such as canvas size, stage metrics, or CSS custom properties carrying dynamic measurements.
- Use `sx` only for small local integration glue when semantic props or CSS Modules would be heavier than the change.
- Do not build page layout primarily with large inline `style` or `sx` objects.
- Do not default to ad hoc flexbox style objects when the same structure can live in a local module or shared wrapper.

Default layout preference order:

1. existing shared layout component
2. semantic component props
3. colocated CSS Modules
4. narrow typed runtime geometry via CSS variables or `style`
5. small inline `sx` or `style` integration glue
6. raw inline layout styling as a last resort

### 8.1.2 Spacing rules

Spacing must be consistent and token-backed.

- All spacing decisions must use shared tokens, theme scales, or existing component-library spacing conventions.
- Do not hardcode spacing with values such as `12px`, `14px`, `18px`, `1rem`, or similar one-off constants unless there is a documented exception.
- Prefer parent-managed spacing over child-managed margins.
- For vertical or horizontal item spacing, prefer wrapper-managed `gap` or equivalent library spacing props.
- For two-dimensional spacing, prefer grid or flex gaps driven by shared tokens.
- Do not build repeated spacing patterns by assigning custom margins to each child.
- Use local margin or padding only when the adjustment is specific to one call site and not part of a reusable pattern.

### 8.1.3 `sx` restrictions

Allowed `sx` usage is limited to small, local, non-reusable adjustments when all of the following are true:

1. the change is specific to a single call site,
2. the change is visually minor,
3. extracting a wrapper or theme override would add more complexity than value,
4. only theme-backed values are used.

Good examples of allowed `sx` usage:

- one-off flex alignment for a single container,
- a small gap adjustment using theme-backed spacing,
- temporary composition glue between existing shared components,
- a narrow integration fix around third-party component structure when local CSS would be more invasive.

Disallowed examples of `sx` usage:

- building full component skins,
- defining button or card variants inline,
- repeated page-level layout patterns,
- encoding product-specific visual identity at the call site,
- solving a shared styling need without extraction,
- implementing a page shell inline,
- expressing a reusable section layout directly in a screen component.

If `sx` is used, keep it small and shallow:

- prefer a single short object,
- avoid nested selectors unless required by component-library integration,
- avoid composing complex conditional styling logic inline,
- do not pass `sx` through multiple abstraction layers unless that passthrough is already part of the public API.

For agent implementations, assume this default rule:

- if you are about to write more than a small handful of `sx` properties, stop and extract structure instead.

### 8.1.4 Reusable styling extraction

When a component needs recurring styling, use one of these, in order:

1. existing shared UI component,
2. new wrapper component in the shared UI layer,
3. theme component override or variant,
4. colocated CSS Module or small helper component when the styling is still component-owned.

If the same visual or layout pattern appears more than once, do not solve it twice with inline styling. Extract it.

Examples of patterns that should be extracted:

- page sections,
- card containers,
- form rows,
- content headers,
- sidebar layouts,
- repeated action bars,
- common empty-state shells.

### 8.1.5 Theme-first visual rules

Visual decisions must be represented through shared tokens or the component-library theme whenever they are part of the product language.

- Colors must come from shared CSS custom properties or theme palette tokens.
- Typography choices must come from the shared type scale or component-library defaults.
- Border radius must come from shared tokens or theme shape values.
- Elevation must come from shared tokens or theme shadows.
- Layering must come from shared z-index tokens.
- Breakpoints must follow the repository's existing responsive system; do not invent one-off breakpoint values inline.

Do not encode product identity, shared component appearance, or repeated responsive behavior directly at the call site.

### 8.1.6 Page composition rules

Pages should assemble shared structure, not invent styling locally.

- Prefer page-level layout components such as `AppPage`, `PageSection`, `PageHeader`, or equivalent shared abstractions where available.
- Keep screen components focused on composition and data flow.
- Do not mix page structure, component skinning, and domain logic in the same component body.
- If a page repeatedly introduces local layout wrappers, extract a shared layout component instead.

## 9. Testing Policy

- When behavior is observable, add or update tests to describe the intended behavior.
- Prefer unit tests for domain logic.
- Use E2E only for integration points, user interactions, navigation, and browser/runtime validation.
- In E2E tests, do not use hierarchy-dependent selectors (for example XPath, parent/ancestor traversal, or nth-child chains). Use stable, hierarchy-independent selectors such as role+name, label, or explicit test IDs.
- When fixing a bug, first add a test that fails for the bug when practical.
- Do not delete or loosen tests to make unrelated changes pass.

## 10. Change Scope Discipline

- Prefer minimal patches.
- “Minimal diff” is a default heuristic, not the goal itself. As long as existing tests and required verification remain green, prefer the smallest change that fully fixes the underlying problem.
- When addressing bugs or design issues, prioritize root-cause fixes over superficial local patches, provided the change scope remains justified and mechanically safe.
- Do not perform broad refactors unless they are required for correctness or explicitly requested.
- Do not rename public symbols, move files, or reshape modules without a concrete reason.
- Preserve existing comments unless they are made incorrect by the change.

## 11. Completion Criteria

A task is not complete unless all of the following are true:

- The requested change is implemented.
- `pnpm format:check` passes.
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
