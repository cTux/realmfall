# Items Loot And Equipment

## Scope

This spec covers item structure, generated gear, loot sources, and player equipment.

## Current Behavior

- Items are represented as structured gameplay entities with stable instance ids, canonical item type ids, typed kinds, and gameplay tags.
- Current main item families are `resource`, `consumable`, `weapon`, `armor`, and `artifact`.
- Resource items now include raw ores plus smelted ingots, with metal gear recipes consuming ingots instead of raw ore or chunks.
- Equippable drops are now built from a base-item dictionary keyed by stable ids, while combat stats, rarity, and instance ids are rolled per dropped instance instead of being baked into the base definition.
- Stackable items consolidate in inventory when they share stack identity derived from canonical item identity.
- Item contracts now carry optional materialized visual metadata (e.g., `tint` and `icon`) for configured items, allowing shared and client render paths to use aligned item visuals from runtime data while preserving older payload fallback behavior.
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
- Inventory item activation routes through dedicated item-action mutations that decide whether to equip gear, learn a recipe page, or consume the item, while direct equip or unequip actions stay in the same focused state module.
- A new game now starts with a `Town Knife` and `Settler Vest`; removed placeholder gear is not preserved through runtime display-name fallbacks.
- The equipment window presents a silhouette-backed paper-doll layout where each slot is anchored near the matching body part and equipped items reuse the same icon-card treatment shown in inventory.
- Inventory and ground-loot windows use a denser item-card treatment than the paper-doll equipment layout, with compact slots at roughly 60% of the prior compact footprint and icons sized to 90% of the slot box so larger item piles fit without pushing the window size upward.
- Inventory-style equippable item icons now use theme-first palettes with low-intensity slot-role variation inside each set or generic gear family, while equippable item rarity is communicated through the slot border instead of recoloring the icon itself.
- Tiles may spawn deterministic loot from world generation.
- Enemies can drop gold, consumables, recipe pages, home scrolls, health potions, mana potions, blood moon gear, meat, and skinning materials depending on enemy ids and tags rather than localized names.
- Food consumables restore HP and MP by percentage instead of flat values, using the item's healing rating as the restore percent with a minimum of `10%` for each resource while hunger and thirst remain flat restores.
- Health potions and mana potions use vendored local SVG assets and restore `35%` of the corresponding max stat on use.
- Consumables share a single `2s` cooldown lockout only during active combat, and leaving combat clears that shared cooldown immediately.
- Consumable-use effects and cooldown application are resolved from the focused item-action mutation flow rather than from the broad gameplay state facade.
- Consumable tooltip copy and consumable-use resolution both read from the same shared consumable-effect descriptor model, so percent restores and hunger or thirst restores do not drift between UI text and gameplay behavior.
- Lockpicks and chest keys are stackable chest-only consumables that route through the dedicated inventory item-action path instead of the ordinary consumable flow.
- Lockpicks have a base `75%` break chance that the lockpicking skill reduces to a `25%` floor, while chest keys always consume `1` stack on use.
- Chest openers are excluded from generic consumable pools and only enter the world through dedicated enemy drop rolls: `0.5%` for lockpicks and `0.01%` for chest keys.
- Opening an ordinary locked chest consumes the opener, removes the chest structure, and drops one world-generated item onto the tile.
- Equippable items can carry persistent modification metadata for a reforged secondary-stat slot, one enchanted extra secondary stat, and a corrupted flag that survives cloning, scaling, tooltip rendering, and save normalization.
- Rune-forge reforging rerolls one chosen base secondary stat or one visible empty base-secondary slot into a new random compatible stat, charges gold, and locks all later reforges on that item to the same already-reforged real slot instead of reopening every base stat.
- Mana-font enchanting charges gold and grants one extra random compatible secondary stat; enchanting the same item again replaces that dedicated enchant stat instead of adding another slot.
- Corruption-altar corruption charges gold, warns about a `5%` break chance, and either destroys the item or permanently marks it corrupted, preventing all future reforge, enchant, or corruption actions on that item.
- Successful corruption boosts every main stat and secondary-stat value on the item by `10%` relative to the current value with a minimum gain of `+1` per affected stat.
- Item tooltips and display names surface modification state directly: reforged secondary stats are pink, enchanted secondary stats are cyan, corrupted items append `[Corrupted]` with a red item title, and equippable items show at most one visible empty base-secondary slot at a time.
- Loot can be taken item-by-item or collected from a tile in bulk.
- World-generated weapons, armor, offhands, and artifacts scale by terrain tier and context, including generated shoulders, bracers, belts, shields, magical offhands, and one-handed or two-handed weapon archetypes.
- World loot and blood moon bonus gear now choose their top-level item family from weighted `core.config.ts` maps. Surface world caches remain consumable-heavy, while blood moon bonus gear leans toward weapons, armor, and offhands more than artifacts.
- Offhand shields and magical spheres always include a block-chance secondary stat, including both generated drops and fixed crafted icon variants.
- Enemy bonus drops now evaluate item-kind chances in ascending order from lowest to highest; each successful chance rolls an independent item drop so rarer kinds remain reachable while higher-chance kinds can still drop too.
- Dungeon and blood moon rewards bias toward better rarity floors.
- Killing a treasure goblin applies its loot bonuses based on enemy type, multiplying item-drop entry chance by `3`, item-rarity scaling by `3`, and resolved gold quantity by `20`, including kills after an earlier escape from the same goblin.
- Generated artifacts and equipment use deterministic icon selection from stable generated icon ids while their per-instance stats are derived from tier and rarity. The vendored SVG pools in `src/assets/icons/generated` are resolved by UI asset helpers rather than imported by gameplay content.
- Generated artifacts and equipment use the shared cascading rarity-event mechanism so higher tiers can promote drops through the same rarity ladder used elsewhere in gameplay, with base upgrade checks of `30%` uncommon, `5%` rare, `0.5%` epic, and `0.02%` legendary before tier bonuses.
- Generated weapons and offhands now roll a deterministic granted combat ability that matches the item archetype, and equipped combatants surface those granted abilities in battle on top of the baseline `Kick`.
- Crafted and fixed offhand gear such as bucklers, shields, magical spheres, and totems also roll a deterministic active ability from an archetype-appropriate pool.
- Equippable item tooltips surface the granted combat ability directly so players can see the rolled skill before equipping the item.
- Generated drop configs and craftable icon configs now derive their shared slot, category, icon-pool id family, offhand-occupancy, granted-ability metadata, mirrored ring drop variants, and ring craft-slot distribution from one canonical generated-equipment family manifest, so icon-family ownership does not drift between world drops and workshop outputs.
- Generated craftable icon recipes now derive ingredient sources and the preserved left-first ring slot split from that same generated-equipment family manifest instead of prefix-based recipe heuristics.
- Recipe-page construction and crafted-output materialization now live in crafting-owned helpers, leaving `inventory.ts` focused on inventory mechanics instead of recipe ownership.
- Item content keeps `src/game/content/items/index.ts` as a thin public facade while `itemCatalog.ts` assembles hydrated configs, `itemBuilders.ts` owns configured and generated item construction, and `itemClassification.ts` plus `itemCategoryRules.ts` own category and tag inference.

## Main Implementation Areas

- `src/game/inventory.ts`
- `src/game/craftingOutputs.ts`
- `src/game/itemModifications.ts`
- `src/game/consumables.ts`
- `src/game/stateItemActions.ts`
- `src/game/stateItemModificationActions.ts`
- `src/game/world.ts`
- `src/game/state.ts`
- `src/game/stateRewards.ts`
- `src/game/stateRewards/enemyLoot.ts`
- `src/game/generatedCraftingRecipes.ts`
- `src/game/content/items`
- `src/game/content/generatedIconPools.ts`
- `src/ui/generatedIconAssets.ts`
- `src/ui/iconAssets.ts`
- `src/game/content/generatedEquipmentFamilies.ts`
- `src/game/content/generatedEquipment.ts`
- `src/app/normalize.ts`
