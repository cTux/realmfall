# Claude Instructions

Follow `docs/RULES.md` as the canonical entrypoint for project rules.

## Required Behavior

- Load `docs/RULES.md` before acting, then load and apply only the scoped rule files under `docs/rules/` that match the task.
- Treat the loaded rules as default task context, even when the prompt does not repeat them.
- Apply only rules relevant to the current task.
- If a prompt includes `add rule`, update `docs/RULES.md` when the rule map changes and update the matching file under `docs/rules/` immediately.
- If an optimization prompt establishes a recurring implementation pattern, capture it in `docs/RULES.md` instead of leaving it only in code changes.
- If a task changes project structure or a recurring implementation expectation, update the matching file under `docs/rules/` in the same task so future prompts inherit it.
- If a performance-sensitive prompt changes React, Pixi, hover, or bundle behavior, also document how that path should be verified.
- If the rule changes workflow or contributor expectations, update `README.md` and `docs/WORKFLOW.md` too.
- If the rule changes future prompt execution, also sync `AGENTS.md` and `.github/copilot-instructions.md`.
- Keep the scoped pre-commit workflow expectations from the loaded rules in mind: full-project typecheck stays global, while Oxlint, Stylelint, and Vitest may run against staged files unless shared test inputs require a full test run.
- Treat Oxlint as the only JavaScript and TypeScript linter unless the task explicitly changes the lint toolchain.
- Prefer keeping project-specific guidance in `docs/rules/` and the rule map in `docs/RULES.md` instead of duplicating it here.
- Keep this file compact and use it as an entrypoint back to the canonical rules.

## Reference Files

- `docs/RULES.md`
- `docs/rules/`
- `docs/WORKFLOW.md`
- `docs/PROJECT_REVIEW.md`
- `docs/lore/REALMFALL.md`

## Project Expectations

- Follow the project-specific expectations in the loaded rule files.
- Use the reference files above when they are relevant to the current task.
- Use `docs/PROJECT_REVIEW.md` as input for recurring best-practice updates, while keeping `docs/RULES.md` canonical.
