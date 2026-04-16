# Items Loot And Equipment

## Scope

This spec covers item structure, generated gear, loot sources, and player equipment.

## Current Behavior

- Items are represented as structured gameplay entities with stable instance ids, canonical item type ids, typed kinds, and gameplay tags.
- Current main item families are `resource`, `consumable`, `weapon`, `armor`, and `artifact`.
- Equippable drops are now built from a base-item dictionary keyed by stable ids, while combat stats, rarity, and instance ids are rolled per dropped instance instead of being baked into the base definition.
- Stackable items consolidate in inventory when they share stack identity derived from canonical item identity.
- The player can equip gear into dedicated slots including weapon, offhand, head, shoulders, chest, bracers, hands, belt, legs, feet, rings, amulet, and cloak.
- Equipped gear modifies derived player stats such as attack, defense, and max HP.
- Equipping can swap currently equipped gear back into inventory.
- Two-handed weapons occupy the weapon slot, automatically clear the equipped offhand item back into inventory, and prevent equipping a new offhand item until the weapon is removed.
- A new game now starts with a `Town Knife` and `Settler Vest`; removed placeholder gear is not preserved through runtime display-name fallbacks.
- The equipment window presents a silhouette-backed paper-doll layout where each slot is anchored near the matching body part and equipped items reuse the same icon-card treatment shown in inventory.
- Inventory and ground-loot windows use a denser item-card treatment than the paper-doll equipment layout so larger item piles fit without pushing the window size upward.
- Tiles may spawn deterministic loot from world generation.
- Enemies can drop gold, consumables, recipe pages, home scrolls, health potions, mana potions, blood moon gear, and skinning materials depending on enemy ids and tags rather than localized names.
- Health potions and mana potions use vendored local SVG assets and restore 10% of the corresponding max stat on use.
- Loot can be taken item-by-item or collected from a tile in bulk.
- World-generated weapons, armor, offhands, and artifacts scale by terrain tier and context, including generated shoulders, bracers, belts, shields, magical offhands, and one-handed or two-handed weapon archetypes.
- Dungeon and blood moon rewards bias toward better rarity floors.
- Generated artifacts and equipment use deterministic icon selection from curated vendored SVG pools in `src/assets/icons/generated` while their per-instance stats are derived from tier and rarity.

## Main Implementation Areas

- `src/game/inventory.ts`
- `src/game/world.ts`
- `src/game/state.ts`
- `src/game/content/items`
- `src/game/content/generatedEquipment.ts`
- `src/app/normalize.ts`
