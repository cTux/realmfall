# AI Instructions

This repository uses `docs/RULES.md` as the canonical entrypoint for project-specific AI guidance.

## Required Behavior

- Before acting on a task, load `docs/RULES.md`, then load only the scoped files under `docs/rules/` that match the task.
- Treat the loaded rules as part of the default working context, even if the prompt does not restate them explicitly.
- Apply only the rules that are relevant to the current task.
- If a prompt contains `add rule`, update `docs/RULES.md` when the rule map changes and update the corresponding file under `docs/rules/` immediately before considering the task complete.
- If a performance-sensitive prompt changes React, Pixi, hover, or bundle behavior, also document how that path should be verified.
- If rule changes affect workflow or contributor expectations, keep `README.md` and `docs/WORKFLOW.md` in sync.
- If rule changes affect future prompt execution, also sync `CLAUDE.md` and `.github/copilot-instructions.md`.
- Keep the scoped pre-commit workflow expectations from the loaded rules in mind: full-project typecheck stays global, while Oxlint, Stylelint, and Vitest may run against staged files unless shared test inputs require a full test run.
- Treat Oxlint as the only JavaScript and TypeScript linter unless the task explicitly changes the lint toolchain.
- Prefer updating `docs/rules/` and the rule map in `docs/RULES.md` over duplicating project-specific rules in this file.
- Keep this file compact and use it as an entrypoint back to the canonical rules.

## Supporting Docs

- `docs/RULES.md`: project rules and engineering guidance
- `docs/rules/`: scoped rule files loaded per task
- `docs/WORKFLOW.md`: contributor workflow and recurring review guidance
- `docs/PROJECT_REVIEW.md`: observed pros, cons, and improvement guidance

## Repo Expectations

- Follow the project-specific expectations defined in the loaded rule files.
- Use the supporting docs above when they are relevant to the current task.
- Use `docs/PROJECT_REVIEW.md` as input for recurring best-practice updates, while keeping `docs/RULES.md` canonical.
