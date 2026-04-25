---
name: realmfall-review
description: Use for code review, diff triage, bug-risk checks, and quality-focused findings in this repo.
metadata:
  short-description: Realmfall-focused review and risk finding workflow
---

# Realmfall Review

Use this skill when the user asks for review, risk scan, bug spotting, or post-change verification guidance.

## Trigger

- code review before/after implementation
- bug regression check
- architecture/design review requests
- risk and edge-case identification

## Rules to load first

- `docs/RULES.md`
- `docs/rules/00-general.md`
- `docs/rules/60-testing.md`
- `docs/rules/61-documentation.md`

## Review focus

- Prioritize behavioral correctness over formatting/style.
- Call out highest-risk findings first.
- Flag missing tests, silent edge-case regressions, and command/path assumptions.
- Preserve existing behavior unless the requested scope explicitly includes behavior changes.

## Suggested review commands

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- `pnpm test:node`
- `pnpm test:jsdom`

## Documentation linkage

- Keep review notes grounded in canonical docs.
- Refer to `docs/WORKFLOW.md` and `docs/PROJECT_REVIEW.md` for process context.
- Use `docs/rules/61-documentation.md` when updating review-related guidance.
