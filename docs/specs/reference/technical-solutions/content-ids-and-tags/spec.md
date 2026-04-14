# Content Ids And Tags

## Scope

This spec covers canonical type ids and gameplay tags for item configs, enemy configs, status effects, and their hydrated runtime entities.

## Current Solution

- `src/game/content/ids.ts` provides enum-backed canonical ids for item types, enemy types, and status effects.
- Every configured item type uses its stable enum-backed `key` as the canonical item type id.
- Every configured enemy type defines a stable enum-backed `id` separate from its localized display name.
- Every status effect id resolves through a shared enum-backed status-effect definition registry.
- `src/game/content/tags.ts` provides enum-backed gameplay tags plus grouped lookup objects for ergonomic usage.
- Configured items and enemies hydrate with tag arrays derived from their canonical definitions.
- Runtime item instances, enemy instances, and player status effects carry hydrated tags so gameplay logic can branch on ids or tags instead of localized labels.
- Inventory, crafting, loot, enemy classification, icon selection, and status-effect presentation now prefer canonical ids and tags over display-name matching.
- Save normalization backfills missing item keys, enemy type ids, enemy tags, and status-effect tags for older saves.

## Main Implementation Areas

- `src/game/content/tags.ts`
- `src/game/content/items/index.ts`
- `src/game/content/enemies`
- `src/game/content/statusEffects.ts`
- `src/game/inventory.ts`
- `src/game/crafting.ts`
- `src/game/state.ts`
- `src/app/normalize.ts`
