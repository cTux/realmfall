# Claude Instructions

Load `docs/RULES.md` before acting and apply only the scoped rule files under
`docs/rules/` that match the task.

## Claude-Specific Notes

- Keep this file as a thin entrypoint. Move recurring project guidance into
  `docs/RULES.md` and `docs/rules/`.
- If prompt-loading behavior changes, sync `AGENTS.md` and
  `.github/copilot-instructions.md` in the same task.
- Write review findings and improvement descriptions without comparative filler
  such as `still`; state the current behavior directly.
- Use `docs/WORKFLOW.md`, `docs/PROJECT_REVIEW.md`, and
  `docs/lore/REALMFALL.md` as supporting references after the canonical rules
  are loaded.
