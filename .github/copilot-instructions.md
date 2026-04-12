# Copilot Instructions

Use `docs/RULES.md` as the source of truth for project-specific instructions.

## Required Behavior

- Automatically apply the relevant sections from `docs/RULES.md` to the current task.
- Treat those relevant rules as default context, even if the prompt does not restate them.
- Do not apply irrelevant rules.
- If a prompt or task includes `add rule`, update `docs/RULES.md` immediately in the corresponding section.
- Keep `README.md` and `docs/PROMPTS.md` aligned when workflow expectations change.
- Prefer keeping project-specific rules in `docs/RULES.md` instead of restating them here.

## Important References

- `docs/RULES.md`
- `docs/PROMPTS.md`
- `docs/PROJECT_REVIEW.md`
- `docs/RESTRICTIONS.md`

## Local Expectations

- Follow the project-specific expectations in `docs/RULES.md`.
- Use the reference files above when they are relevant to the current task.
