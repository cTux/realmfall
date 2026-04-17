# Documentation Strategy

## Scope

This spec covers the canonical rules model and the project spec structure itself.

## Current Solution

- `docs/RULES.md` is the canonical source for project workflow and implementation guidance.
- Other markdown entrypoints should stay short and point back to that file instead of maintaining separate competing rule lists.
- `docs/specs` holds canonical implemented reference specs.
- `docs/implementation-notes` holds transient briefs, plans, research notes, issue workspaces, and checklists.
- Transient implementation-note files should not use `spec.md` naming, which is reserved for canonical shipped-reference documents under `docs/specs`.
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
