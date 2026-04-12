# Claude Instructions

Follow `docs/RULES.md` as the canonical source of project rules.

## Required Behavior

- Load and apply the relevant sections from `docs/RULES.md` before acting.
- Apply only rules relevant to the current task.
- If a prompt includes `add rule`, update `docs/RULES.md` immediately in the matching section.
- If the rule changes workflow or contributor expectations, update `README.md` and `docs/PROMPTS.md` too.

## Reference Files

- `docs/RULES.md`
- `docs/PROMPTS.md`
- `docs/PROJECT_REVIEW.md`
- `docs/RESTRICTIONS.md`

## Project Expectations

- Use `pnpm`.
- Keep architecture boundaries intact across `src/game`, `src/app`, `src/ui/components`, and `src/ui/world`.
- Preserve normalize-before-hydrate persistence behavior.
- Treat local save encryption as obfuscation only.
- Protect Pixi and React performance on world-facing changes.
