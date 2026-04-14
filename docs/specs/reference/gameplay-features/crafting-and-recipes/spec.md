# Crafting And Recipes

## Scope

This spec covers the recipe book, recipe learning, and crafting execution.

## Current Behavior

- The player starts with a recipe book item and a set of learned recipes.
- Recipe pages can drop and be consumed to learn additional recipes.
- Learned recipes are tracked on the player state.
- Crafting checks ingredient and optional fuel requirements.
- Crafting consumes required inputs and materializes a configured output item.
- Current recipe coverage includes cooking and crafted gear across weapon, armor, and artifact slots.

## Main Implementation Areas

- `src/game/crafting.ts`
- `src/game/state.ts`
- `src/game/content/items/recipeBook.ts`
- `src/ui/components/RecipeBookWindow/RecipeBookWindowContent.tsx`
