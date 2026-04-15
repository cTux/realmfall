# Items Loot And Equipment

## Scope

This spec covers item structure, generated gear, loot sources, and player equipment.

## Current Behavior

- Items are represented as structured gameplay entities with stable instance ids, canonical item type ids, typed kinds, and gameplay tags.
- Current main item families are `resource`, `consumable`, `weapon`, `armor`, and `artifact`.
- Stackable items consolidate in inventory when they share stack identity derived from canonical item identity.
- The player can equip gear into dedicated slots including weapon, offhand, armor slots, and artifact slots.
- Equipped gear modifies derived player stats such as attack, defense, and max HP.
- Equipping can swap currently equipped gear back into inventory.
- The equipment window presents a silhouette-backed paper-doll layout where each slot is anchored near the matching body part and equipped items reuse the same icon-card treatment shown in inventory.
- Tiles may spawn deterministic loot from world generation.
- Enemies can drop gold, consumables, recipe pages, home scrolls, blood moon gear, and skinning materials depending on enemy ids and tags rather than localized names.
- Loot can be taken item-by-item or collected from a tile in bulk.
- World-generated weapons, armor, offhands, and artifacts scale by terrain tier and context.
- Dungeon and blood moon rewards bias toward better rarity floors.
- Generated artifacts and equipment use deterministic naming and stat generation.

## Main Implementation Areas

- `src/game/inventory.ts`
- `src/game/world.ts`
- `src/game/state.ts`
- `src/game/content/items`
