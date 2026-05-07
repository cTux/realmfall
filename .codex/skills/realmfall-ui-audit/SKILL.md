---
name: realmfall-ui-audit
description: Use for UI, accessibility, interaction, Storybook, and UX audits in this repo. Trigger on requests to review UI, check accessibility, audit window interactions, inspect shared components, or compare client/browser surfaces against web UI best practices.
metadata:
  short-description: Realmfall UI and accessibility audit workflow
---

# Realmfall UI Audit

Use this skill when the user asks for:

- UI or UX review
- accessibility or keyboard-interaction checks
- Storybook-facing component audits
- review of shared controls in `packages/ui`
- review of client windows, overlays, or browser interaction affordances

## Rules to load first

1. `docs/RULES.md`
2. `docs/rules/00-general.md`
3. `docs/rules/30-react-ui.md`
4. `docs/rules/60-testing.md`
5. `docs/rules/61-documentation.md`

## Supporting references

- `references/realmfall-ui-audit-context.md`
- `references/web-ui-checklist.md`
- `packages/ui/README.md` when the review targets shared components
- `packages/client/README.md` when the review targets client windows, app shell, or browser runtime UI

## Review order

1. Identify the concrete files or surface being reviewed.
2. Apply Realmfall-specific rules first, especially desktop-window UI, shared `Button` usage, i18n, Storybook coverage, and tooltip conventions.
3. Apply the generic checklist only where it fits the current architecture.
4. Skip generic advice that conflicts with the repo's current model, such as router-driven URL state expectations, framework-specific deployment assumptions, or web-page conventions that do not apply to Pixi-rendered game surfaces.
5. Report findings first, ordered by severity, with file and line references.

## Output expectations

- Treat this as a code review, not a style checklist dump.
- Only report actionable issues, risks, or missing tests.
- Keep findings concise, but include enough explanation when the fix is not obvious.
- If no findings are present, say so directly and mention any residual verification gaps.

## Useful verification paths

- `pnpm --filter @realmfall/ui test:jsdom`
- `pnpm --filter @realmfall/client test:jsdom`
- `pnpm lint`
- `pnpm typecheck`
