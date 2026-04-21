# Items Loot And Equipment

## Scope

This spec covers item structure, generated gear, loot sources, and player equipment.

## Current Behavior

- Items are represented as structured gameplay entities with stable instance ids, canonical item type ids, typed kinds, and gameplay tags.
- Current main item families are `resource`, `consumable`, `weapon`, `armor`, and `artifact`.
- Resource items now include raw ores plus smelted ingots, with metal gear recipes consuming ingots instead of raw ore or chunks.
- Equippable drops are now built from a base-item dictionary keyed by stable ids, while combat stats, rarity, and instance ids are rolled per dropped instance instead of being baked into the base definition.
- Stackable items consolidate in inventory when they share stack identity derived from canonical item identity.
- The player can equip gear into dedicated slots including weapon, offhand, head, shoulders, chest, bracers, hands, belt, legs, feet, rings, amulet, and cloak.
- Equipped gear modifies derived player stats such as attack, defense, and max HP.
- Item tiers are capped at `100`.
- Enabled equippable main-stat channels now scale from `+1` at item level `1` to `+1000` at item level `100`.
- Chance-based generated secondary stat rolls now scale from `+1%` at item level `1` to `+10%` at item level `100`.
- Non-chance generated secondary stat rolls now scale from `+1` at item level `1` to `+10` at item level `100`.
- Battle resolution respects equippable main stats and combat-facing secondary stats, including attack speed, critical strikes, lifesteal, dodge, block, damage suppression, debuff suppression, and status or self-buff proc chances from equipped gear.
- Gear-derived secondary bonuses now cap at `75%`, while raw totals are preserved for overcap display in the hero window.
- Equipping can swap currently equipped gear back into inventory.
- Two-handed weapons occupy the weapon slot, automatically clear the equipped offhand item back into inventory, and prevent equipping a new offhand item until the weapon is removed.
- A new game now starts with a `Town Knife` and `Settler Vest`; removed placeholder gear is not preserved through runtime display-name fallbacks.
- The equipment window presents a silhouette-backed paper-doll layout where each slot is anchored near the matching body part and equipped items reuse the same icon-card treatment shown in inventory.
- Inventory and ground-loot windows use a denser item-card treatment than the paper-doll equipment layout, with compact slots at roughly 60% of the prior compact footprint and icons sized to 90% of the slot box so larger item piles fit without pushing the window size upward.
- Tiles may spawn deterministic loot from world generation.
- Enemies can drop gold, consumables, recipe pages, home scrolls, health potions, mana potions, blood moon gear, meat, and skinning materials depending on enemy ids and tags rather than localized names.
- Food consumables restore HP and MP by percentage instead of flat values, using the item's healing rating as the restore percent with a minimum of `10%` for each resource while hunger and thirst remain flat restores.
- Health potions and mana potions use vendored local SVG assets and restore `35%` of the corresponding max stat on use.
- Consumables share a single `2s` cooldown lockout, and Home Scroll usage also starts that same shared consumable cooldown.
- Loot can be taken item-by-item or collected from a tile in bulk.
- World-generated weapons, armor, offhands, and artifacts scale by terrain tier and context, including generated shoulders, bracers, belts, shields, magical offhands, and one-handed or two-handed weapon archetypes.
- World loot and blood moon bonus gear now choose their top-level item family from equal random buckets instead of weighted family chances, so weapons, armor, offhands, artifacts, and consumables do not skew toward accessory-heavy drops.
- Offhand shields and magical spheres always include a block-chance secondary stat, including both generated drops and fixed crafted icon variants.
- Dungeon and blood moon rewards bias toward better rarity floors.
- Generated artifacts and equipment use deterministic icon selection from curated vendored SVG pools in `src/assets/icons/generated` while their per-instance stats are derived from tier and rarity.
- Generated artifacts and equipment use the shared cascading rarity-event mechanism so higher tiers can promote drops through the same rarity ladder used elsewhere in gameplay.
- Generated weapons and offhands now roll a deterministic granted combat ability that matches the item archetype, and equipped combatants surface those granted abilities in battle on top of the baseline `Kick`.
- Crafted and fixed offhand gear such as bucklers, shields, magical spheres, and totems also roll a deterministic active ability from an archetype-appropriate pool.
- Equippable item tooltips surface the granted combat ability directly so players can see the rolled skill before equipping the item.

## Main Implementation Areas

- `src/game/inventory.ts`
- `src/game/world.ts`
- `src/game/state.ts`
- `src/game/stateRewards.ts`
- `src/game/content/items`
- `src/game/content/generatedEquipment.ts`
- `src/app/normalize.ts`
