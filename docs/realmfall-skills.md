# Realmfall Codex Skills Index

Use this index to choose the right skill before a coding or planning request.

## Default entry

- `realmfall-router`: Decide which specialist skill to use when intent spans multiple areas.

## Specialist skills

- `realmfall-dev`: General implementation and refactor tasks in `src`, scripts, and configs.
- `realmfall-review`: Code review, bug-risk detection, and edge-case review.
- `realmfall-pixi`: Rendering, interaction, hover, invalidation, and frame-time work.
- `realmfall-quality`: Validation planning (`typecheck`, `lint`, tests, budgets).
- `realmfall-devops`: Deploy, branch maintenance, versioning, and release-adjacent tasks.
- `realmfall-story`: Lore/content additions and narrative consistency checks.

## Quick routing guide

- Feature implementation: `realmfall-dev` (or `realmfall-router` first).
- Performance regressions: `realmfall-pixi` (+ `realmfall-quality` after changes).
- Release or branch operations: `realmfall-devops`.
- World content edits: `realmfall-story`.
- Need a pre-merge or audit pass: `realmfall-review`.
- Need a validation plan only: `realmfall-quality`.

## Rule loading note

Each skill is scoped to load the canonical project instructions from `docs/RULES.md` and relevant files under `docs/rules/`.
