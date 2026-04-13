# Claude Instructions

Follow `docs/RULES.md` as the canonical source of project rules.

## Required Behavior

- Load and apply the relevant sections from `docs/RULES.md` before acting.
- Treat those relevant rules as default task context, even when the prompt does not repeat them.
- Apply only rules relevant to the current task.
- If a prompt includes `add rule`, update `docs/RULES.md` immediately in the matching section.
- If the rule changes workflow or contributor expectations, update `README.md` and `docs/PROMPTS.md` too.
- If the rule changes future prompt execution, also sync `AGENTS.md` and `.github/copilot-instructions.md`.
- Prefer keeping project-specific guidance in `docs/RULES.md` instead of duplicating it here.
- For Pixi world performance tasks, apply the relevant `React UI` and `Pixi And Performance` rules from `docs/RULES.md`, including the single render scheduler guidance.
- When adding new draggable windows, follow the `docs/RULES.md` expectation that window content stays lazy-loaded and bundle-split.
- When generating world-facing content, follow the lore canon in `docs/lore/REALMFALL.md`.

## Reference Files

- `docs/RULES.md`
- `docs/PROMPTS.md`
- `docs/PROJECT_REVIEW.md`
- `docs/RESTRICTIONS.md`
- `docs/lore/REALMFALL.md`

## Project Expectations

- Follow the project-specific expectations in `docs/RULES.md`.
- Use the reference files above when they are relevant to the current task.
- Use `docs/PROJECT_REVIEW.md` as input for recurring best-practice updates, while keeping `docs/RULES.md` canonical.
