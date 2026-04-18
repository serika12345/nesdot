# Plain MUI Migration Prep

## Goal

- Stop maintaining a repository-specific visual design system.
- Converge on stock MUI / Material visuals wherever the UI is not editor-specific.
- Keep custom styling only for product-specific editor geometry, canvas overlays, and preview sizing.

Related implementation docs:

- `docs/emotion-removal-migration-plan.md`
- `docs/static-css-architecture.md`

## Direction

The target state is:

- MUI components are used directly for ordinary UI building blocks.
- The theme is reduced to a thin Material configuration layer.
- The legacy wrapper module is removed, and `styleClassNames.ts` plus most class-based `MuiCssBaseline` skins are reduced aggressively.
- App-specific visuals remain only where MUI has no meaningful stock equivalent.

## Current Status

- The screen-mode, character-mode, and menu-bar local class-token layers have been removed from the central registry and global theme.
- `styleClassNames.ts` now contains only shared canvas helper class names plus `mergeClassNames`.
- `theme.ts` now contains only app-shell globals and shared canvas global styling. Menu, screen, and character editor-specific selectors are gone.
- Local editor-specific styles now live beside their owning TSX files in feature `styles.ts` modules.
- Full verification is green: format, lint, type safety, security, unit tests, console E2E, and full E2E all pass.
- There is no remaining implementation blocker for this migration under the current scope.

## Hard Constraints

### CSP and Style Injection

The current Tauri CSP is already tightened to:

- `style-src 'self'`
- `style-src-elem 'self'`
- `style-src-attr 'none'`

See:

- `docs/csp-style-src-hardening-todo.md`
- `src-tauri/tauri.conf.json`
- `scripts/verify-security.mjs`
- `tests/repo/securityWorkflow.test.ts`

This means default Emotion-style runtime `<style>` injection is not currently compatible with the repository security policy.

Before implementation starts, the migration must pick one of these paths:

1. Keep the current static extraction path for MUI styling and remove only the repo-specific custom skin layer.
2. Intentionally relax CSP and the security verifier to allow runtime style injection.

For the current repository constraints, path `1` is the default recommendation.

### Scope Rule

The migration is not a redesign. The goal is to remove the custom design system layer, not to restyle the product again.

## Current Styling Inventory

### Core Custom Styling Files

| File                                  | Role                                       |      Size |
| ------------------------------------- | ------------------------------------------ | --------: |
| `src/presentation/theme.ts`           | App shell and shared canvas global styling | 164 lines |
| `src/presentation/styleClassNames.ts` | Shared canvas helper class names           |  16 lines |

### Spread of the Custom Layer

| Metric                                                      | Count |
| ----------------------------------------------------------- | ----: |
| Files importing `styleClassNames`                           |     7 |
| `styles.ts` modules under `src/presentation/components`     |    18 |
| `styleClassNames.ts` exported constants                     |     2 |
| Theme class selector lines in `theme.ts`                    |     2 |
| Theme `data-*` selector lines in `theme.ts`                 |     0 |
| `.MuiButtonBase-root.*` custom selector lines in `theme.ts` |     0 |

### Main MUI Usage Today

Current import counts show the repo already leans heavily on MUI primitives:

| MUI import      | Count |
| --------------- | ----: |
| `Stack`         |    26 |
| `Box`           |    16 |
| `Button`        |    22 |
| `Dialog`        |     7 |
| `DialogActions` |     7 |
| `DialogContent` |     7 |
| `DialogTitle`   |     7 |
| `Typography`    |     6 |
| `OutlinedInput` |     6 |
| `Grid`          |     6 |
| `ButtonBase`    |     5 |

This makes “plain MUI” a reduction of the custom layer, not a framework migration.

## What the Repo Is Currently Doing in CSS-Like Code

### 1. Global Theme Layer

`src/presentation/theme.ts` is no longer the main repository-specific skin layer.

It currently owns only:

- app-wide CSS variables for colors, surfaces, and effects
- background gradients and texture
- shared canvas helpers

Menu-bar, screen-mode, and character-mode editor-specific selector blocks have already been removed.

### 2. Wrapper Primitive Layer

The legacy wrapper module is already gone.

It used to wrap MUI primitives and plain elements to attach:

- custom class names
- repository-specific `data-*` states
- default layout props

That adapter layer is no longer part of the active architecture.

### 3. Local Geometry and Preview Styles

The `styles.ts` modules under feature folders mostly hold:

- overlay positioning
- preview dimensions
- chevron rotation
- color swatch appearance
- drag preview placement

These are not a design system by themselves. Most of them should remain if they encode product-specific geometry.

## Classification for Migration

### Replace With Plain MUI First

These areas already use mostly stock MUI components and should be migrated first.

| Area                  | Representative files                                                                                                                                                                      | Notes                                                      |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Common dialogs        | `src/presentation/components/common/ui/dialogs/PwaUpdateDialog/index.tsx`, `src/presentation/components/common/ui/dialogs/DesktopAutoUpdateDialog/index.tsx`                              | Already close to stock MUI                                 |
| Simple forms          | `src/presentation/components/spriteMode/ui/forms/SpriteModeEditorSelectionFields/index.tsx`, `src/presentation/components/characterMode/ui/set/CharacterModeSetSelectionFields/index.tsx` | Can move to direct `TextField` / `Select` / `Button` usage |
| Basic inspector cards | `src/presentation/components/spriteMode/ui/forms/SpriteModePaletteSlots/index.tsx`                                                                                                        | Mostly stock card + buttons                                |

### Already Migrated Off Central Tokens

These areas no longer depend on the old central class-based skin and now own their local styling beside the component.

| Area                      | Representative files                                                                                      | Notes                                                  |
| ------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Common menu bar           | `src/presentation/components/common/ui/menu/MenuBar.tsx`                                                  | Radix/MUI menu styling is localized in adjacent styles |
| Screen mode primitives    | `src/presentation/components/screenMode/ui/primitives/ScreenModePrimitives/index.tsx`                     | Localized viewport styling and removed central tokens  |
| Screen mode workspace     | `src/presentation/components/screenMode/ui/panels/ScreenModeGestureWorkspace/index.tsx`                   | Library, drag preview, and stage visuals localized     |
| Character mode primitives | `src/presentation/components/characterMode/ui/primitives/CharacterModePrimitives/index.tsx`               | Localized stage, overlay, and preview styling          |
| Character mode sidebar    | `src/presentation/components/characterMode/ui/sidebar/CharacterModeSidebarLibrary/index.tsx`              | Library card/button styling localized                  |
| Character decomposition   | `src/presentation/components/characterMode/ui/decomposition/CharacterModeDecompositionToolCard/index.tsx` | Palette slot styling localized                         |

### Keep Custom

These should stay custom even after the design system layer is removed.

| Area                            | Representative files                                                                                                                                                                   | Reason                                |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Canvas geometry                 | `src/presentation/components/screenMode/ui/preview/ScreenModeCharacterPreview/styles.ts`, `src/presentation/components/characterMode/ui/preview/CharacterModeTilePreview/styles.ts`    | Data-driven sizing and placement      |
| Overlay placement               | `src/presentation/components/screenMode/ui/overlays/ScreenModeBackgroundPlacementMockOverlay/styles.ts`, `src/presentation/components/bgMode/ui/panels/BgModeWorkspacePanel/styles.ts` | Editor-specific absolute positioning  |
| Drag previews and stage visuals | feature `styles.ts` modules for screen / character / sprite editors                                                                                                                    | Product-specific interaction surfaces |

## Current Test Coverage

Presentation tests no longer import `styleClassNames` to assert screen/character local class tokens.

Relevant coverage now focuses on:

- local style output for feature-owned geometry and interaction state
- absence of removed centralized class-token plumbing
- editor-specific overlay behavior that intentionally remains custom

Representative files:

- `src/presentation/CharacterModePrimitives.styles.test.tsx`
- `src/presentation/ScreenModeBackgroundPlacementMockOverlay.styles.test.tsx`
- `src/presentation/components/screenMode/ui/primitives/ScreenModePrimitives.test.ts`
- `e2e/console.spec.ts`

## Implementation Order

### Phase 0: Foundation Decision

Make the style engine decision explicit.

- Preferred: keep static extraction-compatible MUI path for now
- Avoid: switching to runtime Emotion before intentionally changing CSP policy

### Phase 1: Freeze the Custom Layer

Do not add new imports from:

- `src/presentation/styleClassNames.ts`

New work should prefer direct MUI components unless the UI is editor-specific, and should not reintroduce wrapper abstractions.

### Phase 2: Convert Low-Risk Screens

Start with areas that are already near stock MUI:

1. common dialogs
2. simple form rows and selectors
3. palette / inspector cards that mostly need normal Material surfaces

### Phase 3: Collapse Wrapper Primitives

Once direct MUI usage is established in enough files:

1. delete corresponding class tokens from `styleClassNames.ts`
2. remove matching selectors from `theme.ts`
3. delete or rewrite tests that only assert wrapper/class plumbing

This phase is complete. The central registry and global theme now keep only shared-canvas concerns.

### Phase 4: Thin the Theme

Reduce `src/presentation/theme.ts` to:

- palette
- typography
- shape
- optional component defaults that stay inside standard MUI theming

Delete repo-specific class skin rules from `MuiCssBaseline.styleOverrides` as each area is migrated.

This phase is complete under the current scope. The remaining global layer is intentional: app-shell globals and shared canvas helpers still live centrally.

## Ready-to-Implement Checklist

- [x] Style engine path is fixed and documented for the migration
- [x] No new feature code adds `styleClassNames` dependencies except for shared-canvas concerns and `mergeClassNames`
- [x] First-wave target files are selected and migrated
- [x] Custom-layer tests were rewritten away from removed screen/character local class tokens
- [x] Verification plan was executed and is green

## Recommended First Patch Set

If implementation starts immediately, the smallest safe first batch is:

1. `src/presentation/components/common/ui/dialogs/PwaUpdateDialog/index.tsx`
2. `src/presentation/components/common/ui/dialogs/DesktopAutoUpdateDialog/index.tsx`
3. `src/presentation/components/spriteMode/ui/forms/SpriteModeEditorSelectionFields/index.tsx`
4. `src/presentation/components/spriteMode/ui/forms/SpriteModePaletteSlots/index.tsx`

These files are already mostly stock MUI and do not require solving the canvas-specific styling layer first.

## Out of Scope for the First Implementation Wave

- Rebuilding screen / character / BG editor visuals
- Removing all local `style={...}` geometry code
- Replacing editor-specific overlays with generic MUI surfaces
- Changing CSP policy unless explicitly requested
