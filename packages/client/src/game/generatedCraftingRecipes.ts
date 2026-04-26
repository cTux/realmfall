import { CRAFTABLE_ICON_ITEM_CONFIGS } from './content/generatedCraftingEquipment';
import { getGeneratedCraftingLore } from './content/generatedCraftingLore';
import { buildItemFromConfig, getItemConfigByKey } from './content/items';
import { Skill, type RecipeDefinition, type RecipeRequirement } from './types';

function buildRequirement(
  itemKey: string,
  name: string,
  quantity: number,
): RecipeRequirement {
  return { itemKey, name, quantity };
}

const REDISTRIBUTED_INGOT_ITEM_KEYS = [
  'copper-ingot',
  'tin-ingot',
  'iron-ingot',
  'gold-ingot',
  'platinum-ingot',
] as const;

function buildItemKeyRequirement(itemKey: string, quantity: number) {
  return buildRequirement(
    itemKey,
    getItemConfigByKey(itemKey)?.name ?? itemKey,
    quantity,
  );
}

function usesRedistributedIngot(itemKey: string) {
  return (
    !itemKey.startsWith('icon-wand-') &&
    !itemKey.startsWith('icon-magical-sphere-') &&
    !itemKey.startsWith('icon-ring-') &&
    !itemKey.startsWith('icon-necklace-')
  );
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

function buildGeneratedRecipeIngredients(
  itemKey: string,
  redistributedIngotIndex: number,
) {
  if (itemKey.startsWith('icon-wand-')) {
    return [
      buildItemKeyRequirement('tin-ingot', 2),
      buildItemKeyRequirement('arcane-dust', 2),
      buildItemKeyRequirement('sticks', 1),
    ];
  }
  if (itemKey.startsWith('icon-magical-sphere-')) {
    return [
      buildItemKeyRequirement('gold-ingot', 2),
      buildItemKeyRequirement('platinum-ingot', 1),
      buildItemKeyRequirement('arcane-dust', 3),
    ];
  }
  if (itemKey.startsWith('icon-shield-')) {
    return [
      buildRedistributedIngotRequirement(redistributedIngotIndex, 2),
      buildItemKeyRequirement('logs', 1),
      buildItemKeyRequirement('leather-scraps', 2),
    ];
  }
  if (itemKey.startsWith('icon-ring-')) {
    return [
      buildItemKeyRequirement('gold-ingot', 1),
      buildItemKeyRequirement('arcane-dust', 2),
    ];
  }
  if (itemKey.startsWith('icon-necklace-')) {
    return [
      buildItemKeyRequirement('gold-ingot', 1),
      buildItemKeyRequirement('platinum-ingot', 1),
      buildItemKeyRequirement('arcane-dust', 2),
    ];
  }
  if (
    itemKey.startsWith('icon-two-handed-sword-') ||
    itemKey.startsWith('icon-two-handed-axe-') ||
    itemKey.startsWith('icon-two-handed-mace-')
  ) {
    return [
      buildRedistributedIngotRequirement(redistributedIngotIndex, 4),
      buildItemKeyRequirement('logs', 1),
    ];
  }
  if (itemKey.startsWith('icon-offhand-dagger-')) {
    return [
      buildRedistributedIngotRequirement(redistributedIngotIndex, 1),
      buildItemKeyRequirement('leather-scraps', 1),
    ];
  }
  if (
    itemKey.startsWith('icon-axe-') ||
    itemKey.startsWith('icon-sword-') ||
    itemKey.startsWith('icon-mace-') ||
    itemKey.startsWith('icon-dagger-')
  ) {
    return [
      buildRedistributedIngotRequirement(redistributedIngotIndex, 2),
      buildItemKeyRequirement('sticks', 1),
    ];
  }
  if (itemKey.startsWith('icon-chest-')) {
    return [
      buildItemKeyRequirement('cloth', 4),
      buildItemKeyRequirement('leather-scraps', 4),
      buildRedistributedIngotRequirement(redistributedIngotIndex, 2),
    ];
  }
  if (
    itemKey.startsWith('icon-helmet-') ||
    itemKey.startsWith('icon-shoulders-') ||
    itemKey.startsWith('icon-leggings-') ||
    itemKey.startsWith('icon-boots-') ||
    itemKey.startsWith('icon-cloak-')
  ) {
    return [
      buildItemKeyRequirement('cloth', 2),
      buildItemKeyRequirement('leather-scraps', 2),
      buildRedistributedIngotRequirement(redistributedIngotIndex, 1),
    ];
  }
  return [
    buildItemKeyRequirement('leather-scraps', 2),
    buildItemKeyRequirement('cloth', 1),
    buildRedistributedIngotRequirement(redistributedIngotIndex, 1),
  ];
}

function buildGeneratedRecipeDescription(itemKey: string) {
  return (
    getGeneratedCraftingLore(itemKey)?.description ??
    'Assemble a fixed-pattern piece of gear from workshop materials.'
  );
}

export const GENERATED_CRAFTING_RECIPES: RecipeDefinition[] = (() => {
  let redistributedIngotIndex = 0;

  return CRAFTABLE_ICON_ITEM_CONFIGS.map((config) => {
    const ingredients = buildGeneratedRecipeIngredients(
      config.key,
      redistributedIngotIndex,
    );

    if (usesRedistributedIngot(config.key)) {
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
