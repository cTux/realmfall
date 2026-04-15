# WORKFLOW

## Shared Context

- Treat `docs/RULES.md` as the canonical source of project-specific guidance.
- Load and apply only the sections relevant to the current task.
- If a prompt contains `add rule`, update `docs/RULES.md` first.
- Keep supporting AI entrypoints compact and aligned with `docs/RULES.md`.

## Review Workflow

- Review the project against current best practices for the active stack, including browser performance, React rerenders, Pixi rendering cost, structure, duplicated code, and duplicated documentation or rules.
- Split improvement recommendations by priority.
- Keep findings grounded in the current code and docs, not aspirational architecture.
- When performance-sensitive behavior changes, document how to verify rerender breadth, redraw breadth, hover hot paths, and startup chunk impact.
- Run `pnpm build:budget` when changes can affect startup chunks so the enforced `index`, `react-vendor`, and `pixi` budgets fail fast during local verification and CI.
- Do not flag Pixi startup antialiasing or full-DPR defaults during routine best-practice reviews unless the task explicitly asks for renderer quality tuning or there is measured evidence of a device-specific problem.

## Documentation Workflow

- Update `README.md` when contributor expectations, current behavior, or project constraints change.
- Keep implemented feature and technical-solution specs in `docs/specs` aligned with shipped behavior.
- Every feature or improvement task should create or update its dedicated spec before the task is considered complete.
- Every fix should update the matching spec requirement when the fix changes or clarifies documented behavior.
- Keep restrictions and hard constraints in the canonical docs that already describe the current project state instead of maintaining a separate restrictions file.
- Prefer references back to `docs/RULES.md` over duplicating long policy lists in multiple docs.

## Commit Workflow

- Use Conventional Commits.
- Increase the `package.json` patch version before each commit. The pre-commit hook enforces this against `HEAD`.
- Generate commit messages from the actual change set.
- When commit message format expectations change, update Commitlint configuration in the same task when the repository can enforce that format automatically.
- Keep commit messages focused on source changes rather than documentation-only housekeeping unless the commit is primarily documentation.
- When documentation files such as `README.md`, `docs/RULES.md`, or `docs/WORKFLOW.md` change alongside code, mention the behavioral change instead of listing every markdown file in the subject.

## Implementation Workflow

- Every fix should add or adjust tests in the same task unless the repository cannot reasonably test that path yet. If it cannot, document the gap explicitly.
- When a task changes project structure or recurring architectural expectations, update `docs/RULES.md` in the same task so future prompts inherit the new structure.
- Prefer colocated `hooks/`, `selectors/`, `utils/`, and `tests/` directories for feature-local code, and promote only truly shared modules to `src/hooks`, `src/selectors`, or `src/utils`.
- Split broad multi-export files unless they only contain tightly related types or closely related library or entity helpers.
- Keep component and test files under roughly `250` lines when practical by splitting them by concern.
- When a requested JavaScript or TypeScript syntax convention changes, update Oxlint and Prettier configuration when the convention can be enforced mechanically.
- When a requested CSS or SCSS syntax convention changes, update Stylelint configuration when the convention can be enforced mechanically.
- Keep `pnpm lint` mapped to the enforced Oxlint workflow, and keep Oxlint as the only JavaScript and TypeScript linter unless the task explicitly changes the lint toolchain.
- Every component addition, removal, or behavior-affecting UI change should add or update the corresponding Storybook story in the same task.
- The pre-commit hook should auto-fix Oxlint-managed staged JavaScript and TypeScript issues when a safe fix is available, refresh staged tracked files, and still run the remaining hook checks instead of failing only because fixable lint drift existed.
- The pre-commit hook should scope Stylelint to staged `src` CSS and SCSS files and scope Vitest to staged related source, runtime JSON content, or test files by default, while falling back to the full `pnpm test` suite when staged changes affect shared test inputs such as package metadata, lockfile state, Vite config, TypeScript config, or shared Vitest setup.
