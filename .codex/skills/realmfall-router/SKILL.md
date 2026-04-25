---
name: realmfall-router
description: Route a request to the most appropriate Realmfall companion skill before execution.
metadata:
  short-description: Choose the right Realmfall skill by task intent.
---

# Realmfall Router

Use this skill when a task arrives and you need to choose the best specialized Realmfall companion skill before doing work.

## Trigger

- broad task intake
- multi-domain work (e.g., code + docs + performance)
- any request where it is unclear whether to use `realmfall-dev`, `realmfall-review`, `realmfall-pixi`, `realmfall-quality`, `realmfall-devops`, or `realmfall-story`.

## Canonical load order

1. `docs/RULES.md`
2. `docs/rules/00-general.md`
3. Supporting references as needed from the destination skill:
   - `docs/WORKFLOW.md`
   - `docs/PROJECT_REVIEW.md`
   - `docs/lore/REALMFALL.md`

## Routing map

Route to `realmfall-dev` when:
- implementation/refactor/edit tasks in `src`, scripts, or config
- UI/game behavior changes outside deep Pixi loops

Route to `realmfall-review` when:
- explicit request for code review
- bug-risk audit
- regression/edge-case scan

Route to `realmfall-pixi` when:
- Pixi rendering, interaction, hover path, frame-time, or invalidation work

Route to `realmfall-quality` when:
- validation strategy, testing scope, lint/typecheck/build budget planning
- commit-readiness checks

Route to `realmfall-devops` when:
- deploy, branch operations, version bumps, update scripts, release workflow

Route to `realmfall-story` when:
- lore, world content, names/IDs, events/items/factions/locations, narrative text

## Escalation rule

If a single request clearly spans multiple domains, route first to `realmfall-dev` for implementation, then apply the most relevant secondary skill for validation and review.
