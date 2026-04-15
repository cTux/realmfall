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
- Do not flag Pixi startup antialiasing or full-DPR defaults during routine best-practice reviews unless the task explicitly asks for renderer quality tuning or there is measured evidence of a device-specific problem.

## Documentation Workflow

- Update `README.md` when contributor expectations, current behavior, or project constraints change.
- Keep implemented feature and technical-solution specs in `docs/specs` aligned with shipped behavior.
- Keep restrictions and hard constraints in the canonical docs that already describe the current project state instead of maintaining a separate restrictions file.
- Prefer references back to `docs/RULES.md` over duplicating long policy lists in multiple docs.

## Commit Workflow

- Use Conventional Commits.
- Generate commit messages from the actual change set.
- Keep commit messages focused on source changes rather than documentation-only housekeeping unless the commit is primarily documentation.
- When documentation files such as `README.md`, `docs/RULES.md`, or `docs/WORKFLOW.md` change alongside code, mention the behavioral change instead of listing every markdown file in the subject.
