# Realmfall Skill Context

## Quick context map

- Canonical policy: `docs/RULES.md`
- Scoped rule set: `docs/rules/*.md`
- Supporting references:
  - `docs/WORKFLOW.md`
  - `docs/PROJECT_REVIEW.md`
  - `docs/lore/REALMFALL.md`

## Useful project commands

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test:node`
- `pnpm test:jsdom`
- `pnpm build:budget:strict`
- `pnpm quality:staged`
- `pnpm sync:ai-entrypoints`

## Behavior constraints

- `pnpm` is the required package manager for project commands.
- Keep TypeScript, linting, and formatting quality intact.
- Preserve existing behavior unless the request explicitly asks for a behavior change.

