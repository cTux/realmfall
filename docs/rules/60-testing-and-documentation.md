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

## Documentation

- Keep `README.md` accurate about the current game state, package manager, save behavior, quality commands, and contributor workflow.
- Keep `docs/WORKFLOW.md` aligned with the actual contributor workflow, verification steps, and commit conventions, but keep recurring policy details in `docs/RULES.md` and `docs/rules/` instead of restating them there.
- Prefer documenting real project constraints and current behavior over aspirational wording.
- In review findings, improvement notes, and project-health summaries, do not ship the word `still`. Rewrite the sentence to describe the current behavior and risk directly so the guidance remains accurate after follow-up fixes land.
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
