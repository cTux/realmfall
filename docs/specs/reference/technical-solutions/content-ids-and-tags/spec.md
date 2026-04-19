# Content Ids And Tags

## Scope

This spec covers canonical type ids and gameplay tags for item configs, enemy configs, status effects, abilities, professions, structures, equipment slots, and their hydrated runtime entities or tooltip-facing definitions.

## Current Solution

- `src/game/content/ids.ts` provides enum-backed canonical ids for item types, enemy types, status effects, and equipment slots.
- Every configured item type uses its stable enum-backed `key` as the canonical item type id.
- Item configs and runtime items no longer store a separate `kind`; item behavior is derived from canonical ids, equipment slots, and hydrated tags instead.
- Gathering structures keep canonical `rewardItemKey` values separate from localized reward labels so harvesting never derives item ids from display text.
- Equippable items use the shared equipment-slot enum instead of raw slot strings in content definitions and generator paths.
- Every configured enemy type defines a stable enum-backed `id` separate from its localized display name.
- Every status effect id resolves through a shared enum-backed status-effect definition registry.
- `src/game/content/tags.ts` provides enum-backed gameplay tags plus grouped lookup objects for ergonomic usage.
- Configured items, enemies, and structures hydrate with tag arrays derived from their canonical definitions.
- Equippable items also receive slot-specific tags derived from the shared equipment-slot enum, such as `item.slot.weapon` and `item.slot.head`.
- Skills use the shared `Skill` enum instead of raw string ids so progression, structures, recipes, normalization, and UI all reference the same canonical identifiers.
- Runtime item instances, enemy instances, and player status effects carry hydrated tags so gameplay logic can branch on ids or tags instead of localized labels.
- Ability definitions and profession skill lookups expose enum-backed tags through shared helpers instead of ad hoc UI strings.
- Inventory, crafting, loot, enemy classification, icon selection, and status-effect presentation resolve configured content from canonical ids and tags instead of display-name matching.
- Tooltip surfaces for items, resources, enemies, buffs, debuffs, abilities, professions, and structures render shared tag lines from those canonical definitions.
- Persisted runtime entities now load as-is; older save payloads are not backfilled with missing ids or tags during hydration.

## Main Implementation Areas

- `src/game/content/tags.ts`
- `src/game/content/items/index.ts`
- `src/game/content/enemies`
- `src/game/content/statusEffects.ts`
- `src/game/content/structures`
- `src/game/inventory.ts`
- `src/game/crafting.ts`
- `src/game/combat.ts`
- `src/game/state.ts`
- `src/app/normalize.ts`
- `src/ui/tooltips.ts`
