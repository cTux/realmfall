# AI Instructions

This repository uses `docs/RULES.md` as the source of truth for project-specific AI guidance.

## Required Behavior

- Before acting on a task, load and apply the relevant sections from `docs/RULES.md`.
- Apply only the rules that are relevant to the current task.
- If a prompt contains `add rule`, update `docs/RULES.md` immediately in the corresponding section before considering the task complete.
- If rule changes affect workflow or contributor expectations, keep `README.md` and `docs/PROMPTS.md` in sync.

## Supporting Docs

- `docs/RULES.md`: project rules and engineering guidance
- `docs/PROMPTS.md`: prompt templates and prompt workflow
- `docs/PROJECT_REVIEW.md`: observed pros, cons, and improvement guidance
- `docs/RESTRICTIONS.md`: hard project restrictions

## Repo Expectations

- Use `pnpm` for commands.
- Keep gameplay logic in `src/game`, app orchestration in `src/app`, UI components in `src/ui/components`, and Pixi rendering logic in `src/ui/world`.
- Preserve save normalization and treat browser-side save encryption as obfuscation, not real security.
- Protect rendering performance and avoid unnecessary growth in already-large coordinator files.
