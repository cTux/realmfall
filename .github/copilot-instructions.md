# Copilot Instructions

Use `docs/RULES.md` as the source of truth for project-specific instructions.

## Required Behavior

- Automatically apply the relevant sections from `docs/RULES.md` to the current task.
- Treat those relevant rules as default context, even if the prompt does not restate them.
- Do not apply irrelevant rules.
- If a prompt or task includes `add rule`, update `docs/RULES.md` immediately in the corresponding section.
- If an optimization prompt establishes a recurring implementation pattern, capture it in `docs/RULES.md` instead of leaving it only in code changes.
- If a task changes project structure or a recurring implementation expectation, update `docs/RULES.md` in the same task so future prompts inherit it.
- Apply the structural placement rules from `docs/RULES.md` for colocated `hooks/`, `selectors/`, `utils/`, and `tests/` directories, shared modules under `src/*`, and decomposing broad multi-export files.
- If a performance-sensitive prompt changes React, Pixi, hover, or bundle behavior, also document how that path should be verified.
- Keep `README.md` and `docs/WORKFLOW.md` aligned when workflow expectations change.
- If a rule changes future prompt execution, also sync `AGENTS.md` and `CLAUDE.md`.
- Prefer keeping project-specific rules in `docs/RULES.md` instead of restating them here.
- Keep this file compact and use it as an entrypoint back to the canonical rules.

## Important References

- `docs/RULES.md`
- `docs/WORKFLOW.md`
- `docs/PROJECT_REVIEW.md`
- `docs/lore/REALMFALL.md`

## Local Expectations

- Follow the project-specific expectations in `docs/RULES.md`.
- Keep Storybook stories aligned with component and entity dictionary changes when the task touches UI or content definitions.
- Keep specs aligned with shipped features, improvements, and fixes, and update enforceable lint or formatting config when a syntax or commit-format convention changes.
- Use the reference files above when they are relevant to the current task.
- Use `docs/PROJECT_REVIEW.md` as input for recurring best-practice updates, while keeping `docs/RULES.md` canonical.
