# WORKFLOW

Use this file for contributor process only. Canonical project guidance lives in
`docs/RULES.md` and the scoped files under `docs/rules/`.

## Before Coding

- Load `docs/RULES.md`, then only the scoped rule files that match the task.
- Pull `docs/WORKFLOW.md`, `docs/PROJECT_REVIEW.md`, package READMEs, or lore docs only when the scoped rules or current task need them.
- Use Node `v25.9.0` from `.nvmrc` for local commands and automation.
- Check [`docs/realmfall-skills.md`](./realmfall-skills.md) before choosing a workflow-routing specialist skill.
- Keep repo-native skills in committed `.codex/skills/`; do not commit raw `skills.sh` project-install output under `.agents/skills/`.
- Check the matching package README when the task is scoped to `packages/client`, `packages/server-world`, `packages/common`, or `packages/ui`.
- Keep shared dependency versions in `pnpm-workspace.yaml` and keep each direct dependency declaration in the owning package manifest, using `catalog:` when multiple packages share the same version.

## Daily Loop

1. Inspect the current worktree and load the matching rules and specs.
1. Make the smallest correct change for the task.
1. Update the matching spec and any recurring rules before considering the task complete.
1. Run the narrowest relevant verification commands for the changed area.
1. Record any verification gaps before finishing.

## Sub-Agent Handoffs

- Before delegating implementation, define the goal, owned files or modules, preserved behaviors and non-regression requirements, acceptance criteria, required verification, and the escalation condition for broader shared-behavior changes or missing context.
- Use the default `gpt-5.3-codex-spark` implementation path only for bounded mechanical tasks. Tighten the handoff first, or keep the work on the main thread or a stronger implementation model, when the task touches shared rendering, cross-cutting UI behavior, or other regression-sensitive code.

## Command Index

- Use Conventional Commits.
- Run targeted tests and any area-specific commands during development when they help you iterate. Prefer `pnpm test:node` for client gameplay, persistence, i18n, and script coverage, and `pnpm test:jsdom` for shared UI plus client React, Pixi, and other browser-surface coverage.
- Use `pnpm typecheck` for the shared workspace typecheck path across `packages/common`, `packages/server-world`, `packages/ui`, and `packages/client`.
- Use `pnpm lint` for the shared workspace lint path across `packages/common`, `packages/server-world`, `packages/ui`, and `packages/client`.
- Use `pnpm build` for the shared workspace build path across `packages/common`, `packages/server-world`, `packages/ui`, and `packages/client`.
- Use `pnpm test` for the shared server-plus-client automated test path, with the client side running the full Vitest matrix through `test:all`.
- If the active pre-commit hook already covers the gates needed for the current change, commit without rerunning those same checks immediately beforehand.
- Run `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build` before committing only when you bypass hooks, when you need to verify the full commit-validation path manually, or when you are debugging a hook failure.
- When invoking Git Bash through the desktop shell tool from a PowerShell host, prefer `bash -lc '...'` so PowerShell does not consume embedded double quotes that belong to the Bash command.
- Use `?perf=1` or `localStorage["realmfall:perf"] = "1"` during manual browser checks when you need `window.__REALMFALL_PERF__.snapshot()`.

## Documentation Workflow

- Update the matching spec in `docs/specs` whenever a shipped behavior or technical solution changes.
- Keep transient plans, review snapshots, and checklists in `docs/implementation-notes`, not `docs/specs`.
- When an external skill is worth keeping, adapt the durable guidance into `.codex/skills/` and update [`docs/realmfall-skills.md`](./realmfall-skills.md) instead of committing the installer-managed `.agents/skills/` copy.
- When Serena is used locally, commit only `.serena/project.yml`; keep `.serena/project.local.yml`, `.serena/memories/`, caches, and other local Serena artifacts ignored unless a task explicitly needs a shared Serena memory file.
- If Serena is used across git worktrees, point the global `project_serena_folder_location` at a shared external folder and pre-create that target so Serena does not fall back to each worktree-local `.serena`.
- Collapse shipped or historical implementation-note workspaces back to a short `brief.md` with canonical links.
- For hook policy, CI scope, wording hygiene, and generated-entrypoint rules, defer to `docs/rules/60-testing.md`, `docs/rules/61-documentation.md`, and the matching technical-solution specs.
