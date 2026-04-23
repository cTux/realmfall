# Documentation Strategy

## Scope

This spec covers the canonical rules model and the project spec structure itself.

## Current Solution

- Contributor policy is canonical in `docs/RULES.md` and the scoped rule files under `docs/rules/`, especially `docs/rules/61-documentation.md` for documentation expectations.
- Technical-solution specs stay implementation-oriented and link back to the scoped rule files when they need recurring contributor policy such as naming, verification, or workflow guidance.
- AI instruction entrypoints such as `AGENTS.md`, `CLAUDE.md`, and `.github/copilot-instructions.md` are synchronized through `pnpm sync:ai-entrypoints` and stay as thin loaders that point back to the canonical rules.
- `README.md` is product-facing, and `docs/WORKFLOW.md` is process-facing. Neither is intended to be a second source of canonical contributor policy.
- `docs/specs` holds canonical implemented reference specs.
- `docs/implementation-notes` holds transient briefs, plans, research notes, issue workspaces, and checklists while work is active. Canonical shipped behavior belongs in `docs/specs`.
- Historical implementation-note workspaces are trimmed to one short `brief.md` plus canonical links, rather than retaining full feature-template sections or checklist trees after work stops.
- Documentation entrypoints such as `docs/specs/README.md` and `docs/implementation-notes/README.md` stay navigation-only and route readers to canonical rules or reference specs.
- Transient implementation-note artifacts use names such as `brief.md`, `plan.md`, `research.md`, and `checklist.md`; `spec.md` is reserved for canonical reference documents under `docs/specs`.
- Implemented gameplay features and technical solutions each keep their own dedicated spec file under `docs/specs`, with index documents used only for navigation.

## Main Implementation Areas

- `docs/RULES.md`
- `docs/WORKFLOW.md`
- `README.md`
- `AGENTS.md`
- `CLAUDE.md`
- `.github/copilot-instructions.md`
- `docs/specs`
- `docs/implementation-notes`
