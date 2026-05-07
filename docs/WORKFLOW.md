# WORKFLOW

Use this file for contributor process only. Canonical project guidance lives in
`docs/RULES.md` and the scoped files under `docs/rules/`.

## Before Coding

- Load `docs/RULES.md`, then only the scoped rule files that match the task.
- Pull `docs/WORKFLOW.md`, `docs/PROJECT_REVIEW.md`, package READMEs, or lore docs only when the scoped rules or current task need them.
- Use Node `v25.9.0` from `.nvmrc` for local commands and automation.
- Check [`docs/realmfall-skills.md`](./realmfall-skills.md) before choosing a workflow-routing specialist skill.
- Check the matching package README when the task is scoped to `packages/client`, `packages/server`, `packages/common`, or `packages/ui`.

## Daily Loop

1. Inspect the current worktree and load the matching rules and specs.
1. Make the smallest correct change for the task.
1. Update the matching spec and any recurring rules before considering the task complete.
1. Run the narrowest relevant verification commands for the changed area.
1. Record any verification gaps before finishing.

## Command Index

- Use Conventional Commits.
- Use `pnpm git:commit -- -m "<message>"` for routine commits. It increments the `package.json` patch version, stages that bump, then delegates to `git commit` through the repository helper.
- Use `pnpm git:deploy` from a clean tracked worktree to build the app with the GitHub Pages base path and publish `dist/` to `origin/gh-pages`. Configure GitHub Pages to serve the `gh-pages` branch from `/`.
- Use `pnpm git:prune-gone-branches -- --dry-run` to preview local branches whose tracked remote ref was deleted, then rerun without `--dry-run` to remove them. Add `-- --safe` only when you want Git to keep its merged-branch protection.
- Use `pnpm git:rebase-master-and-push` from a clean, already-committed feature branch when you need to replay it onto the default branch advertised by `origin/HEAD` and publish the rewritten branch. The script auto-resolves `package.json` version conflicts when they occur, refuses to rewrite the current remote default branch directly, and then fetches the remote branch before `--force-with-lease`.
- Run targeted tests and any area-specific commands during development when they help you iterate. Prefer `pnpm test:node` for client gameplay, persistence, i18n, and script coverage, and `pnpm test:jsdom` for shared UI plus client React, Pixi, and other browser-surface coverage.
- Use `pnpm typecheck` for the shared workspace typecheck path across `packages/common`, `packages/server`, `packages/ui`, and `packages/client`.
- Use `pnpm lint` for the shared workspace lint path across `packages/common`, `packages/server`, `packages/ui`, and `packages/client`.
- Use `pnpm build` for the shared workspace build path across `packages/common`, `packages/server`, `packages/ui`, and `packages/client`.
- Use `pnpm test` for the shared server-plus-client automated test path, with the client side running the full Vitest matrix through `test:all`.
- If the active pre-commit hook already covers the gates needed for the current change, commit without rerunning those same checks immediately beforehand.
- Run `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build:budget:strict` before committing only when you bypass hooks, when you need to verify the full commit-validation path manually, or when you are debugging a hook failure.
- Use `pnpm dev:server`, `pnpm build:server`, and `pnpm start:server` for the server package lifecycle.
- Use `pnpm update:check` to inspect available dependency updates without modifying the worktree.
- Run `pnpm update:minor` or `pnpm update:major` from a clean tracked worktree when you want an automated dependency refresh. Pass `-- --no-commit` when automation needs the refreshed manifests without creating a local commit.
- Run `pnpm format` when you need the repository-wide Prettier check path.
- Run `pnpm build:budget` when startup chunks or lazy-loading strategy change. The command reports the tracked envelope and warns on overruns without failing the build.
- Run `pnpm build:budget:strict` when a budget overrun must fail local or CI validation.
- Run `pnpm build:duplicate-deps` only when auditing dependency duplication. The duplicate-deps plugin is intentionally kept off the normal build path so routine builds stay focused on budget and correctness signals.
- Run `pnpm build:visualize` when you need an interactive bundle treemap audit. The command writes `.tests/bundle/visualizer.html` and keeps the visualizer plugin off the normal build path.
- Use `?perf=1` or `localStorage["realmfall:perf"] = "1"` during manual browser checks when you need `window.__REALMFALL_PERF__.snapshot()`.

## Documentation Workflow

- Update the matching spec in `docs/specs` whenever a shipped behavior or technical solution changes.
- Keep transient plans, review snapshots, and checklists in `docs/implementation-notes`, not `docs/specs`.
- When the shared AI instruction entrypoint wording changes, run `pnpm sync:ai-entrypoints` instead of hand-editing `AGENTS.md`, `CLAUDE.md`, and `.github/copilot-instructions.md` separately.
- When Serena is used locally, commit only `.serena/project.yml`; keep `.serena/project.local.yml`, `.serena/memories/`, caches, and other local Serena artifacts ignored unless a task explicitly needs a shared Serena memory file.
- Collapse shipped or historical implementation-note workspaces back to a short `brief.md` with canonical links.
- For hook policy, CI scope, wording hygiene, and generated-entrypoint rules, defer to `docs/rules/60-testing.md`, `docs/rules/61-documentation.md`, and the matching technical-solution specs.
