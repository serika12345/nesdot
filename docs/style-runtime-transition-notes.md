# Style Runtime Transition Notes

## Goal

- Keep the application free of runtime `<style>` injection in the shipping path.
- Use static CSS and explicit module boundaries for ordinary presentation styling.
- Preserve current behavior while keeping CSP compatibility strict.

## Current Status

- The removed runtime style packages are no longer direct dependencies.
- `src/main.tsx` renders through a static CSS entry plus the Radix Themes root provider.
- The Tauri nonce bootstrap and `getCspNonce` helper are gone.
- The application entry path no longer depends on a runtime style engine.
- Remaining work is limited to guardrail maintenance, documentation cleanup, and regression prevention.

## Why This Needed Its Own Track

At the start of the transition, the repository was CSP-sensitive and still had live runtime styling entry points:

- `src/main.tsx` created a cache/provider bootstrap for dynamic styles
- multiple feature files still used application-owned `styled(...)` wrappers
- the CSP workaround depended on a nonce to keep desktop production builds working

Because of that, moving away from runtime styling was not a package cleanup. It was an architectural transition.

## Target State

### Runtime

- keep the application free of runtime `<style>` injection
- keep `src/main.tsx` on static CSS imports and the root provider only
- keep desktop production builds compatible with static CSS delivery

### Styling Model

- global CSS is limited to reset, app shell, and shared canvas helper rules
- component-owned visual styling lives in colocated `*.module.css` files
- shared visual tokens are exposed through CSS custom properties
- dynamic geometry remains in narrow, typed boundaries only where static CSS cannot express the behavior

### Component Usage

- use shared UI components that do not require a runtime style engine
- keep visual tokens in CSS custom properties and local modules
- keep application-owned `styled(...)` wrappers out of the codebase
- avoid replacing editor-specific geometry with generic abstractions when the geometry is product-specific

## Non-Goals

- redesigning the product
- swapping the shared UI library again
- removing every dynamic style value in one patch
- weakening CSP to re-allow runtime style injection

## Hard Constraints

### CSP

- keep production Tauri styling compatible with static CSS delivery
- do not introduce new runtime `<style>` injection paths
- keep `pnpm verify:tauri:csp` green

### Scope Discipline

- make small, mechanical changes
- leave the repository green after every batch
- avoid mixing unrelated state or domain refactors into styling work

## Recorded Rollout Order

### Stage 0: Freeze the Direction

- make the static styling direction explicit
- stop adding new application-owned `styled(...)` wrappers
- stop adding new runtime-style entry points
- prefer `*.module.css` for new presentational work

### Stage 1: Establish Static CSS Boundaries

- define the CSS architecture rules
- classify what belongs in `global.css`, CSS Modules, shared CSS tokens, and typed runtime geometry
- keep reviewed exceptions narrow and documented

### Stage 2: Migrate Low-Risk UI First

Start with UI that is already close to stock shared controls:

1. common dialogs
2. simple form rows and selectors
3. palette and inspector cards
4. menu bar visual shell

Focus:

- replace application-owned `styled(...)` wrappers with direct shared components or CSS Modules
- keep behavior and accessibility unchanged
- avoid touching canvas or editor geometry in the same patches

### Stage 3: Migrate Editor-Local Styling

Move feature-local visuals from `styles.ts` and wrapper-based styling into CSS Modules where safe:

- screen mode shells
- character mode shells
- background mode shells
- shared preview containers

Keep dynamic geometry separate from static skinning:

- static surfaces, spacing, borders, shadows, and typography move to CSS
- dynamic sizes and positions stay in typed runtime boundaries until CSS custom properties can express them cleanly

### Stage 4: Remove Runtime Style Entry Points

- remove the final application-owned `styled(...)` call sites
- simplify `src/main.tsx`
- remove nonce-based startup helpers that only existed for styling

### Stage 5: Tighten Verification

- keep `verify:security` and `verify:tauri:csp` aligned with the static path
- update docs and tests to reflect the current architecture
- keep CSP verification free of runtime-style assumptions

## Proposed Work Batches

### Batch A

- write architecture docs and repository-visible guardrails
- add repo tests for those docs

### Batch B

- migrate common dialogs and simple form shells to CSS Modules
- keep shared tokens and semantic component props, remove local wrapper usage where touched

### Batch C

- migrate menu bar styling from its old wrapper layer
- keep interaction logic unchanged

### Batch D

- migrate character and screen shared primitives
- isolate runtime geometry values behind CSS custom properties or reviewed style boundaries

### Batch E

- remove final runtime-style entry points
- update CSP docs and verification expectations

## Risks To Watch

- accidental behavior drift while moving style ownership
- hidden runtime `<style>` injection from newly introduced UI paths
- mixing static CSS cleanup with unrelated editor logic changes
- overusing global selectors instead of component-local scope

## Verification Requirements For Each Batch

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck:safety`
- `pnpm verify:security`
- `pnpm test`
- UI-affecting batches: `pnpm test:e2e:console`
- visible or interaction changes: `pnpm test:e2e`
- Tauri or CSP-related batches on macOS: `pnpm verify:tauri:csp`

## Historical First Targets

The first batch targeted shared UI that already behaved like ordinary application chrome:

1. `src/presentation/components/common/ui/dialogs/PwaUpdateDialog.tsx`
2. `src/presentation/components/common/ui/dialogs/DesktopAutoUpdateDialog.tsx`
3. `src/presentation/components/spriteMode/ui/forms/SpriteModeEditorSelectionFields.tsx`
4. `src/presentation/components/spriteMode/ui/forms/SpriteModePaletteSlots.tsx`

These files offered the lowest-risk path to remove application-owned wrapper styling without mixing in editor geometry work.
