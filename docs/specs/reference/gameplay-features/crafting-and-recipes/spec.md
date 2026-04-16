# Crafting And Recipes

## Scope

This spec covers the recipe book, recipe learning, and crafting execution.

## Current Behavior

- The player starts with a set of learned recipes, and the recipe book exists as a dedicated window instead of an inventory item.
- Recipe definitions are keyed to canonical output item bases, and recipe pages can drop and be consumed to learn additional recipes the player does not already know.
- Recipe pages carry canonical recipe ids directly instead of relying on output item configs, so looted pages continue to unlock the matching recipe-book entry after pickup and use.
- Learned recipes are tracked on the player state.
- Crafting and smelting check recipe knowledge, scaled ingredient requirements, optional fuel requirements, and the required crafting site.
- Crafting consumes required inputs and materializes a configured output item.
- The recipe book shows both learned and unlearned recipes, splits them into right-side profession tabs for crafting, smelting, and cooking, supports resizing, and can be filtered by a crafting material from the inventory context menu.
- Learned recipes stay interactive, sort ahead of unlearned recipes within each profession tab, show inventory-style recipe entries, tint red when the player lacks materials, fuel, or the right crafting site, and expose a hover tooltip with the crafting-site icon plus icon-backed material and fuel requirements.
- Unlearned recipes remain visible but disabled, with no hover tooltip.
- Crafting coverage includes a fixed-icon workshop catalog built from every generated equipment icon pool entry, so each pooled helmet, shoulders, chest, bracers, gloves, belt, leggings, boots, cloak, weapon, shield, wand, orb, ring, and necklace icon now has its own base item and recipe-book entry.
- Current recipe coverage now spans a much larger craftable catalog, including the original cooking and gear set plus a generated expansion of themed weapons, shields, hoods, mantles, vests, bracers, gloves, belts, leggings, boots, charms, and cloaks.
- Cooking coverage now also includes a broad harvest-and-meat meal set built from herb-patch produce, orchard fruit, and animal meat drops.
- Metal progression now routes through furnace smelting recipes for copper, tin, iron, gold, and platinum ores, with one canonical iron-ingot recipe and workshop gear recipes consuming ingots instead of raw ore.
- Recipe resource costs are scaled 10x from their base requirements, including cooking fuel requirements.

## Main Implementation Areas

- `src/game/crafting.ts`
- `src/game/state.ts`
- `src/ui/components/RecipeBookWindow/RecipeBookWindowContent.tsx`
