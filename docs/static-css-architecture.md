# Static CSS Architecture

## Purpose

This document defines the target styling architecture for the repository after Emotion removal work begins.

It exists to answer two questions consistently:

1. where a style should live
2. which styling mechanisms are allowed for that category of style

## Principles

- prefer static CSS over runtime style generation
- keep styling ownership local to the component that owns the UI
- use global CSS only for app-shell concerns
- use explicit module imports instead of hidden styling registries
- keep future migration to import-attributes-based CSS loading localized to component boundaries

## Allowed Styling Layers

### 1. Global CSS

Files:

- `src/assets/global.css`
- future shared token files imported from the app root

Allowed responsibilities:

- reset rules
- root typography and body defaults
- app shell background and page-wide texture
- shared canvas helper classes that are not component-owned

Disallowed responsibilities:

- feature-local component skins
- screen-specific layout shells
- menu or dialog visual variants
- repeated product UI patterns that belong beside a component

## 2. CSS Modules

Files:

- `Component.module.css`
- `styles.module.css`

Allowed responsibilities:

- component-local layout
- borders, shadows, radii, backgrounds
- typography presentation
- hover, focus, selected, and disabled state visuals
- feature-local responsive rules

Rules:

- each component imports its own CSS explicitly
- class names are module-scoped by default
- use `data-*` attributes or explicit class toggles for UI state
- avoid leaking visual rules through shared global selectors

## 3. Shared CSS Tokens

Files:

- future `src/presentation/styles/tokens.css`
- future shared module files for reviewed reusable patterns

Allowed responsibilities:

- CSS custom properties for shared color, surface, spacing, and effect tokens
- reviewed reusable layout or surface primitives that are genuinely shared

Rules:

- tokens should mirror stable product language, not call-site one-offs
- shared files should remain small and intentionally reused
- if a pattern is only used by one feature, keep it local instead

## 4. Typed Runtime Geometry

Allowed only when static CSS cannot fully express the behavior.

Examples:

- canvas width and height
- drag preview coordinates
- zoom-dependent measurements
- stage grid sizes driven by domain data

Rules:

- keep the boundary narrow and colocated with the owning component
- prefer CSS custom properties over large inline style objects
- pass dynamic values as numbers or strings with clear semantic meaning
- do not mix dynamic geometry with unrelated colors, shadows, or typography

## Disallowed Mechanisms For New Code

- new imports from `@emotion/cache`
- new imports from `@emotion/react`
- new application-owned `styled(...)` wrappers
- new repository-specific visual rules in a runtime theme file
- ad hoc global selectors for feature-owned UI

## Theme Responsibility

`src/assets/global.css` remains responsible for:

- palette and effect variables
- app-shell backgrounds and resets
- truly global utilities that cannot be component-owned

the global token layer should not grow back into:

- a feature styling registry
- a screen-level skinning layer
- a replacement for component-local CSS Modules

## Scope Rules

### Default Scope

Use CSS Modules as the default scope mechanism.

This gives the repository:

- deterministic local ownership
- low collision risk
- explicit import boundaries
- minimal coupling to a runtime style engine

### `:global(...)`

Use only when integrating with:

- component-library-generated structural classes that must be targeted
- Radix state hooks that require external selectors
- browser-native pseudo-structure not expressible locally

Rules:

- keep `:global(...)` selectors narrow
- colocate them with the owning component module
- document non-obvious integration selectors with a short comment

### Future `@scope`

If browser/tooling support becomes practical, `@scope` can be evaluated later.

It is not the primary mechanism for this migration. CSS Modules remain the default because they are already compatible with the current toolchain and can be adopted incrementally.

## Import Boundaries And Future Import Attributes

The repository should treat styles as explicit module dependencies.

That means:

- each TS/TSX module imports the CSS it depends on directly
- style loading should not depend on hidden theme registries or side-effect-heavy global bundles
- shared styling abstractions must still be imported explicitly

This keeps the codebase compatible with future experiments such as:

- CSS module script loading
- import-attributes-based stylesheet loading
- constructable stylesheet boundaries for isolated surfaces

The migration should not depend on those features today. The design goal is only to avoid blocking them later.

## State Encoding

Prefer these state channels for styling:

1. semantic component-library props when the component already supports them
2. `data-*` attributes for local visual state
3. explicit CSS Module class toggles

Avoid:

- deriving visual state from DOM hierarchy assumptions
- imperative style mutation
- broad descendant selectors that couple siblings together unnecessarily

## File Structure Guidance

For a presentational component:

- `index.tsx`: rendering and orchestration
- `Component.module.css`: visual styling
- optional `types.ts` or local helper modules when the component needs them

For geometry-heavy components:

- keep static skinning in `Component.module.css`
- keep dynamic geometry helpers in a small adjacent TS file only if needed

## Migration Mapping

### Move To CSS Modules

- menu surfaces and menu items
- dialog shell styling
- ordinary cards, forms, and inspector panels
- feature-local section layout

### Keep Temporarily In Typed Runtime Helpers

- drag preview coordinates
- canvas overlay placement
- stage cell metrics
- preview sizing tied directly to domain state

### Keep Global

- app shell background
- root font and selection styling
- shared canvas helper classes used across multiple features

## Review Checklist For Style Patches

- Does the style live in the narrowest valid layer?
- Could this be static CSS instead of runtime styling?
- Is the scope local by default?
- Are global selectors justified and minimal?
- Does the patch avoid adding new `styled(...)` usage?
- Are dynamic values limited to geometry rather than visual skinning?
- Will this still make sense if the repo later adopts import-attributes-based style loading?
