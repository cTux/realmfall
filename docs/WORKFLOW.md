# WORKFLOW

Use this file for contributor process only. Canonical project guidance lives in
`docs/RULES.md` and the scoped files under `docs/rules/`.

## Before Coding

- Load `docs/RULES.md`, then only the scoped rule files that match the task.
- Treat `docs/WORKFLOW.md` and `docs/PROJECT_REVIEW.md` as supporting references, not canonical policy sources.
- Use Node `v25` from `.nvmrc` for local commands and automation.

## Commit Workflow

- Use Conventional Commits.
- Before each commit, bump the patch version in `package.json`. The pre-commit hook enforces this against `HEAD`.
- Generate commit messages from the actual change set.
- Keep commit messages focused on the behavioral change instead of enumerating every touched doc file.
- Use `pnpm git:prune-gone-branches -- --dry-run` to preview local branches whose tracked remote ref was deleted, then rerun without `--dry-run` to remove them. Add `-- --safe` only when you want Git to keep its merged-branch protection.
- Use `pnpm git:rebase-master-and-push` from a clean, already-committed feature branch when you need to replay it onto `origin/master` and publish the rewritten branch. The script auto-resolves `package.json` version conflicts by carrying this branch's patch-version increments onto the incoming version, then fetches the remote branch before `--force-with-lease`.

## Verification Workflow

- Run `pnpm typecheck` and the relevant tests for the changed area before committing.
- Pin GitHub Actions to immutable commit SHAs in workflow files instead of mutable version tags.
- Keep contributor scripts shell-safe on Windows. Do not pass staged paths or other user-controlled arguments through `cmd.exe` when invoking repository tooling.
- Keep scheduled dependency automation on the repo-pinned package-manager version and use read-only audit commands there instead of mutating dependency trees inside the job.
- Keep GitHub Actions least-privilege by default. Declare explicit workflow permissions and prefer reviewed repository scripts or the GitHub CLI over third-party PR automation for write-capable jobs.
- Keep read-only CI workflows explicitly read-only. Jobs that only build, lint, or test should declare `contents: read` and keep checkout credentials disabled.
- Fetch the remote branch before any workflow uses `git push --force-with-lease` against a reusable automation branch, so the lease compares against current remote state instead of missing local tracking data.
- `pnpm test` stores reusable Vitest results in `.tests/vitest-cache`; delete that directory when you need a cold run to verify cache behavior or rule out stale local state.
- Use `pnpm test:memory:leaks` when a change could affect client-side route cleanup, event-listener teardown, or long-lived browser objects; the command starts the HTTPS dev server at `https://localhost:5173`, runs the dock-window toggle `fuite` scenario, and records the latest JSON report under `.tests/memory-leaks/latest.json`.
- Run `pnpm build:budget` when startup chunks or lazy-loading strategy change.
- When performance-sensitive behavior changes, record how rerender breadth, redraw breadth, hover hot paths, or startup chunk impact were verified.

## Save Format

- During the current project phase, do not add backward save-format compatibility code.
- After major save-shape changes, clear local storage instead of preserving older save payloads through migration logic.

## Documentation Workflow

- Update the matching spec in `docs/specs` whenever a shipped behavior or technical solution changes.
- Keep transient plans, review snapshots, and checklists outside `docs/specs`.
- Before finalizing review findings or improvement descriptions, remove the word `still` and rewrite the sentence in direct present-tense terms so the wording does not age into stale guidance after later fixes.
- Prefer short references back to `docs/RULES.md` and `docs/rules/` over restating long policy lists here.
