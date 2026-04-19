# RULES

`docs/RULES.md` is the canonical entrypoint for project-specific AI guidance.

## Prompt Integration

- Treat this file as the loader for scoped project guidance.
- Before acting on a task, load and apply only the rule files relevant to that task's scope.
- Treat the loaded rules as default working context even when the prompt does not restate them.
- If a prompt contains `add rule`, update this file's rule map when the scope changes and update the matching file under `docs/rules/` immediately before considering the task complete.
- If a task changes project structure, workflow, or recurring implementation expectations, update the matching file under `docs/rules/` in the same task.
- Keep AI-specific instruction entrypoints such as `AGENTS.md`, `CLAUDE.md`, and `.github/copilot-instructions.md` aligned with this file when prompt-loading behavior changes.
- Use `docs/PROJECT_REVIEW.md` and `docs/WORKFLOW.md` as supporting inputs when refining recurring project rules, but keep this file and the files it routes to as the canonical rules source.
- Keep supporting markdown files compact. Prefer references back to this entrypoint and scoped rule files instead of duplicating long rule lists across multiple docs.

## Always Load

- `docs/rules/00-general.md`

## Load By Task Area

- Architecture, file placement, domain boundaries: `docs/rules/10-architecture.md`
- Persistence, save shape, autosave behavior: `docs/rules/20-persistence.md`
- React UI, Storybook, i18n, window behavior: `docs/rules/30-react-ui.md`
- Pixi, hover paths, render invalidation, frame-time concerns: `docs/rules/40-pixi-performance.md`
- Bundle shape, lazy loading, startup chunk budgets: `docs/rules/50-build-and-bundle.md`
- Tests, specs, contributor-facing docs, workflow updates: `docs/rules/60-testing-and-documentation.md`

## Supporting Docs

- `docs/WORKFLOW.md`
- `docs/PROJECT_REVIEW.md`
- `docs/lore/REALMFALL.md`

## Notes

- Prefer moving deterministic workflow setup into scripts or tooling instead of adding more prompt-time instructions.
- Keep repo-specific behavioral rules in `docs/rules/` instead of re-expanding AI entrypoint files.
- In review findings and improvement descriptions, do not use `still` as comparative filler; describe the current behavior directly unless quoting source text.
