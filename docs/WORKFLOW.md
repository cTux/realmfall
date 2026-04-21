# WORKFLOW

Use this file for contributor process only. Canonical project guidance lives in
`docs/RULES.md` and the scoped files under `docs/rules/`.

## Before Coding

- Load `docs/RULES.md`, then only the scoped rule files that match the task.
- Treat `docs/WORKFLOW.md` and `docs/PROJECT_REVIEW.md` as supporting references, not canonical policy sources.
- Use Node `v25` from `.nvmrc` for local commands and automation.
- Follow the matching scoped rule file for recurring policy questions instead of expanding this file with parallel rule lists.

## Daily Loop

1. Inspect the current worktree and load the matching rules and specs.
2. Make the smallest correct change for the task.
3. Update the matching spec and any recurring rules before considering the task complete.
4. Run the relevant verification commands for the changed area.

## Commit Workflow

- Use Conventional Commits.
- Use `pnpm git:commit -- -m "<message>"` for routine commits. It bumps the patch version in `package.json` when needed, stages that file, and then runs `git commit`.
- If you commit without the helper, bump the patch version in `package.json` yourself first.
- Generate commit messages from the actual change set.
- Keep commit messages focused on the behavioral change instead of enumerating every touched doc file.
- Use `pnpm git:prune-gone-branches -- --dry-run` to preview local branches whose tracked remote ref was deleted, then rerun without `--dry-run` to remove them. Add `-- --safe` only when you want Git to keep its merged-branch protection.
- Use `pnpm git:rebase-master-and-push` from a clean, already-committed feature branch when you need to replay it onto the default branch advertised by `origin/HEAD` and publish the rewritten branch. The script auto-resolves `package.json` version conflicts by carrying this branch's patch-version increments onto the incoming version, refuses to rewrite the current remote default branch directly, and then fetches the remote branch before `--force-with-lease`.
- For pre-commit and pre-push policy details, use `docs/rules/60-testing-and-documentation.md` and the matching tooling spec instead of restating that policy here.

## Verification Workflow

- Run `pnpm typecheck`, `pnpm test`, and `pnpm build` before pushing when you bypass hooks or need to verify the pre-push path manually.
- Run targeted tests and any area-specific commands before committing.
- Use `pnpm update:check` to inspect available dependency updates without modifying the worktree.
- Run `pnpm update:minor` or `pnpm update:major` from a clean tracked worktree when you want an automated dependency refresh. Each command rewrites dependency ranges, runs `pnpm install --no-frozen-lockfile`, validates the result with `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build`, then commits through `pnpm git:commit`. Pass `-- --no-commit` when automation needs the refreshed manifests without creating a local commit.
- Run `pnpm format` after wider refactors or repository-wide cleanup so formatting drift is fixed before it spreads across unrelated commits.
- `pnpm test` stores reusable Vitest results in `.tests/vitest-cache`; delete that directory when you need a cold run to verify cache behavior or rule out stale local state.
- Use `pnpm test:memory:leaks` when a change could affect client-side route cleanup, event-listener teardown, or long-lived browser objects; the command starts the HTTPS dev server at `https://localhost:5173`, runs the dock-window toggle `fuite` scenario, and records the latest JSON report under `.tests/memory-leaks/latest.json`.
- Run `pnpm build:budget` when startup chunks or lazy-loading strategy change. The command reports the tracked envelope and warns on overruns without failing the build.
- Run `pnpm build:duplicate-deps` only when auditing dependency duplication. The duplicate-deps plugin is intentionally kept off the normal build path so routine builds stay focused on budget and correctness signals.
- When performance-sensitive behavior changes, record how rerender breadth, redraw breadth, hover hot paths, or startup chunk impact were verified.
- For recurring CI, shell-safety, and dependency-automation policy, defer to `docs/rules/60-testing-and-documentation.md`.

## Documentation Workflow

- Update the matching spec in `docs/specs` whenever a shipped behavior or technical solution changes.
- Keep transient plans, review snapshots, and checklists outside `docs/specs`.
- Keep `README.md` product-facing and concise. Put contributor workflow, rule-loading policy, and review hygiene details in `docs/RULES.md`, `docs/rules/`, or this file instead of duplicating them there.
- When the shared AI instruction entrypoint wording changes, run `pnpm sync:ai-entrypoints` instead of hand-editing `AGENTS.md`, `CLAUDE.md`, and `.github/copilot-instructions.md` separately.
- Before finalizing review findings or improvement descriptions, remove the word `still` and rewrite the sentence in direct present-tense terms so the wording does not age into stale guidance after later fixes.
- Prefer short references back to `docs/RULES.md` and `docs/rules/` over restating long policy lists here.
- Expect the pre-commit hook to format staged Prettier-supported files before staged lint, style, and test checks run.
