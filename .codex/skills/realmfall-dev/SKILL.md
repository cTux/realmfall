---
name: realmfall-dev
description: Use when working on this repo to apply Realmfall-specific workflow, quality, and content constraints before implementation, review, or release-adjacent decisions.
metadata:
  short-description: Realmfall project workflow guardrails and conventions
---

# Realmfall Dev

Use this skill for implementation, review support, or process planning in the `realmfall` repository.

## Trigger

Use when the user asks for:

- implementation or refactor work in `src`
- workflow, quality, or release-adjacent guidance
- review, planning, or scope checks for Realmfall tasks
- recurring maintenance commands

## Canonical rules to load first

1. Load `docs/RULES.md`.
2. Load only scoped rules for the task area:
   - `docs/rules/00-general.md`
   - `docs/rules/10-architecture.md` (architecture/schema changes)
   - `docs/rules/20-persistence.md` (save/load behavior)
   - `docs/rules/30-react-ui.md` (UI work)
   - `docs/rules/40-pixi-performance.md` (Pixi/render work)
   - `docs/rules/50-build-and-bundle.md` (bundling/perf budgets)
   - `docs/rules/60-testing.md` (quality gates and verification expectations)
   - `docs/rules/61-documentation.md` (spec/doc updates)
3. Keep `docs/WORKFLOW.md`, `docs/PROJECT_REVIEW.md`, and `docs/lore/REALMFALL.md` as supporting references.

## Repository conventions

- Use `pnpm` for commands.
- Keep changes minimal and preserve existing behavior unless explicitly requested to change behavior.
- Keep domain content aligned with `docs/lore/REALMFALL.md`.
- Keep strict TypeScript and style quality aligned with existing project settings.
- Use DRY: prefer existing shared helpers and patterns over new abstractions.

## Dependency and setup behavior

If node modules are missing, install dependencies with `pnpm install` before running project commands.

## Practical runbook

1. Inspect scoped code and related spec(s).
2. Make the smallest correct change in the established pattern.
3. If commands are requested, use repository scripts from `package.json`:
   - `pnpm lint`
   - `pnpm typecheck`
   - `pnpm test:node`
   - `pnpm test:jsdom`
   - `pnpm build:budget:strict` (when build-impacting behavior changes)
4. For contributor/process changes, keep spec/docs updates synchronized with `docs/WORKFLOW.md` and scoped rule files.
5. For commit preparation, follow repository workflow in `docs/WORKFLOW.md`.

## Output style

- Be direct and concrete.
- Prefer concise next steps and file-level actions.
- Avoid speculative or unrelated process changes.

## References

- [docs/RULES.md](../../docs/RULES.md)
- [docs/rules/00-general.md](../../docs/rules/00-general.md)
- [docs/WORKFLOW.md](../../docs/WORKFLOW.md)
- [docs/PROJECT_REVIEW.md](../../docs/PROJECT_REVIEW.md)
- [docs/lore/REALMFALL.md](../../docs/lore/REALMFALL.md)

---
