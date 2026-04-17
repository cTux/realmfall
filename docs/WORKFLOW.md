# WORKFLOW

Use this file for contributor process only. Canonical project guidance lives in
`docs/RULES.md` and the scoped files under `docs/rules/`.

## Before Coding

- Load `docs/RULES.md`, then only the scoped rule files that match the task.
- Treat `docs/WORKFLOW.md` and `docs/PROJECT_REVIEW.md` as supporting references, not canonical policy sources.

## Commit Workflow

- Use Conventional Commits.
- Increase the `package.json` patch version before each commit. The pre-commit hook enforces this against `HEAD`.
- Generate commit messages from the actual change set.
- Keep commit messages focused on the behavioral change instead of enumerating every touched doc file.

## Verification Workflow

- Run `pnpm typecheck` and the relevant tests for the changed area before committing.
- Run `pnpm build:budget` when startup chunks or lazy-loading strategy change.
- When performance-sensitive behavior changes, record how rerender breadth, redraw breadth, hover hot paths, or startup chunk impact were verified.

## Documentation Workflow

- Update the matching spec in `docs/specs` whenever a shipped behavior or technical solution changes.
- Keep transient plans, review snapshots, and checklists outside `docs/specs`.
- Prefer short references back to `docs/RULES.md` and `docs/rules/` over restating long policy lists here.
