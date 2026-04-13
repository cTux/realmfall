# AI Instructions

This repository uses `docs/RULES.md` as the source of truth for project-specific AI guidance.

## Required Behavior

- Before acting on a task, load and apply the relevant sections from `docs/RULES.md`.
- Treat those relevant rules as part of the default working context, even if the prompt does not restate them explicitly.
- Apply only the rules that are relevant to the current task.
- If a prompt contains `add rule`, update `docs/RULES.md` immediately in the corresponding section before considering the task complete.
- If rule changes affect workflow or contributor expectations, keep `README.md` and `docs/PROMPTS.md` in sync.
- If rule changes affect future prompt execution, also sync `CLAUDE.md` and `.github/copilot-instructions.md`.
- Prefer updating `docs/RULES.md` over duplicating project-specific rules in this file.
- For Pixi world performance tasks, make sure the relevant `React UI` and `Pixi And Performance` rules from `docs/RULES.md` are applied, especially the single render scheduler guidance.
- When adding or changing unique items, enemies, or structures, keep each one in its own dedicated configuration file rather than extending a catch-all content-definition module.
- When tasks touch user-facing text, apply the i18n rules from `docs/RULES.md`: keep copy in locale files, add new keys instead of inline strings, and use the `{feature}.{area}.{property}` key pattern.
- For label formatters that map stable identifiers such as status effects to i18n, prefer direct patterned key lookups over conditional branches when the key can be derived safely.

## Supporting Docs

- `docs/RULES.md`: project rules and engineering guidance
- `docs/PROMPTS.md`: prompt templates and prompt workflow
- `docs/PROJECT_REVIEW.md`: observed pros, cons, and improvement guidance
- `docs/RESTRICTIONS.md`: hard project restrictions

## Repo Expectations

- Follow the project-specific expectations defined in `docs/RULES.md`.
- Use the supporting docs above when they are relevant to the current task.
- Use `docs/PROJECT_REVIEW.md` as input for recurring best-practice updates, while keeping `docs/RULES.md` canonical.
