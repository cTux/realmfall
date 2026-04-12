# Copilot Instructions

Use `docs/RULES.md` as the source of truth for project-specific instructions.

## Required Behavior

- Automatically apply the relevant sections from `docs/RULES.md` to the current task.
- Do not apply irrelevant rules.
- If a prompt or task includes `add rule`, update `docs/RULES.md` immediately in the corresponding section.
- Keep `README.md` and `docs/PROMPTS.md` aligned when workflow expectations change.

## Important References

- `docs/RULES.md`
- `docs/PROMPTS.md`
- `docs/PROJECT_REVIEW.md`
- `docs/RESTRICTIONS.md`

## Local Expectations

- Use `pnpm` for commands.
- Keep gameplay logic in `src/game`.
- Keep app orchestration in `src/app`.
- Keep UI components in `src/ui/components`.
- Keep Pixi world rendering logic in `src/ui/world`.
- Preserve save normalization and avoid describing browser-side save storage as real security.
- Prefer changes that protect rendering performance and avoid unnecessary architectural sprawl.
