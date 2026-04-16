# Crafting And Recipes

## Scope

This spec covers the recipe book, recipe learning, and crafting execution.

## Current Behavior

- The player starts with a set of learned recipes, and the recipe book exists as a dedicated window instead of an inventory item.
- Recipe definitions are keyed to canonical output item bases, and recipe pages can drop and be consumed to learn additional recipes the player does not already know.
- Recipe pages carry canonical recipe ids directly instead of relying on output item configs, so looted pages continue to unlock the matching recipe-book entry after pickup and use.
- Learning a recipe page replaces the learned recipe id list by value, so the recipe book refreshes immediately without reloading the app.
- Learned recipes are tracked on the player state.
- Crafting and smelting check recipe knowledge, scaled ingredient requirements, optional fuel requirements, and the required crafting site.
- Crafting consumes required inputs and materializes a configured output item.
- The recipe book shows both learned and unlearned recipes, splits them into right-side profession tabs ordered as cooking, smelting, then crafting, supports resizing, and can be filtered by a crafting material from the inventory context menu.
- Learned recipes stay interactive, recipes craftable right now sort ahead of other entries within each profession tab, remaining learned recipes sort ahead of unlearned ones, entries show inventory-style recipe slots, keep learned crafting recipes on a fixed white slot tint only while their required workshop hex is available because their crafted rarity is rolled only at craft time, tint any recipe red when the player lacks materials, fuel, or the right crafting site, and expose a hover tooltip with the crafting-site icon plus tint-aware icon-backed material requirements and a separate fuel-materials section that makes the fuel choice explicit as one alternative option rather than a cumulative requirement.
- Unlearned recipes remain visible but disabled, with no hover tooltip.
- Crafting coverage is rebuilt entirely from the equippable icon pools: every icon variation for helmets, shoulders, chest armor, bracers, gloves, belts, leggings, boots, cloaks, one-handed weapons, offhands, wands, magical spheres, shields, two-handed weapons, rings, and necklaces has exactly one configured base item and exactly one crafting recipe-book entry.
- The crafting tab no longer mixes in legacy handcrafted workshop recipes or the themed expansion set; its total recipe count matches the total equippable icon-variation count exactly.
- Generated crafting outputs and their recipe-book entries use lore-based Realmfall names and descriptions rather than numbered placeholder labels.
- Cooking coverage now also includes a broad harvest-and-meat meal set built from herb-patch produce, orchard fruit, and animal meat drops.
- Metal progression now routes through furnace smelting recipes for copper, tin, iron, gold, and platinum ores, with one canonical iron-ingot recipe and workshop gear recipes consuming ingots instead of raw ore.
- Ingot item bases use the shared bar icon with bright material-specific tinting so each refined metal reads distinctly in inventory and tooltips.
- Workshop material costs are scaled 10x from their base requirements. Smelting recipes refine ore into matching ingots at a true 1:1 ratio, so one ingot craft consumes one ore while keeping the existing lower fuel quantities as alternative single-source requirements. Cooking recipes keep one-to-one food ingredient quantities so one raw source ingredient still produces one cooked result.
- Cooking and smelting profession levels increase recipe output quantity without raising material or fuel costs, and the recipe book preview reflects the current output stack for those professions.
- Crafted equipment outputs now also resolve through the shared cascading rarity-event mechanism, using the recipe's configured rarity as the minimum floor instead of always materializing at the base rarity.
- Recipe action buttons support modifier-based bulk crafting: plain clicks craft once, `Shift` crafts up to five times if requirements remain valid, and `Ctrl` crafts the maximum possible amount from current materials, fuel, and station access without adding a trailing failure message after successful batches.
- Hovering the recipe action buttons shows the shared custom tooltip with the available bulk-crafting modifiers instead of relying on native browser tooltips.

## Main Implementation Areas

- `src/game/crafting.ts`
- `src/game/state.ts`
- `src/ui/components/RecipeBookWindow/RecipeBookWindowContent.tsx`
