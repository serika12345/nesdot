---
name: nesdot-safe-coding
description: "Implement code changes in this repository with strict safety rules. Use for bug fixes, refactors, and feature work that must follow AGENTS.md constraints, Nix dev-shell execution, test-first updates, and required verification gates."
argument-hint: "Describe the change goal and affected files"
---

# Nesdot Safe Coding Workflow

## Outcome

Deliver a minimal, correct change that follows repository constraints and passes required verification commands.

## When to Use

- Implementing a bug fix
- Adding or changing behavior in TypeScript or React code
- Refactoring with strict type and lint constraints
- Preparing a change where verification commands must be reported clearly

## Inputs

- Requested behavior change
- Suspected affected files
- Whether UI-visible behavior changes
- Whether src-tauri or Rust-specific tooling is affected

## Procedure

1. Confirm scope and affected layers.
2. Read existing implementation and relevant tests before editing.
3. Classify the change:

- Domain-only logic
- UI/rendering/interaction logic
- Config/toolchain change
- Rust/Tauri native or release-tooling change

4. Define the smallest safe patch.
5. For observable behavior changes, add or update tests first.
6. Implement with repository constraints:

- Run project commands inside Nix dev shell.
- Avoid any, as assertions, non-null assertions, let/var.
- Avoid mutating arrays and parameter mutation.
- Validate external data at boundaries with zod.

7. Run the required verification suite for the change scope, including `pnpm format:check`, `pnpm verify:security`, and `pnpm verify:rust` whenever src-tauri or Rust-specific workflows/scripts are touched.
8. If checks fail, fix root cause and rerun until green.
9. Report exactly what changed, commands run, pass/fail status, and residual risks.

## Decision Points

- If the behavior is observable and testable:
  Add or update tests before implementation.
- If files under src/presentation or component hooks are edited:
  Treat as UI change and run e2e console checks.
- If visible interaction flow changed:
  Also run full e2e.
- If files under src-tauri or Rust-specific workflows/scripts are edited:
  Also run `pnpm verify:rust`.
- If lint/type/test conflict with style preference:
  Prioritize mechanical gates.
- If unexpected unrelated workspace changes appear while editing:
  Stop and ask the user how to proceed.

## Required Verification

Run the AGENTS.md verification matrix for the change scope.

Base repository checks:

- pnpm format:check
- pnpm lint
- pnpm typecheck:safety
- pnpm verify:security
- pnpm test

Additional checks by scope:

- pnpm test:e2e:console for UI or toolchain changes
- pnpm test:e2e for visible interaction-flow changes
- pnpm verify:rust for src-tauri, Cargo.toml, or Rust-specific scripts and workflows

## Command Execution Rule

Use one-shot commands through Nix dev shell:

- nix develop -c zsh -lc '<command>'

## Definition of Done

- Requested behavior is implemented.
- Required checks for the change scope pass.
- No repository constraints were weakened.
- External data boundaries are validated.
- Final report includes changed files, commands run, outcomes, and remaining risks.
