import { CRAFTABLE_ICON_ITEM_CONFIGS } from './content/generatedCraftingEquipment';
import { getGeneratedCraftingLore } from './content/generatedCraftingLore';
import { buildItemFromConfig } from './content/items';
import { Skill, type RecipeDefinition, type RecipeRequirement } from './types';

function buildRequirement(
  itemKey: string,
  name: string,
  quantity: number,
): RecipeRequirement {
  return { itemKey, name, quantity };
}

function buildGeneratedRecipeIngredients(itemKey: string) {
  if (itemKey.startsWith('icon-wand-')) {
    return [
      buildRequirement('tin-ingot', 'Tin Ingot', 2),
      buildRequirement('arcane-dust', 'Aether Dust', 2),
      buildRequirement('sticks', 'Sticks', 1),
    ];
  }
  if (itemKey.startsWith('icon-magical-sphere-')) {
    return [
      buildRequirement('gold-ingot', 'Gold Ingot', 2),
      buildRequirement('platinum-ingot', 'Platinum Ingot', 1),
      buildRequirement('arcane-dust', 'Aether Dust', 3),
    ];
  }
  if (itemKey.startsWith('icon-shield-')) {
    return [
      buildRequirement('iron-ingot', 'Iron Ingot', 2),
      buildRequirement('logs', 'Logs', 1),
      buildRequirement('leather-scraps', 'Leather Scraps', 2),
    ];
  }
  if (itemKey.startsWith('icon-ring-')) {
    return [
      buildRequirement('gold-ingot', 'Gold Ingot', 1),
      buildRequirement('arcane-dust', 'Aether Dust', 2),
    ];
  }
  if (itemKey.startsWith('icon-necklace-')) {
    return [
      buildRequirement('gold-ingot', 'Gold Ingot', 1),
      buildRequirement('platinum-ingot', 'Platinum Ingot', 1),
      buildRequirement('arcane-dust', 'Aether Dust', 2),
    ];
  }
  if (
    itemKey.startsWith('icon-two-handed-sword-') ||
    itemKey.startsWith('icon-two-handed-axe-') ||
    itemKey.startsWith('icon-two-handed-mace-')
  ) {
    return [
      buildRequirement('iron-ingot', 'Iron Ingot', 4),
      buildRequirement('logs', 'Logs', 1),
    ];
  }
  if (itemKey.startsWith('icon-offhand-dagger-')) {
    return [
      buildRequirement('iron-ingot', 'Iron Ingot', 1),
      buildRequirement('leather-scraps', 'Leather Scraps', 1),
    ];
  }
  if (
    itemKey.startsWith('icon-axe-') ||
    itemKey.startsWith('icon-sword-') ||
    itemKey.startsWith('icon-mace-') ||
    itemKey.startsWith('icon-dagger-')
  ) {
    return [
      buildRequirement('iron-ingot', 'Iron Ingot', 2),
      buildRequirement('sticks', 'Sticks', 1),
    ];
  }
  if (itemKey.startsWith('icon-chest-')) {
    return [
      buildRequirement('cloth', 'Cloth', 4),
      buildRequirement('leather-scraps', 'Leather Scraps', 4),
      buildRequirement('iron-ingot', 'Iron Ingot', 2),
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
      buildRequirement('cloth', 'Cloth', 2),
      buildRequirement('leather-scraps', 'Leather Scraps', 2),
      buildRequirement('iron-ingot', 'Iron Ingot', 1),
    ];
  }
  return [
    buildRequirement('leather-scraps', 'Leather Scraps', 2),
    buildRequirement('cloth', 'Cloth', 1),
    buildRequirement('iron-ingot', 'Iron Ingot', 1),
  ];
}

function buildGeneratedRecipeDescription(itemKey: string) {
  return (
    getGeneratedCraftingLore(itemKey)?.description ??
    'Assemble a fixed-pattern piece of gear from workshop materials.'
  );
}

export const GENERATED_CRAFTING_RECIPES: RecipeDefinition[] =
  CRAFTABLE_ICON_ITEM_CONFIGS.map((config) => ({
    id: `craft-${config.key}`,
    name: getGeneratedCraftingLore(config.key)?.name ?? config.name,
    description: buildGeneratedRecipeDescription(config.key),
    skill: Skill.Crafting,
    output: buildItemFromConfig(config.key, { id: `crafted-${config.key}` }),
    ingredients: buildGeneratedRecipeIngredients(config.key),
  }));

export const GENERATED_CRAFTING_RECIPE_IDS = Object.freeze(
  GENERATED_CRAFTING_RECIPES.map((recipe) => recipe.id),
);
