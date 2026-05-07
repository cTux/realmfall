# Crafting Ingot Redistribution

Historical note for the shipped workshop ingot redistribution work.

Canonical references:

- Gameplay behavior: [Crafting And Recipes](../../../specs/reference/gameplay-features/crafting-and-recipes/spec.md)
- Related gameplay: [Items, Loot, And Equipment](../../../specs/reference/gameplay-features/items-loot-and-equipment/spec.md)
- Do not introduce "any ingot" ingredient logic.
- Preserve non-metal ingredients and quantity costs.

## Direction

- Reassign only the recipes that previously hardcoded `iron-ingot`.
- Use canonical recipe order to distribute ingots in a stable round-robin split.
- Verify that all ingots appear in the generated workshop recipe set.
- Verify that each ingot path keeps at least one weapon recipe.
- Update the canonical crafting spec when the shipped behavior changes.

## Canonical References

- `src/game/generatedCraftingRecipes.ts`
- `src/game/crafting.ts`
- `docs/specs/reference/gameplay-features/crafting-and-recipes/spec.md`
