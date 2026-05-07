# Documentation Strategy

## Scope

This spec covers the canonical rules model and the project spec structure itself.

## Current Solution

- Contributor policy is canonical in `docs/RULES.md` and the scoped rule files under `docs/rules/`, especially `docs/rules/61-documentation.md` for documentation expectations.
- The always-loaded general rules carry repo-wide defaults for delegated implementation handoffs, while `docs/WORKFLOW.md` keeps only a short process summary and points back to the canonical rule files for the full policy.
- Technical-solution specs stay implementation-oriented and link back to the scoped rule files when they need recurring contributor policy such as naming, verification, or workflow guidance.
- Serena project configuration is treated as repository-owned only at `.serena/project.yml`; local Serena overrides, memories, caches, and other runtime artifacts remain ignored unless a task explicitly introduces a shared Serena memory file, and worktree-shared Serena data is kept in an external folder configured through the user's global Serena settings.
- `README.md` is product-facing, and `docs/WORKFLOW.md` is a process-facing command index. Neither is intended to be a second source of canonical contributor policy.
- `docs/specs` holds canonical implemented reference specs.
- `docs/implementation-notes` holds transient briefs, plans, research notes, issue workspaces, and checklists while work is active. Canonical shipped behavior belongs in `docs/specs`.
- Historical or shipped implementation-note workspaces are trimmed to one short `brief.md` plus canonical links, and long `plan.md` files are deleted once the workspace stops being active.
- Documentation entrypoints such as `docs/specs/README.md` and `docs/implementation-notes/README.md` stay navigation-only and route readers to canonical rules or reference specs.
- `AGENTS.md`, `CLAUDE.md`, and `.github/copilot-instructions.md` remain generated thin loaders from `scripts/sync-ai-entrypoints.mjs`, so recurring delegation policy lives in the canonical rules instead of being hand-maintained in each entrypoint.
- Transient implementation-note artifacts use names such as `brief.md`, `plan.md`, `research.md`, and `checklist.md`; `spec.md` is reserved for canonical reference documents under `docs/specs`.
- Parallel transient-doc trees do not stay in the live `docs/` path after retirement; their content belongs in `docs/implementation-notes`, and the retired tree is deleted.
- Implemented gameplay features and technical solutions each keep their own dedicated spec file under `docs/specs`, with index documents used only for navigation.

## Main Implementation Areas

- `docs/RULES.md`
- `docs/rules/00-general.md`
- `docs/rules/61-documentation.md`
- `docs/WORKFLOW.md`
- `README.md`
- `AGENTS.md`
- `CLAUDE.md`
- `.github/copilot-instructions.md`
- `scripts/sync-ai-entrypoints.mjs`
- `docs/specs`
- `docs/implementation-notes`
