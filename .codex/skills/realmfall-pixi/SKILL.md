---
name: realmfall-pixi
description: Use for Pixi rendering, hover/render invalidation, and frame-time sensitive optimization work.
metadata:
  short-description: Realmfall Pixi and real-time render optimization workflow
---

# Realmfall Pixi

Use this skill for tasks affecting Pixi.js rendering, hover/interaction paths, frame budget, and UI/game loop behavior.

## Trigger

- render invalidation changes
- hover/mouse path updates
- animation, particle, or scene timing tweaks
- frame-time/performance concerns

## Rules to load first

- `docs/RULES.md`
- `docs/rules/00-general.md`
- `docs/rules/40-pixi-performance.md`
- `docs/rules/50-build-and-bundle.md` (when performance-related bundle impact is likely)

## Core constraints

- Follow existing Pixi architecture and rendering patterns.
- Preserve stable frame behavior unless gameplay behavior changes are intentional.
- Keep updates minimal and localized to invalidation/render paths.

## Suggested checks

- Verify frame-time impact and interaction behavior via relevant manual perf checks documented in workflow references.
- Re-run test/lint/type checks aligned to changed code paths.
- Re-check bundle impact when render architecture changes are introduced.

## References

- `docs/WORKFLOW.md`
- `docs/rules/40-pixi-performance.md`
- `docs/lore/REALMFALL.md` (for content-adjacent map/world changes)
