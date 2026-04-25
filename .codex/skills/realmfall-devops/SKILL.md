---
name: realmfall-devops
description: Use for GitHub Pages deploy flow, branch operations, git workflow, and release-adjacent maintenance.
metadata:
  short-description: Realmfall deployment and git process workflow
---

# Realmfall DevOps

Use this skill for deployment, branch maintenance, and git-process tasks in this repository.

## Trigger

- `pnpm git:deploy`
- branch cleanup/rebase workflows
- release prep and version-related operations
- dependency refresh or maintenance command planning

## Rules to load first

- `docs/RULES.md`
- `docs/rules/00-general.md`
- `docs/rules/60-testing.md` (when release touches validation expectations)
- `docs/rules/61-documentation.md` (when docs/entrypoint behavior changes)
- Supporting reference: `docs/WORKFLOW.md`

## Canonical commands

- `pnpm git:commit -- -m "<message>"`
- `pnpm git:deploy`
- `pnpm git:prune-gone-branches -- --dry-run`
- `pnpm git:prune-gone-branches`
- `pnpm git:rebase-master-and-push`
- `pnpm update:check`
- `pnpm update:minor`
- `pnpm update:major`

## Constraints

- Use `pnpm` only for repo automation.
- Follow commit workflow and pre-commit expectations in `docs/WORKFLOW.md`.
- Keep package-lock-style metadata aligned and avoid unrelated staged changes during release bumps.
