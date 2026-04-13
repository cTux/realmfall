# Copilot Instructions

Use `docs/RULES.md` as the source of truth for project-specific instructions.

## Required Behavior

- Automatically apply the relevant sections from `docs/RULES.md` to the current task.
- Treat those relevant rules as default context, even if the prompt does not restate them.
- Do not apply irrelevant rules.
- If a prompt or task includes `add rule`, update `docs/RULES.md` immediately in the corresponding section.
- Keep `README.md` and `docs/PROMPTS.md` aligned when workflow expectations change.
- If a rule changes future prompt execution, also sync `AGENTS.md` and `CLAUDE.md`.
- Prefer keeping project-specific rules in `docs/RULES.md` instead of restating them here.
- For Pixi world performance tasks, apply the relevant `React UI` and `Pixi And Performance` rules from `docs/RULES.md`, including the single render scheduler guidance.
- When adding new draggable windows, follow the `docs/RULES.md` expectation that window content stays lazy-loaded and bundle-split.
- When generating world-facing content, follow the lore canon in `docs/lore/REALMFALL.md`.
- When adding or changing unique items, enemies, or structures, keep each one in its own dedicated configuration file rather than extending a catch-all content-definition module.

## Important References

- `docs/RULES.md`
- `docs/PROMPTS.md`
- `docs/PROJECT_REVIEW.md`
- `docs/RESTRICTIONS.md`
- `docs/lore/REALMFALL.md`

## Local Expectations

- Follow the project-specific expectations in `docs/RULES.md`.
- Use the reference files above when they are relevant to the current task.
- Use `docs/PROJECT_REVIEW.md` as input for recurring best-practice updates, while keeping `docs/RULES.md` canonical.
