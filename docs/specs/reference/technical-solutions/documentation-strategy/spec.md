# Documentation Strategy

## Scope

This spec covers the canonical rules model and the project spec structure itself.

## Current Solution

- `docs/RULES.md` is the canonical source for project workflow and implementation guidance.
- Scoped rule files separate testing policy from documentation policy so prompt-loaded context stays narrow and task-specific.
- Other markdown entrypoints stay short and point back to canonical rules instead of maintaining competing rule lists.
- `docs/WORKFLOW.md` stays process-oriented and command-oriented, linking back to canonical rule files when contributors need recurring policy detail.
- `README.md` stays product-facing and concise, covering the current game state, the stack, quick-start commands, and references back to canonical contributor docs instead of restating the full workflow there.
- `AGENTS.md`, `CLAUDE.md`, and `.github/copilot-instructions.md` are synchronized through `pnpm sync:ai-entrypoints` so the shared loader wording does not drift across parallel copies.
- `docs/specs` holds canonical implemented reference specs.
- `docs/implementation-notes` holds transient briefs, plans, research notes, issue workspaces, and checklists while work is active.
- Documentation entrypoints such as `docs/specs/README.md` and `docs/implementation-notes/README.md` stay navigation-only and point back to the canonical rules or reference specs.
- Inactive or historical implementation-note workspaces are reduced to a short `brief.md` plus an optional checklist or archived entirely, keeping prompt-loading context small.
- When a shipped workspace keeps a `brief.md`, that file is reduced to a short historical note with links back to the canonical spec and workflow docs instead of retaining full scenario, requirement, and success-criteria templates.
- Transient implementation-note files should not use `spec.md` naming, which is reserved for canonical shipped-reference documents under `docs/specs`.
- Transient design notes use `docs/implementation-notes` workspaces rather than parallel folders such as `docs/superpowers/specs`.
- Each implemented gameplay feature and each technical solution should have its own dedicated spec file.
- Index documents are used as navigation only.

## Main Implementation Areas

- `docs/RULES.md`
- `docs/WORKFLOW.md`
- `README.md`
- `AGENTS.md`
- `CLAUDE.md`
- `.github/copilot-instructions.md`
- `docs/specs`
- `docs/implementation-notes`
