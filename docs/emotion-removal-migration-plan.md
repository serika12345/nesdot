# Emotion Removal Migration Plan

## Goal

- Remove the Emotion runtime from the application bundle.
- Stop relying on runtime `<style>` injection in Tauri production builds.
- Move ordinary presentation styling to static CSS with explicit module boundaries.
- Preserve current application behavior while tightening CSP compatibility.

## Current Status

- `@emotion/cache` and `@emotion/react` have been removed from direct dependencies.
- `src/main.tsx` renders through a static CSS entry plus the Radix Themes root provider.
- the Tauri nonce bootstrap and `getCspNonce` helper are gone.
- the legacy runtime styling packages have been removed from the application entry path and package manifest.
- remaining work is limited to continuing the static CSS migration and avoiding new runtime style injection paths.

## Why This Is A Separate Migration

At the start of this migration, the repository was CSP-sensitive and still had live Emotion entry points:

- `src/main.tsx` creates an Emotion cache and wraps the app in `CacheProvider`
- multiple feature files still use legacy `styled(...)` wrappers
- the current CSP workaround depends on a nonce to keep Emotion-compatible Tauri production builds working

Because of that, removing Emotion was not a package cleanup. It was an architectural migration.

## Target State

### Runtime

- `@emotion/cache` and `@emotion/react` are removed from dependencies
- `src/main.tsx` no longer creates an Emotion cache or reads a style nonce
- the app renders through static CSS and a non-Emotion root provider
- Tauri production builds do not require Emotion-specific CSP handling

### Styling Model

- global CSS is limited to reset, app shell, and shared canvas helper rules
- component-owned visual styling lives in colocated `*.module.css` files
- shared visual tokens are exposed through CSS custom properties
- dynamic geometry remains in narrow, typed boundaries only where static CSS cannot express the behavior

### Component Library Usage

- use static component libraries that do not inject runtime `<style>` tags
- keep visual tokens in CSS custom properties and local modules
- remove `styled(...)` usage from application-owned components
- do not replace editor-specific geometry with generic abstractions when the geometry is product-specific

## Non-Goals

- redesigning the product
- redesigning the component library again after the runtime CSS removal is complete
- removing all dynamic style values in one patch
- changing CSP to re-allow runtime style injection

## Hard Constraints

### CSP

- keep production Tauri styling compatible with static CSS delivery
- do not introduce new runtime `<style>` injection paths
- keep `pnpm verify:tauri:csp` green throughout the migration

### Scope Discipline

- migrate in small batches
- each batch must leave the repository mechanically green
- do not refactor unrelated state or domain logic while moving styles

## Migration Strategy

### Phase 0: Freeze The Direction

- treat Emotion removal as the repository target
- do not add new `styled(...)` files
- do not add new direct imports from `@emotion/*`
- prefer `*.module.css` for new presentational work

Exit criteria:

- this document and the CSS architecture document are in place
- new work can follow the target direction without re-deciding the approach

### Phase 1: Establish Static CSS Boundaries

- create the CSS architecture rules and keep them repository-visible
- define which styling belongs in:
  - `global.css`
  - `*.module.css`
  - shared CSS token files
  - narrow runtime geometry boundaries
- identify the reviewed exceptions where inline style objects remain temporarily necessary

Exit criteria:

- implementation work can classify any styling change without ambiguity

### Phase 2: Migrate Low-Risk UI First

Start with UI that is already close to stock MUI or static CSS:

1. common dialogs
2. simple form rows and selectors
3. palette and inspector cards
4. menu bar visual shell

Focus:

- replace `styled(...)` wrappers with direct MUI composition plus CSS Modules
- keep behavior and accessibility unchanged
- avoid touching canvas/editor geometry in the same patches

Exit criteria:

- low-risk shared UI no longer depends on Emotion-backed `styled(...)`

### Phase 3: Migrate Editor-Local Styling

Move feature-local visuals from `styles.ts` and `styled(...)` into CSS Modules where safe:

- screen mode shells
- character mode shells
- background mode shells
- shared preview containers

Keep dynamic geometry separate from static skinning:

- static surfaces, spacing, borders, shadows, and typography move to CSS
- dynamic sizes and positions stay in typed runtime boundaries until they can be expressed with CSS custom properties

Exit criteria:

- most feature-owned styling is static CSS
- remaining runtime styling is explicitly documented and justified

### Phase 4: Remove Emotion Entry Points

- remove the final `styled(...)` call sites
- remove `@emotion/cache` and `@emotion/react`
- simplify `src/main.tsx`
- remove the Tauri nonce reader if no longer needed by any styling path

Exit criteria:

- the application no longer depends on Emotion packages
- `main.tsx` contains no Emotion bootstrap code

### Phase 5: Simplify CSP And Verification

- tighten the repository assumptions now that Emotion is gone
- keep `verify:security` and `verify:tauri:csp`
- update docs and tests to reflect the new static CSS architecture

Exit criteria:

- CSP verification no longer describes Emotion as an active styling dependency

## Proposed Work Batches

### Batch A

- write architecture docs and README links
- add guardrail tests for the new docs

### Batch B

- migrate common dialogs and simple form shells to CSS Modules
- keep MUI theme tokens, remove local `styled(...)` usage where touched

### Batch C

- migrate menu bar styling from `MenuBarStyle.ts`
- keep Radix interaction logic unchanged

### Batch D

- migrate character and screen shared primitives
- isolate runtime geometry values behind CSS custom properties or reviewed style boundaries

### Batch E

- remove Emotion bootstrap and dependency packages
- update CSP docs and verification expectations

## Risks To Watch

- accidental behavior drift while moving style ownership
- hidden runtime style injection from MUI paths that are not yet migrated
- mixing static CSS migration with unrelated editor logic changes
- overusing global selectors instead of component-local scope

## Verification Requirements For Each Batch

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck:safety`
- `pnpm verify:security`
- `pnpm test`
- UI-affecting batches: `pnpm test:e2e:console`
- visible/interaction changes: `pnpm test:e2e`
- Tauri/CSP-related batches on macOS: `pnpm verify:tauri:csp`

## First Implementation Target

Start with shared UI that already behaves like ordinary application chrome:

1. `src/presentation/components/common/ui/dialogs/PwaUpdateDialog/index.tsx`
2. `src/presentation/components/common/ui/dialogs/DesktopAutoUpdateDialog/index.tsx`
3. `src/presentation/components/spriteMode/ui/forms/SpriteModeEditorSelectionFields/index.tsx`
4. `src/presentation/components/spriteMode/ui/forms/SpriteModePaletteSlots/index.tsx`

These files provide the lowest-risk path to remove `styled(...)` without mixing in editor geometry work.
