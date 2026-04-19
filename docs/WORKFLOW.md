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

## Verification Workflow

- Run `pnpm typecheck` and the relevant tests for the changed area before committing.
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
- Write review findings and improvement descriptions in direct present-tense terms instead of comparative filler such as `still`, so the wording does not age into stale guidance after later fixes.
- Prefer short references back to `docs/RULES.md` and `docs/rules/` over restating long policy lists here.
