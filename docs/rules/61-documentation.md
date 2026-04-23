# Documentation Rules

## Documentation

- Keep `README.md` accurate about the current game state, package manager, and primary local commands, but keep detailed contributor workflow and rule-loading policy in canonical docs instead of duplicating them there.
- Keep `docs/WORKFLOW.md` aligned with the actual contributor workflow, verification steps, and commit conventions, but keep recurring policy details in `docs/RULES.md` and `docs/rules/` instead of restating them there.
- Keep `docs/specs/README.md`, `docs/implementation-notes/README.md`, and similar documentation entrypoints navigation-only. Point them back to `docs/RULES.md`, the scoped rule files, and the relevant canonical specs instead of duplicating workflow checklists or policy bullets there.
- Keep contributor docs aligned with the current Vitest project split, including `pnpm test`, `pnpm test:node`, and `pnpm test:jsdom`, whenever test runtime boundaries change.
- Keep `docs/WORKFLOW.md` short and process-oriented. Prefer links back to canonical rule files over repeating save-policy, CI-permission, or shell-safety rules in a second long checklist.
- Keep technical-solution specs implementation-oriented. When a spec needs to mention commands, hooks, or CI, describe the shipped toolchain behavior and link back to `docs/WORKFLOW.md` or the scoped rule files for contributor policy instead of duplicating full operational checklists.
- Keep `docs/specs/reference/technical-solutions/documentation-strategy/spec.md` focused on documentation-system structure, file roles, and lifecycle boundaries. Link back to `docs/RULES.md` and this file for contributor policy instead of copying those rule lists into the spec.
- Prefer documenting real project constraints and current behavior over aspirational wording.
- In review findings, improvement notes, and project-health summaries, avoid unresolved continuation wording. Rewrite the sentence to describe the current behavior and risk directly so the guidance remains accurate after follow-up fixes land.
- Before committing changed markdown for specs, workflow docs, or review notes, search the staged diff for unresolved continuation wording and rewrite those sentences unless the term appears inside a source quote.
- When prompts establish recurring workflow expectations, capture them here so future prompt handling stays consistent.
- When a prompt establishes recurring structural placement rules for hooks, selectors, utilities, components, or tests, update this file and keep contributor-facing docs aligned instead of relying on one-off refactors.
- Keep rule and workflow updates synchronized across `README.md`, `docs/WORKFLOW.md`, and the AI-specific instruction files when those updates affect future prompt execution.
- Keep `AGENTS.md`, `CLAUDE.md`, and `.github/copilot-instructions.md` generated from one shared sync path. When their shared wording changes, update the generator and rerun it instead of hand-maintaining parallel copies.
- Keep lore-sensitive guidance aligned with the canonical world reference in `docs/lore/REALMFALL.md`.
- Keep current-system specs under `docs/specs` for implemented gameplay features and technical solutions.
- Keep transient plans, issue workspaces, research notes, and checklists outside `docs/specs`, using `docs/implementation-notes` for that material.
- Keep transient design briefs out of parallel trees such as `docs/superpowers/specs`. Move them into an issue or improvement workspace under `docs/implementation-notes`.
- Do not name transient implementation-note artifacts `spec.md`. Reserve `spec` naming for canonical shipped-reference documents under `docs/specs`, and use names such as `brief.md`, `plan.md`, `research.md`, or `checklist.md` for transient note files.
- Keep `docs/PROJECT_REVIEW.md` as a lightweight transient note only. Do not let it become a second canonical source for workflow rules, best-practice checklists, or current-system specs.
- When a transient note captures an observation that is no longer true, update or archive it promptly instead of leaving stale warning inventories or old performance claims in active planning paths.
- When an implementation-note workspace is no longer an active plan, delete `plan.md` and other long-form planning artifacts, keep only `brief.md` plus an optional checklist, or archive it instead of keeping old plan, research, quickstart, and data-model trees alive indefinitely.
- Once an implementation-note workspace is shipped, trim any surviving `brief.md` down to a short historical note plus links back to the canonical spec and workflow docs. Do not keep full user-story, requirement, and success-criteria templates in active prompt-loading paths after the feature is implemented.
- Do not leave inactive implementation-note workspaces carrying stale dependency versions, outdated spec paths, or other durable project facts after those details move into `docs/specs` or the scoped rule files.
- Every implemented feature should be followed by creating or updating the relevant spec in `docs/specs` before the task is considered complete.
- When changing an existing feature, update the matching spec in the same task so the spec stays aligned with shipped behavior.
- Every fix should update the corresponding spec in the same task when that fix adds, removes, or clarifies a documented requirement.
- Each gameplay feature and each technical solution should have its own dedicated spec file. Do not merge multiple implemented features or multiple technical solutions into one general reference spec.
- Use index documents only as navigation over dedicated spec files, not as replacements for them.
