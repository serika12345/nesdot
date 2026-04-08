## 1. Execution Environment

- Run all project commands inside the flake dev shell.
- For one-shot commands, use `nix develop -c zsh -lc '<command>'`.
- Do not run project tools such as `node`, `pnpm`, `cargo`, `rustc`, `tauri`, `vite`, or `tsc` directly from the host shell.
- If a command fails outside the dev shell, rerun it inside the dev shell instead of working around the environment.

## 2. Priority Order

When instructions conflict, follow this order:

1. Commands that must pass mechanically (`format`, `lint`, `typecheck`, `test`, `e2e`)
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
5. Run the required verification commands for the change scope, including `pnpm format:check`.
6. Do not finish while required commands are failing.

## 4. Verification Matrix

Run the minimum required checks below.

### 4.1 Any code change

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck:safety`
- `pnpm test`

### 4.2 UI code change

A UI change means edits under React components, hooks used by components, styling, rendering flow, or user interactions.

Run:

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck:safety`
- `pnpm test`
- `pnpm test:e2e:console`

If the change affects visible behavior or interaction flow, also run:

- `pnpm test:e2e`

### 4.3 Config or toolchain change

For changes to lint config, tsconfig, vite config, playwright config, vitest config, package scripts, or nix/dev-shell settings, run all of:

- `pnpm format:check`
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

## 8.1 MUI Styling Discipline

Use MUI, but keep styling decisions centralized and mechanically constrained.

- Prefer theme configuration, `styled(...)`, shared wrapper components, and MUI layout primitives over per-call-site styling.
- Treat `sx` as restricted, not as the default styling API.
- Do not use `sx` for layout architecture, spacing system design, color decisions, typography decisions, breakpoint design, or repeated visual patterns.
- Do not copy-paste large `sx` objects between components. If styling repeats, extract a shared component or theme override.
- Do not introduce raw hex colors, pixel constants, rem constants, ad hoc z-index values, or one-off breakpoint values inside `sx`.
- Prefer tokens from the MUI theme for spacing, palette, typography, shadows, shape, and z-index.
- Do not use fixed styling values when a theme token or MUI prop can express the same intent.
- Do not use raw CSS for layout when the same structure can be expressed with MUI layout components.

### 8.1.1 Layout ownership

Layout must be expressed with MUI primitives first.

- Prefer `Stack` for one-dimensional layout.
- Prefer `Grid` for two-dimensional layout.
- Prefer `Container` for page-width control and horizontal centering.
- Use `Box` as a generic wrapper only when a more specific MUI layout primitive is not appropriate.
- Do not build page layout primarily with `Box` plus large inline `sx` objects.
- Do not use ad hoc flexbox CSS as the default layout mechanism if `Stack` or `Grid` can express the structure clearly.

Default layout preference order:

1. existing shared layout component
2. `Stack`
3. `Grid`
4. `Container`
5. `Box`
6. raw CSS layout

### 8.1.2 Spacing rules

Spacing must be consistent and theme-backed.

- All spacing decisions must use the MUI theme spacing scale.
- Do not hardcode spacing with values such as `12px`, `14px`, `18px`, `1rem`, or similar one-off constants unless there is a documented exception.
- Prefer parent-managed spacing over child-managed margins.
- For vertical or horizontal item spacing, prefer `Stack spacing`.
- For two-dimensional spacing, prefer `Grid` spacing or theme-backed `gap`.
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
- a small gap adjustment using theme spacing,
- temporary composition glue between existing shared components.

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
- avoid nested selectors unless required by MUI integration,
- avoid composing complex conditional styling logic inline,
- do not pass `sx` through multiple abstraction layers unless that passthrough is already part of the public API.

For agent implementations, assume this default rule:

- if you are about to write more than a small handful of `sx` properties, stop and extract structure instead.

### 8.1.4 Reusable styling extraction

When a component needs recurring styling, use one of these, in order:

1. existing shared UI component,
2. new wrapper component in the shared UI layer,
3. theme component override or variant,
4. `styled(...)` colocated with the component when the styling is still component-owned.

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

Visual decisions must be represented through the theme whenever they are part of the product language.

- Colors must come from `theme.palette`.
- Typography choices must come from `theme.typography`.
- Border radius must come from `theme.shape`.
- Elevation must come from `theme.shadows`.
- Layering must come from `theme.zIndex`.
- Breakpoints must come from the MUI breakpoint system.

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
