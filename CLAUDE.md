# Claude Instructions

Follow `docs/RULES.md` as the canonical source of project rules.

## Required Behavior

- Load and apply the relevant sections from `docs/RULES.md` before acting.
- Treat those relevant rules as default task context, even when the prompt does not repeat them.
- Apply only rules relevant to the current task.
- If a prompt includes `add rule`, update `docs/RULES.md` immediately in the matching section.
- If the rule changes workflow or contributor expectations, update `README.md` and `docs/PROMPTS.md` too.
- Prefer keeping project-specific guidance in `docs/RULES.md` instead of duplicating it here.
- For Pixi world performance tasks, apply the relevant `React UI` and `Pixi And Performance` rules from `docs/RULES.md`, including the single render scheduler guidance.

## Reference Files

- `docs/RULES.md`
- `docs/PROMPTS.md`
- `docs/PROJECT_REVIEW.md`
- `docs/RESTRICTIONS.md`

## Project Expectations

- Follow the project-specific expectations in `docs/RULES.md`.
- Use the reference files above when they are relevant to the current task.
