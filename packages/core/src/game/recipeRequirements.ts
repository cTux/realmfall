import type { RecipeRequirement } from './types';

export function buildRecipeRequirement(
  itemKey: RecipeRequirement['itemKey'],
  quantity: number,
): RecipeRequirement {
  return { itemKey, quantity };
}

export const DEFAULT_COOKING_FUEL_OPTIONS: RecipeRequirement[] = [
  buildRecipeRequirement('coal', 1),
  buildRecipeRequirement('logs', 2),
  buildRecipeRequirement('sticks', 8),
];
