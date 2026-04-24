# WORKFLOW

Use this file for contributor process only. Canonical project guidance lives in
`docs/RULES.md` and the scoped files under `docs/rules/`.

## Before Coding

- Load `docs/RULES.md`, then only the scoped rule files that match the task.
- Treat `docs/WORKFLOW.md` and `docs/PROJECT_REVIEW.md` as supporting references, not canonical policy sources.
- Use Node `v25.9.0` from `.nvmrc` for local commands and automation.
- Follow the matching scoped rule file for recurring policy questions instead of expanding this file with parallel rule lists.

## Daily Loop

1. Inspect the current worktree and load the matching rules and specs.
2. Make the smallest correct change for the task.
3. Update the matching spec and any recurring rules before considering the task complete.
4. Run the relevant verification commands for the changed area.

## Commit Workflow

- Use Conventional Commits.
- Use `pnpm git:commit -- -m "<message>"` for routine commits. It increments the `package.json` patch version, stages that bump, then delegates to `git commit` through the repository helper.
- Plain `git commit` also runs the patch-version bump through the Husky pre-commit hook. Stage or stash unrelated `package.json` edits first, because the bump refuses to run when that file has unstaged changes.
- The Husky pre-commit hook now runs both the staged-file checks and the repository-wide validation path (`typecheck`, `lint`, `test`, and `build:budget:strict`). The pre-push hook intentionally does nothing.
- Generate commit messages from the actual change set.
- Keep commit messages focused on the behavioral change instead of enumerating every touched doc file.
- Use `pnpm git:deploy` from a clean tracked worktree to build the app with the GitHub Pages base path and publish `dist/` to `origin/gh-pages`. Configure GitHub Pages to serve the `gh-pages` branch from `/`.
- Use `pnpm git:prune-gone-branches -- --dry-run` to preview local branches whose tracked remote ref was deleted, then rerun without `--dry-run` to remove them. Add `-- --safe` only when you want Git to keep its merged-branch protection.
- Use `pnpm git:rebase-master-and-push` from a clean, already-committed feature branch when you need to replay it onto the default branch advertised by `origin/HEAD` and publish the rewritten branch. The script auto-resolves `package.json` version conflicts when they occur, refuses to rewrite the current remote default branch directly, and then fetches the remote branch before `--force-with-lease`.
- For hook behavior, staged-quality scope, and commit-time repository validation policy, use `docs/rules/60-testing.md` and the testing-tooling spec instead of repeating those details here.

## Verification Workflow

- Run targeted tests and any area-specific commands before committing. Prefer `pnpm test:node` for gameplay, persistence, i18n, and script coverage, and `pnpm test:jsdom` for React, Pixi, and browser-surface coverage.
- Run `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build:budget:strict` before committing when you bypass hooks or need to verify the full commit-validation path manually.
- Use `pnpm update:check` to inspect available dependency updates without modifying the worktree.
- Run `pnpm update:minor` or `pnpm update:major` from a clean tracked worktree when you want an automated dependency refresh. Pass `-- --no-commit` when automation needs the refreshed manifests without creating a local commit.
- Run `pnpm format` after wider refactors or repository-wide cleanup so formatting drift is fixed before it spreads across unrelated commits.
- Use `pnpm test:memory:leaks` when a change could affect client-side route cleanup, event-listener teardown, or long-lived browser objects; the command starts the HTTPS dev server at `https://localhost:5173`, runs the dock-window toggle `fuite` scenario, and records the latest JSON report under `.tests/memory-leaks/latest.json`.
- Use `?perf=1` or `localStorage["realmfall:perf"] = "1"` during manual browser checks when React commit breadth, Pixi render-pass counters, startup marks, long tasks, or long animation frames need to be captured from `window.__REALMFALL_PERF__.snapshot()`.
- Run `pnpm build:budget` when startup chunks or lazy-loading strategy change. The command reports the tracked envelope and warns on overruns without failing the build.
- Run `pnpm build:budget:strict` or `REALMFALL_BUNDLE_BUDGET_STRICT=1 node scripts/check-bundle-budget.mjs` when a budget overrun must fail local or CI validation.
- Run `pnpm build:duplicate-deps` only when auditing dependency duplication. The duplicate-deps plugin is intentionally kept off the normal build path so routine builds stay focused on budget and correctness signals.
- Run `pnpm build:visualize` when you need an interactive bundle treemap audit. The command writes `.tests/bundle/visualizer.html` and keeps the visualizer plugin off the normal build path.
- When performance-sensitive behavior changes, record how rerender breadth, redraw breadth, hover hot paths, or startup chunk impact were verified.
- For recurring CI, shell-safety, dependency-refresh behavior, and command-scope details, defer to `docs/rules/60-testing.md` and `docs/specs/reference/technical-solutions/testing-and-quality-tooling/spec.md`.

## Documentation Workflow

- Update the matching spec in `docs/specs` whenever a shipped behavior or technical solution changes.
- Keep transient plans, review snapshots, and checklists outside `docs/specs`.
- Keep `README.md` product-facing and concise. Put contributor workflow, rule-loading policy, and review hygiene details in `docs/RULES.md`, `docs/rules/`, or this file instead of duplicating them there.
- When the shared AI instruction entrypoint wording changes, run `pnpm sync:ai-entrypoints` instead of hand-editing `AGENTS.md`, `CLAUDE.md`, and `.github/copilot-instructions.md` separately.
- Prefer short references back to `docs/RULES.md` and `docs/rules/` over restating long policy lists here.
- For wording hygiene, spec-update expectations, and sync rules for generated AI instruction files, defer to `docs/rules/61-documentation.md`.
