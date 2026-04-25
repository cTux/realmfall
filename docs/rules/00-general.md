# General Rules

## General

- Use `pnpm` for project commands. Do not switch examples or contributor guidance to `npm`.
- Keep TypeScript strictness, Oxlint, Prettier, tests, and Husky hooks working. New changes should not weaken existing quality gates.
- Keep Oxlint as the only JavaScript and TypeScript linter in the repository. Do not reintroduce ESLint or Biome unless the task explicitly changes the lint toolchain.
- Keep React hook lint checks on the enforced Oxlint path for TypeScript and TSX files, including invalid hook usage and effect dependency validation.
- Keep the pre-commit hook aligned with the linting workflow. When Oxlint can safely auto-fix staged JavaScript and TypeScript issues, prefer applying the fix during pre-commit instead of failing only on fixable drift.
- Keep the pre-commit hook aligned with the formatting workflow as well. Staged files that Prettier supports should be formatted during pre-commit so repository-wide formatting drift does not accumulate outside the enforced path.
- Keep the pre-commit hook aligned with the local quality bar. It should enforce staged-file lint checks and staged-file related tests by default, including staged runtime JSON sources that affect app behavior or content, and it may also run the repository-wide validation path when the workflow intentionally prefers slower commits over slower pushes.
- When the workflow chooses commit-time full validation, keep the pre-commit hook responsible for the repository-wide typecheck, lint, test, and strict build-budget gates instead of splitting those checks across pre-commit and pre-push.
- When the workflow chooses commit-time full validation, keep the pre-push hook as a no-op so contributors do not pay the same repository-wide gates twice.
- Treat a staged `package.json` change that only updates the `version` field as lightweight release metadata, not as a shared-input change that forces the full repository test suite.
- Prefer the smallest correct change that fits the existing structure.
- Apply the DRY principle. When logic, UI structure, or configuration patterns repeat, prefer extracting or extending an existing shared helper, component, or module instead of copying the pattern again.
- When a requested JavaScript or TypeScript syntax preference can be enforced mechanically, prefer enabling or adjusting the corresponding Oxlint rule instead of relying only on contributor discipline, using Oxlint JS plugins only when the rule is not available natively.
- When a requested JavaScript or TypeScript syntax preference also depends on formatting behavior, update the relevant Prettier configuration when that style can be enforced there as well.
- When a requested CSS or SCSS syntax preference can be enforced mechanically, prefer enabling or adjusting the corresponding Stylelint rule instead of relying only on contributor discipline.
- When a requested commit message format changes, update the Commitlint configuration in the same task when the repository can enforce that convention automatically.
- Auto-bump the `package.json` patch version for routine commits through the shared commit-version bump script. Keep the bump guarded so it never stages unrelated unstaged `package.json` edits, and keep contributor guidance aligned with the helper script and Husky hook.
- Do not use `&&` when composing PowerShell command chains for commit workflows; use `;` or separate commands because PowerShell does not treat `&&` as a command separator.
- Preserve existing behavior unless the task explicitly changes behavior.
- Favor existing project patterns over introducing new abstractions, state layers, or architectural styles without a clear need.
- Keep documentation grounded in the current shipped behavior and known constraints, not aspirational plans.
- Keep browser security headers aligned across Vite dev, Vite preview, and static serving paths when the same runtime behavior is expected in each environment.
- Prefer explicit browser-isolation headers and targeted CSP allowances over broad `unsafe-inline` policy relaxations when the app only needs a narrower exception such as inline style attributes.
- Resolve configured gameplay content from canonical ids and tags, not localized display-name fallbacks. When replacing or removing content, update the live references instead of preserving retired ids through runtime name matching.
- When generating or naming world content such as places, factions, enemies, items, events, structures, or flavor text, align it with the established lore in `docs/lore/REALMFALL.md`.
- In JavaScript and TypeScript, when a function immediately returns an expression, prefer concise arrow functions without a block body.
- Keep Oxlint rules aligned with the current JavaScript and TypeScript style expectations so these conventions are auto-checked and auto-fixable when practical.

## Current Project Constraints

- The game does not support mods.
