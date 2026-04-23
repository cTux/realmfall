# Crafting Ingot Redistribution Design

## Goal

Redistribute generated workshop recipes that currently depend on `iron-ingot` so the full smelted ingot set is used across the crafting catalog. The resulting recipe set should stay deterministic, remain close to the current balance, and ensure there are craftable weapons available for every smeltable metal path.

## Current Context

- Furnace smelting already supports `copper-ingot`, `tin-ingot`, `iron-ingot`, `gold-ingot`, and `platinum-ingot`.
- Generated workshop recipes are defined in `src/game/generatedCraftingRecipes.ts`.
- Most metal-bearing generated workshop recipes currently hardcode `iron-ingot`.
- The crafting runtime in `src/game/crafting.ts` already supports canonical `itemKey` requirements and does not need a new “any-of” ingredient system for this request.

## Chosen Approach

Use deterministic redistribution of the existing `iron-ingot` workshop recipes.

- Keep each generated recipe as a single canonical recipe.
- Keep each recipe’s quantity cost and non-metal side ingredients unchanged.
- Replace the hardcoded `iron-ingot` requirement on eligible generated workshop recipes with one ingot selected from the full existing ingot set.
- Assign ingots in a stable round-robin split based on canonical recipe order so the distribution stays reproducible and easy to test.

## Why This Approach

- It matches the request for an even split of recipes across the existing ingots.
- It avoids widening the recipe system to support alternative ingredients.
- It preserves the current one-recipe-per-output structure and keeps recipe learning, tooltips, and crafting execution unchanged.
- It scales cleanly when new generated recipes are added because the distribution helper can continue to assign metals deterministically.

## Scope

### In Scope

- Generated workshop recipe ingredient selection for former `iron-ingot` recipes.
- Deterministic assignment across the existing ingot pool.
- Tests covering distribution and successful crafting with non-iron ingots.
- Crafting spec update describing the redistributed ingot usage.

### Out of Scope

- Smelting recipe changes.
- New ore or ingot item types.
- Recipe UI layout changes.
- Multi-option ingredient requirements such as “use any ingot”.
- Rebalancing quantities or rarity outcomes beyond metal assignment.

## Design Details

### Eligible Recipes

Recipes in `src/game/generatedCraftingRecipes.ts` that currently assign `iron-ingot` as their metal requirement are the redistribution candidates.

Recipes already specialized around another metal for thematic reasons, such as wand, magical sphere, ring, or necklace recipes, remain unchanged unless they currently rely on `iron-ingot`.

### Assignment Strategy

Introduce a focused helper in `src/game/generatedCraftingRecipes.ts` that:

1. Builds the base ingredient list for a generated output without hardcoding the metal to `iron-ingot`.
2. Detects whether the recipe needs a redistributed ingot slot.
3. Assigns one ingot from the canonical ingot list:
   - `copper-ingot`
   - `tin-ingot`
   - `iron-ingot`
   - `gold-ingot`
   - `platinum-ingot`
4. Uses canonical generated recipe order to keep the assignment stable across runs.

The metal requirement name should continue to resolve through the existing item config path, so tooltip and recipe-book labels stay canonical.

### Balance Guardrails

- Keep quantity counts unchanged from the current recipe shape.
- Do not alter fuel, profession, output tier, rarity, or learning behavior.
- Preserve non-metal side ingredients like `sticks`, `logs`, `cloth`, and `leather-scraps`.

## Testing

Add or update node tests to prove:

- the generated workshop recipe set includes all five ingot item keys,
- redistributed former iron-based recipes are split approximately evenly across the five ingots,
- at least one weapon recipe exists for each ingot,
- crafting succeeds when the player has only the exact redistributed ingot required for that recipe.

## Documentation

Update `docs/specs/reference/gameplay-features/crafting-and-recipes/spec.md` to describe that generated workshop recipes distribute their metal requirements across the full ingot set instead of concentrating on iron.

## Risks And Mitigations

- Risk: recipe redistribution changes learned-recipe expectations for specific outputs.
  Mitigation: keep recipe ids and outputs unchanged; only ingredient `itemKey` changes.

- Risk: future recipe additions skew the split unexpectedly.
  Mitigation: derive assignment from canonical recipe order and cover the distribution in tests.

- Risk: some weapon families end up missing from a metal path.
  Mitigation: add a test that verifies at least one weapon recipe exists for each ingot.
