# Claude Instructions

Follow `docs/RULES.md` as the canonical source of project rules.

## Required Behavior

- Load and apply the relevant sections from `docs/RULES.md` before acting.
- Treat those relevant rules as default task context, even when the prompt does not repeat them.
- Apply only rules relevant to the current task.
- If a prompt includes `add rule`, update `docs/RULES.md` immediately in the matching section.
- If an optimization prompt establishes a recurring implementation pattern, capture it in `docs/RULES.md` instead of leaving it only in code changes.
- If a task changes project structure or a recurring implementation expectation, update `docs/RULES.md` in the same task so future prompts inherit it.
- Apply the structural placement rules from `docs/RULES.md` for colocated `hooks/`, `selectors/`, `utils/`, and `tests/` directories, shared modules under `src/*`, and decomposing broad multi-export files.
- If a performance-sensitive prompt changes React, Pixi, hover, or bundle behavior, also document how that path should be verified.
- If the rule changes workflow or contributor expectations, update `README.md` and `docs/WORKFLOW.md` too.
- If the rule changes future prompt execution, also sync `AGENTS.md` and `.github/copilot-instructions.md`.
- Keep the scoped pre-commit workflow expectations from `docs/RULES.md` in mind: full-project typecheck stays global, while ESLint, Stylelint, and Vitest may run against staged files unless shared test inputs require a full test run.
- Prefer keeping project-specific guidance in `docs/RULES.md` instead of duplicating it here.
- Keep this file compact and use it as an entrypoint back to the canonical rules.

## Reference Files

- `docs/RULES.md`
- `docs/WORKFLOW.md`
- `docs/PROJECT_REVIEW.md`
- `docs/lore/REALMFALL.md`

## Project Expectations

- Follow the project-specific expectations in `docs/RULES.md`.
- Keep Storybook stories aligned with component and entity dictionary changes when the task touches UI or content definitions.
- Keep specs aligned with shipped features, improvements, and fixes, and update enforceable lint or formatting config when a syntax or commit-format convention changes.
- Use the reference files above when they are relevant to the current task.
- Use `docs/PROJECT_REVIEW.md` as input for recurring best-practice updates, while keeping `docs/RULES.md` canonical.
