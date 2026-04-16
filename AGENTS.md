# AI Instructions

Load `docs/RULES.md` before acting and treat the matching scoped files under
`docs/rules/` as the default task context.

## Agent Notes

- Keep this file compact. Put recurring project rules in `docs/RULES.md` and
  `docs/rules/`, not here.
- If rule-loading behavior changes, sync `CLAUDE.md` and
  `.github/copilot-instructions.md` in the same task.
- Use `docs/WORKFLOW.md` and `docs/PROJECT_REVIEW.md` only as supporting
  references after loading the canonical rules.
