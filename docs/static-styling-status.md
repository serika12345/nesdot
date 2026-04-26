# Static Styling Status

## Goal

- Keep ordinary UI on static shared components and CSS Modules.
- Keep runtime styling limited to typed geometry, canvas overlays, and preview sizing.
- Preserve current application behavior while keeping CSP and repository guardrails green.

Related implementation docs:

- `docs/style-runtime-transition-notes.md`
- `docs/static-css-architecture.md`
- `docs/csp-style-src-hardening-todo.md`

## Current Direction

The repository direction is:

- static shared components are used directly for ordinary UI building blocks.
- the global token layer lives in `src/assets/global.css`.
- `styleClassNames.ts` is reduced to shared canvas helpers plus `mergeClassNames`.
- app-specific visuals remain local when shared static controls have no meaningful stock equivalent.

## Current Status

- The screen-mode, character-mode, and menu-bar local class-token layers have been removed from the central registry and global theme.
- `styleClassNames.ts` now contains only shared canvas helper class names plus `mergeClassNames`.
- `src/assets/global.css` owns app-shell globals and shared visual tokens.
- Local editor-specific styles live beside their owning TSX files in feature CSS Modules and narrow geometry helpers.
- Full verification is green: format, lint, type safety, security, unit tests, console E2E, and full E2E all pass.
- There is no remaining implementation blocker for the current static styling path.

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

This means default runtime `<style>` injection is not compatible with the repository security policy.

The repository chose the static path: keep styling explicit and file-backed rather than relax CSP.

### Scope Rule

The current work is not a redesign. The goal is to keep the UI on static, maintainable style ownership rather than rebuild the product language again.

## Current Styling Inventory

### Core Styling Files

| File                                  | Role                                       |     Size |
| ------------------------------------- | ------------------------------------------ | -------: |
| `src/assets/global.css`               | App shell globals and shared visual tokens |      n/a |
| `src/presentation/styleClassNames.ts` | Shared canvas helper class names           | 16 lines |

### Spread of the Styling Layer

| Metric                                                  | Count |
| ------------------------------------------------------- | ----: |
| Files importing `styleClassNames`                       |     7 |
| `styles.ts` modules under `src/presentation/components` |    18 |
| `styleClassNames.ts` exported constants                 |     2 |
| Legacy runtime theme selector lines                     |     0 |
| Runtime style-engine entry points                       |     0 |
| Package-level runtime style dependencies                |     0 |

### Current Shared UI Direction

The repository now leans on static shared components plus CSS Modules:

- Radix Themes primitives such as `Button`, `Dialog`, `Select`, and `TextField`
- `SurfaceCard`
- local icon components
- colocated `*.module.css` files

## What the Repo Is Currently Doing in CSS-Like Code

### 1. Global Token Layer

`src/assets/global.css` owns only:

- app-wide CSS variables for colors, surfaces, and effects
- background gradients and texture
- shared global resets

### 2. Historical Wrapper Layer

The old wrapper module is already gone.

It used to wrap shared library primitives and plain elements to attach:

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

These are not a design system by themselves. They remain appropriate when they encode product-specific geometry.

## Classification of Current Styling Work

### Shared Static UI

These areas are expected to stay on static shared components and local CSS Modules.

| Area                  | Representative files                                                                                                                                                          | Notes                                   |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| Common dialogs        | `src/presentation/components/common/ui/dialogs/PwaUpdateDialog.tsx`, `src/presentation/components/common/ui/dialogs/DesktopAutoUpdateDialog.tsx`                              | Uses Radix `Dialog` + local CSS Modules |
| Simple forms          | `src/presentation/components/spriteMode/ui/forms/SpriteModeEditorSelectionFields.tsx`, `src/presentation/components/characterMode/ui/set/CharacterModeSetSelectionFields.tsx` | Uses Radix form controls + local CSS    |
| Basic inspector cards | `src/presentation/components/spriteMode/ui/forms/SpriteModePaletteSlots.tsx`                                                                                                  | Uses `SurfaceCard` + CSS Modules        |

### Feature-Local Styling

These areas now own their styling beside the component.

| Area                      | Representative files                                                                                      | Notes                                                  |
| ------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Common menu bar           | `src/presentation/components/common/ui/menu/MenuBar.tsx`                                                  | Static menu styling is localized in adjacent files     |
| Screen mode primitives    | `src/presentation/components/screenMode/ui/primitives/ScreenModePrimitives/index.tsx`                     | Viewport styling and stage visuals are localized       |
| Screen mode workspace     | `src/presentation/components/screenMode/ui/panels/ScreenModeGestureWorkspace/index.tsx`                   | Library, drag preview, and stage visuals are localized |
| Character mode primitives | `src/presentation/components/characterMode/ui/primitives/CharacterModePrimitives/index.tsx`               | Stage, overlay, and preview styling is localized       |
| Character mode sidebar    | `src/presentation/components/characterMode/ui/sidebar/CharacterModeSidebarLibrary/index.tsx`              | Library card and button styling is localized           |
| Character decomposition   | `src/presentation/components/characterMode/ui/decomposition/CharacterModeDecompositionToolCard/index.tsx` | Palette slot styling is localized                      |

### Keep Custom

These should stay custom because they encode editor-specific behavior.

| Area                            | Representative files                                                                                                                                                                   | Reason                                |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Canvas geometry                 | `src/presentation/components/screenMode/ui/preview/ScreenModeCharacterPreview/styles.ts`, `src/presentation/components/characterMode/ui/preview/CharacterModeTilePreview/styles.ts`    | Data-driven sizing and placement      |
| Overlay placement               | `src/presentation/components/screenMode/ui/overlays/ScreenModeBackgroundPlacementMockOverlay/styles.ts`, `src/presentation/components/bgMode/ui/panels/BgModeWorkspacePanel/styles.ts` | Editor-specific absolute positioning  |
| Drag previews and stage visuals | feature `styles.ts` modules for screen / character / sprite editors                                                                                                                    | Product-specific interaction surfaces |

## Current Test Coverage

Presentation tests focus on feature-owned geometry and interaction state rather than removed wrapper plumbing.

Representative files:

- `src/presentation/components/characterMode/ui/primitives/CharacterModePrimitives.test.ts`
- `src/presentation/components/screenMode/ui/primitives/ScreenModePrimitives.test.ts`
- `src/presentation/components/characterMode/ui/sidebar/CharacterModeSidebarLibrary.test.ts`
- `e2e/console.spec.ts`

## Maintenance Priorities

1. Prefer static shared components for ordinary UI.
2. Keep geometry-specific style helpers narrow and local.
3. Use CSS Modules for feature-owned visuals.
4. Delete tests that only assert removed wrapper or token plumbing.
5. Keep verification green whenever style ownership moves.

## Ready-to-Check Checklist

- [x] The static styling direction is documented.
- [x] Shared UI stays on explicit shared components and CSS Modules.
- [x] `styleClassNames.ts` is limited to shared canvas concerns and `mergeClassNames`.
- [x] Feature-local visuals are owned beside the component.
- [x] Verification remains green.
