import { getRecipeRequiredStructure } from '../../../../game/crafting';
import type { RecipeBookEntry } from '../../../../game/types';

interface RecipeBookEntryContext {
  currentStructure?: string;
  inventoryCountsByItemKey: Record<string, number>;
}

export function canCraftRecipeEntry(
  recipe: RecipeBookEntry,
  { currentStructure, inventoryCountsByItemKey }: RecipeBookEntryContext,
) {
  const missingIngredient = recipe.ingredients.some(
    (ingredient) =>
      (inventoryCountsByItemKey[ingredient.itemKey ?? ingredient.name] ?? 0) <
      ingredient.quantity,
  );
  const hasFuel =
    !recipe.fuelOptions ||
    recipe.fuelOptions.some(
      (fuel) =>
        (inventoryCountsByItemKey[fuel.itemKey ?? fuel.name] ?? 0) >=
        fuel.quantity,
    );
  const atRequiredStructure =
    currentStructure === getRecipeRequiredStructure(recipe);

  return recipe.learned && !missingIngredient && hasFuel && atRequiredStructure;
}

export function compareRecipeBookEntries(
  left: RecipeBookEntry,
  right: RecipeBookEntry,
  context: RecipeBookEntryContext,
) {
  const leftCanCraft = canCraftRecipeEntry(left, context);
  const rightCanCraft = canCraftRecipeEntry(right, context);

  if (leftCanCraft !== rightCanCraft) {
    return Number(rightCanCraft) - Number(leftCanCraft);
  }
  if (left.learned !== right.learned) {
    return Number(right.learned) - Number(left.learned);
  }

  return left.name.localeCompare(right.name);
}
