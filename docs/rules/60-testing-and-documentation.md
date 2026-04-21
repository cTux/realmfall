# Testing And Documentation Rules

## Testing

- Add or update tests for non-trivial gameplay, rendering math, persistence normalization, and bug-fix changes when practical.
- Every issue fix should be followed by adding or adjusting tests that cover the fixed behavior, unless the repository cannot reasonably test that path yet. In that case, document the gap explicitly.
- When a fix changes expected behavior, also update the corresponding spec requirement in the same task when the repository already documents that area.
- Favor deterministic tests for game-state changes and rendering calculations.
- Place tests in a colocated `tests/` directory for the feature or module they exercise.
- Keep test files under roughly `250` lines when practical. Split larger suites by concern instead of accumulating all coverage in one file.
- Keep production buildability in mind, not only local dev behavior.
- When performance-sensitive behavior changes, verify both correctness and the likely rerender or redraw impact.
- When optimization work changes React, Pixi, hover handling, or bundle shape, document a concrete verification path for rerender breadth, redraw breadth, hover hot paths, and startup chunk growth instead of leaving performance validation implicit.
- Keep a coverage test for Storybook parity so component additions or removals in `src/ui/components` fail fast when corresponding stories are missing.
- Keep repository automation scripts shell-safe across platforms. Do not route staged paths, generated file lists, or other user-controlled arguments through `cmd.exe` or other shells when a direct executable or Node entrypoint invocation can run the tool instead.
- Keep routine commit metadata cheap. A staged `package.json` diff that only bumps the `version` field should keep the pre-commit workflow on scoped checks instead of forcing the full Vitest suite.
- Keep contributor commit automation aligned with the versioning rule. The default commit path should auto-bump and stage `package.json` before invoking `git commit`, while preserving retry safety when the version already moved past `HEAD`.
- Keep the full-project TypeScript gate on the pre-push path rather than the pre-commit path when commit-latency improvements are the goal, and document that separation clearly in contributor workflow docs.
- Keep repository-wide `test` and `build` gates on the pre-push path when speeding up commits is more important than catching every shared-input regression before each local commit, and document that tradeoff explicitly.
- Keep scheduled dependency automation aligned with the repository toolchain. Use the repo-pinned package-manager version in CI jobs and keep audit steps read-only instead of mutating dependencies inside the workflow.
- Keep GitHub Actions least-privilege by default. Declare explicit workflow permissions, disable persisted checkout credentials unless a job needs them, and prefer reviewed repository logic or the GitHub CLI over third-party PR automation in write-capable jobs.
- Before a workflow uses `git push --force-with-lease` against a reusable branch, fetch the matching remote branch into a local remote-tracking ref inside the job so the lease checks current remote state instead of stale or missing ref data.

## Documentation

- Keep `README.md` accurate about the current game state, package manager, save behavior, quality commands, and contributor workflow.
- Keep `docs/WORKFLOW.md` aligned with the actual contributor workflow, verification steps, and commit conventions, but keep recurring policy details in `docs/RULES.md` and `docs/rules/` instead of restating them there.
- Prefer documenting real project constraints and current behavior over aspirational wording.
- In review findings, improvement notes, and project-health summaries, do not ship the word `still`. Rewrite the sentence to describe the current behavior and risk directly so the guidance remains accurate after follow-up fixes land.
- Before committing changed markdown for specs, workflow docs, or review notes, search the staged diff for standalone `still` and rewrite those sentences unless the word appears inside a source quote.
- When prompts establish recurring workflow expectations, capture them here so future prompt handling stays consistent.
- When a prompt establishes recurring structural placement rules for hooks, selectors, utilities, components, or tests, update this file and keep contributor-facing docs aligned instead of relying on one-off refactors.
- Keep rule and workflow updates synchronized across `README.md`, `docs/WORKFLOW.md`, and the AI-specific instruction files when those updates affect future prompt execution.
- Keep lore-sensitive guidance aligned with the canonical world reference in `docs/lore/REALMFALL.md`.
- Keep current-system specs under `docs/specs` for implemented gameplay features and technical solutions.
- Keep transient plans, issue workspaces, research notes, and checklists outside `docs/specs`, using `docs/implementation-notes` for that material.
- Do not name transient implementation-note artifacts `spec.md`. Reserve `spec` naming for canonical shipped-reference documents under `docs/specs`, and use names such as `brief.md`, `plan.md`, `research.md`, or `checklist.md` for transient note files.
- Keep `docs/PROJECT_REVIEW.md` as a lightweight transient note only. Do not let it become a second canonical source for workflow rules, best-practice checklists, or current-system specs.
- When a transient note captures an observation that is no longer true, update or archive it promptly instead of leaving stale warning inventories or old performance claims in active planning paths.
- Every implemented feature should be followed by creating or updating the relevant spec in `docs/specs` before the task is considered complete.
- When changing an existing feature, update the matching spec in the same task so the spec stays aligned with shipped behavior.
- Every fix should update the corresponding spec in the same task when that fix adds, removes, or clarifies a documented requirement.
- Each gameplay feature and each technical solution should have its own dedicated spec file. Do not merge multiple implemented features or multiple technical solutions into one general reference spec.
- Use index documents only as navigation over dedicated spec files, not as replacements for them.
