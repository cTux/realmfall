---
name: realmfall-quality
description: Use for test, lint, typecheck, build budget, and verification-path planning in Realmfall.
metadata:
  short-description: Realmfall quality and validation workflow skill
---

# Realmfall Quality

Use this skill when the user asks for validation strategy, pre-commit alignment, CI-scope advice, or explicit quality checks.

## Trigger

- requested verification strategy
- CI/test/lint/typecheck planning
- commit-readiness preparation
- automation-related guidance (hooks/validation paths)

## Canonical loading

- `docs/RULES.md`
- `docs/rules/60-testing.md`
- `docs/rules/00-general.md`
- `docs/rules/50-build-and-bundle.md` (when bundle/perf budgets are impacted)

## Primary commands

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- `pnpm build:budget:strict`
- `pnpm quality:staged` (when applicable to staged changes)

## Workflow notes

- Keep checks aligned to task scope; use full repo validation when hooks/commit policy is bypassed.
- Match existing commit/version constraints from `docs/WORKFLOW.md`.
- Call out verification gaps if full checks are not run.
