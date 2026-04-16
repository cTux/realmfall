# Crafting And Recipes

## Scope

This spec covers the recipe book, recipe learning, and crafting execution.

## Current Behavior

- The player starts with a set of learned recipes, and the recipe book exists as a dedicated window instead of an inventory item.
- Recipe pages can drop and be consumed to learn additional recipes.
- Learned recipes are tracked on the player state.
- Crafting checks recipe knowledge, ingredient requirements, optional fuel requirements, and the required crafting site.
- Crafting consumes required inputs and materializes a configured output item.
- Current recipe coverage includes cooking and crafted gear across weapon, armor, and artifact slots.

## Main Implementation Areas

- `src/game/crafting.ts`
- `src/game/state.ts`
- `src/ui/components/RecipeBookWindow/RecipeBookWindowContent.tsx`
