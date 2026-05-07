import { CRAFTABLE_ICON_ITEM_ENTRIES } from './content/generatedCraftingEquipment';
import { getGeneratedCraftingLore } from './content/generatedCraftingLore';
import type { GeneratedCraftIngredient } from './content/generatedEquipmentFamilies';
import { buildItemFromConfig } from './content/items';
import { buildRecipeRequirement } from './recipeRequirements';
import { Skill, type RecipeDefinition } from './types';

const REDISTRIBUTED_INGOT_ITEM_KEYS = [
  'copper-ingot',
  'tin-ingot',
  'iron-ingot',
  'gold-ingot',
  'platinum-ingot',
] as const;

function buildItemKeyRequirement(itemKey: string, quantity: number) {
  return buildRecipeRequirement(itemKey, quantity);
}

function buildRedistributedIngotRequirement(
  redistributedIngotIndex: number,
  quantity: number,
) {
  return buildItemKeyRequirement(
    REDISTRIBUTED_INGOT_ITEM_KEYS[
      redistributedIngotIndex % REDISTRIBUTED_INGOT_ITEM_KEYS.length
    ]!,
    quantity,
  );
}

function usesRedistributedIngot(
  ingredients: readonly GeneratedCraftIngredient[],
) {
  return ingredients.some(
    (ingredient) =>
      'kind' in ingredient && ingredient.kind === 'redistributed-ingot',
  );
}

function buildGeneratedRecipeIngredients(
  ingredients: readonly GeneratedCraftIngredient[],
  redistributedIngotIndex: number,
) {
  return ingredients.map((ingredient) =>
    'kind' in ingredient
      ? buildRedistributedIngotRequirement(
          redistributedIngotIndex,
          ingredient.quantity,
        )
      : buildItemKeyRequirement(ingredient.itemKey, ingredient.quantity),
  );
}

function buildGeneratedRecipeDescription(itemKey: string) {
  return (
    getGeneratedCraftingLore(itemKey)?.description ??
    'Assemble a fixed-pattern piece of gear from workshop materials.'
  );
}

export const GENERATED_CRAFTING_RECIPES: RecipeDefinition[] = (() => {
  let redistributedIngotIndex = 0;

  return CRAFTABLE_ICON_ITEM_ENTRIES.map(({ config, craft }) => {
    const ingredients = buildGeneratedRecipeIngredients(
      craft.ingredients,
      redistributedIngotIndex,
    );

    if (usesRedistributedIngot(craft.ingredients)) {
      redistributedIngotIndex += 1;
    }

    return {
      id: `craft-${config.key}`,
      name: getGeneratedCraftingLore(config.key)?.name ?? config.name,
      description: buildGeneratedRecipeDescription(config.key),
      skill: Skill.Crafting,
      output: buildItemFromConfig(config.key, { id: `crafted-${config.key}` }),
      ingredients,
    };
  });
})();

export const GENERATED_CRAFTING_RECIPE_IDS = Object.freeze(
  GENERATED_CRAFTING_RECIPES.map((recipe) => recipe.id),
);
