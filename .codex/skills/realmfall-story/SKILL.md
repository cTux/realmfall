---
name: realmfall-story
description: Use for lore, naming, content, NPC/place/event generation, and world-facing text consistency in Realmfall.
metadata:
  short-description: Realmfall lore and content consistency workflow
---

# Realmfall Story

Use this skill for content authoring and validation tasks tied to narrative, lore, and world-facing wording.

## Trigger

- adding/changing places, factions, enemies, items, events, structures, or flavor text
- content review for lore consistency
- content balancing discussions tied to narrative context
- migration or naming updates for gameplay data displayed to players

## Canonical loading

- `docs/RULES.md`
- `docs/lore/REALMFALL.md`
- `docs/rules/00-general.md`
- `docs/rules/20-persistence.md` (when save/serialized content changes)
- `docs/rules/61-documentation.md` (if contributor-facing docs need updates)

## Constraints

- Keep names, factions, item categories, and events aligned with `docs/lore/REALMFALL.md`.
- Prefer canonical IDs and tags over localized display-name matching for runtime content references.
- Keep existing behavior stable unless content requirements explicitly change gameplay logic.

## Suggested checks

- Verify lore-linked IDs and runtime refs when replacing/removing entities.
- Confirm related specs are updated under `docs/specs` for implemented content changes.
- Keep wording grounded in shipped behavior and current constraints.
