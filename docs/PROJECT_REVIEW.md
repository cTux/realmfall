# Project Review

This file is a transient review note, not a canonical source of project rules or
current behavior.

- Use `docs/RULES.md` and `docs/rules/` for recurring project guidance.
- Use `docs/specs/` for shipped behavior and technical-solution descriptions.
- Record fresh review findings in implementation notes, issues, or pull request
  discussions instead of expanding this file into a second policy document.

Current durable follow-ups:

- `src/game/state.ts` is narrower after the recent reward and world-event
  extractions, and it remains the main gameplay transition entry point.
- `src/app/App/App.tsx` is narrower after the recent window view and action
  extractions, but it remains the main lifecycle composition root.
- Browser-side save protection should continue to be described as obfuscation,
  not security, unless the trust model changes.
