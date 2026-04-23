# Crafting Ingot Redistribution

This note captures the transient design context for redistributing generated
workshop recipes across the existing smelted ingot set.

## Goal

Replace the old concentration on `iron-ingot` in generated workshop recipes
with a deterministic spread across `copper-ingot`, `tin-ingot`, `iron-ingot`,
`gold-ingot`, and `platinum-ingot` while keeping balance close to the existing
catalog.

## Constraints

- Keep recipes deterministic.
- Keep one canonical recipe per output.
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
