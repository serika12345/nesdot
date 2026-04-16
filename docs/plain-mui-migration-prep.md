# Plain MUI Migration Prep

## Goal

- Stop maintaining a repository-specific visual design system.
- Converge on stock MUI / Material visuals wherever the UI is not editor-specific.
- Keep custom styling only for product-specific editor geometry, canvas overlays, and preview sizing.

## Direction

The target state is:

- MUI components are used directly for ordinary UI building blocks.
- The theme is reduced to a thin Material configuration layer.
- The legacy wrapper module is removed, and `styleClassNames.ts` plus most class-based `MuiCssBaseline` skins are reduced aggressively.
- App-specific visuals remain only where MUI has no meaningful stock equivalent.

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

| File                                  | Role                                                                         |      Size |
| ------------------------------------- | ---------------------------------------------------------------------------- | --------: |
| `src/presentation/theme.ts`           | Global tokens + global custom skin layer via `MuiCssBaseline.styleOverrides` | 714 lines |
| `src/presentation/styleClassNames.ts` | Class token registry for the custom styling layer                            |  91 lines |

### Spread of the Custom Layer

| Metric                                                      | Count |
| ----------------------------------------------------------- | ----: |
| Files importing `styleClassNames`                           |    13 |
| `styles.ts` modules under `src/presentation/components`     |    19 |
| `styleClassNames.ts` exported constants                     |    53 |
| Theme class selector lines in `theme.ts`                    |    45 |
| Theme `data-*` selector lines in `theme.ts`                 |    32 |
| `.MuiButtonBase-root.*` custom selector lines in `theme.ts` |     4 |

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

### 1. Global Material-Bypassed Skin Layer

`src/presentation/theme.ts` does much more than palette and typography setup.

It currently owns:

- App-wide CSS variables for colors, surfaces, and effects
- Background gradients and texture
- Card/panel surfaces
- Custom button, badge, and menu skins
- Screen mode / character mode / BG mode custom visuals
- State-driven class selectors via `data-*`

This is the main custom design system layer to remove.

### 2. Wrapper Primitive Layer

The removed legacy wrapper module used to wrap MUI primitives and plain elements to attach:

- custom class names
- repository-specific `data-*` states
- default layout props

This file is the main adapter between application UI and the custom theme skin.

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

### Replace After Foundation Cleanup

These areas depend on the current class-based skin and should follow after the first wave.

| Area                      | Representative files                                                                        | Notes                                              |
| ------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Screen mode primitives    | `src/presentation/components/screenMode/ui/primitives/ScreenModePrimitives/index.tsx`       | Depends on custom class tokens and theme selectors |
| Character mode primitives | `src/presentation/components/characterMode/ui/primitives/CharacterModePrimitives/index.tsx` | Heavy custom state/class mapping                   |
| App shell wrappers        | `src/presentation/App.tsx`                                                                  | Continue collapsing remaining shared class tokens  |

### Keep Custom

These should stay custom even after the design system layer is removed.

| Area                            | Representative files                                                                                                                                                                   | Reason                                |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Canvas geometry                 | `src/presentation/components/screenMode/ui/preview/ScreenModeCharacterPreview/styles.ts`, `src/presentation/components/characterMode/ui/preview/CharacterModeTilePreview/styles.ts`    | Data-driven sizing and placement      |
| Overlay placement               | `src/presentation/components/screenMode/ui/overlays/ScreenModeBackgroundPlacementMockOverlay/styles.ts`, `src/presentation/components/bgMode/ui/panels/BgModeWorkspacePanel/styles.ts` | Editor-specific absolute positioning  |
| Drag previews and stage visuals | feature `styles.ts` modules for screen / character / sprite editors                                                                                                                    | Product-specific interaction surfaces |

## Existing Tests That Lock the Custom Layer

The following tests still assert custom class tokens, layout primitives, and state attribute behavior:

- `src/presentation/CharacterModePrimitives.styles.test.tsx`
- `src/presentation/ScreenModeBackgroundPlacementMockOverlay.styles.test.tsx`
- `src/presentation/components/screenMode/ui/primitives/ScreenModePrimitives.test.ts`

These tests are expected to keep shrinking as the repo moves away from class-token plumbing.

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

This phase is now active: the legacy wrapper module is already gone, and dead app-level tokens are being removed incrementally from the shared registry and global theme.

### Phase 4: Thin the Theme

Reduce `src/presentation/theme.ts` to:

- palette
- typography
- shape
- optional component defaults that stay inside standard MUI theming

Delete repo-specific class skin rules from `MuiCssBaseline.styleOverrides` as each area is migrated.

## Ready-to-Implement Checklist

- [ ] Style engine path is fixed and documented for the migration
- [ ] No new feature code adds `styleClassNames` dependencies or revives wrapper components
- [ ] First-wave target files are selected
- [ ] Custom-layer tests that will be rewritten are identified up front
- [ ] Verification plan is agreed before the first code patch

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
