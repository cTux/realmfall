import { getRecipeRequiredStructure } from '../../../../game/crafting';
import type { RecipeBookEntry } from '../../../../game/types';

interface RecipeBookEntryContext {
  currentStructure?: string;
  inventoryCountsByItemKey: Record<string, number>;
}

function hasSufficientMaterials(
  recipe: RecipeBookEntry,
  inventoryCountsByItemKey: Record<string, number>,
) {
  return recipe.ingredients.every((ingredient) => {
    const key = ingredient.itemKey ?? ingredient.name;
    return (inventoryCountsByItemKey[key] ?? 0) >= ingredient.quantity;
  });
}

function getFuelSource(
  recipe: RecipeBookEntry,
  inventoryCountsByItemKey: Record<string, number>,
) {
  if (!recipe.fuelOptions) return null;

  for (const fuel of recipe.fuelOptions) {
    const key = fuel.itemKey ?? fuel.name;
    if ((inventoryCountsByItemKey[key] ?? 0) >= fuel.quantity) {
      return fuel;
    }
  }

  return null;
}

export function canCraftRecipeEntry(
  recipe: RecipeBookEntry,
  { currentStructure, inventoryCountsByItemKey }: RecipeBookEntryContext,
) {
  if (!recipe.learned) return false;

  const missingIngredient = !hasSufficientMaterials(
    recipe,
    inventoryCountsByItemKey,
  );
  const selectedFuel = getFuelSource(recipe, inventoryCountsByItemKey);
  const hasFuel = !recipe.fuelOptions || selectedFuel !== null;
  const requiredStructure = getRecipeRequiredStructure(recipe);
  const atRequiredStructure =
    requiredStructure === null || currentStructure === requiredStructure;

  return !missingIngredient && hasFuel && atRequiredStructure;
}

export function getRecipeCraftAvailabilityCount(
  recipe: RecipeBookEntry,
  { currentStructure, inventoryCountsByItemKey }: RecipeBookEntryContext,
) {
  if (
    !canCraftRecipeEntry(recipe, { currentStructure, inventoryCountsByItemKey })
  ) {
    return 0;
  }

  const availableItems = { ...inventoryCountsByItemKey };
  let count = 0;

  while (true) {
    if (!hasSufficientMaterials(recipe, availableItems)) return count;

    const selectedFuel = getFuelSource(recipe, availableItems);
    if (recipe.fuelOptions && !selectedFuel) {
      return count;
    }

    for (const ingredient of recipe.ingredients) {
      const key = ingredient.itemKey ?? ingredient.name;
      availableItems[key] -= ingredient.quantity;
    }

    if (selectedFuel) {
      const key = selectedFuel.itemKey ?? selectedFuel.name;
      availableItems[key] -= selectedFuel.quantity;
    }

    count += 1;
  }
}

export function compareRecipeBookEntries(
  left: RecipeBookEntry,
  right: RecipeBookEntry,
  context: RecipeBookEntryContext,
) {
  if (left.favorite !== right.favorite) {
    return Number(right.favorite) - Number(left.favorite);
  }
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
