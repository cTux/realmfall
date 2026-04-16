import { makeCookedFish } from './inventory';
import { GENERATED_CRAFTING_RECIPES } from './generatedCraftingRecipes';
import { HARVEST_COOKING_RECIPES } from './harvestCookingRecipes';
import { t } from '../i18n';
import { getGeneratedCraftingLore } from './content/generatedCraftingLore';
import { buildItemFromConfig, getItemConfigByKey } from './content/items';
import {
  Skill,
  type RecipeBookEntry,
  type SkillName,
  type StructureType,
} from './types';
import type {
  GameState,
  Item,
  RecipeDefinition,
  RecipeRequirement,
} from './types';

export function getRecipeBookRecipes(
  recipes: RecipeDefinition[],
  learnedRecipeIds?: string[],
): RecipeDefinition[] {
  const visibleRecipes = learnedRecipeIds
    ? recipes.filter((recipe) => learnedRecipeIds.includes(recipe.id))
    : recipes;

  return visibleRecipes.map((recipe) => ({
    ...recipe,
    output: { ...recipe.output },
    ingredients: recipe.ingredients.map((ingredient) => ({ ...ingredient })),
    fuelOptions: recipe.fuelOptions?.map((option) => ({ ...option })),
  }));
}

export function getRecipeBookEntries(
  recipes: RecipeDefinition[],
  learnedRecipeIds: string[],
): RecipeBookEntry[] {
  return recipes.map((recipe) => ({
    ...recipe,
    learned: learnedRecipeIds.includes(recipe.id),
    output: { ...recipe.output },
    ingredients: recipe.ingredients.map((ingredient) => ({ ...ingredient })),
    fuelOptions: recipe.fuelOptions?.map((option) => ({ ...option })),
  }));
}

export function hasAllRequirements(
  inventory: Item[],
  requirements: RecipeRequirement[],
) {
  return requirements.every((requirement) =>
    inventory.some((item) => matchesRequirement(item, requirement)),
  );
}

export function pickSatisfiedRequirement(
  inventory: Item[],
  requirements: RecipeRequirement[],
) {
  return requirements.find((requirement) =>
    inventory.some((item) => matchesRequirement(item, requirement)),
  );
}

export function consumeRequirements(
  inventory: Item[],
  requirements: RecipeRequirement[],
) {
  requirements.forEach((requirement) => {
    const itemIndex = inventory.findIndex((item) =>
      matchesRequirement(item, requirement),
    );
    if (itemIndex < 0) return;
    const item = inventory[itemIndex];
    if (item.quantity === requirement.quantity) {
      inventory.splice(itemIndex, 1);
      return;
    }
    inventory[itemIndex] = {
      ...item,
      quantity: item.quantity - requirement.quantity,
    };
  });
}

export function learnRecipe(
  state: GameState,
  item: Item,
  recipes: RecipeDefinition[],
  addLog: (state: GameState, kind: 'system', text: string) => void,
) {
  if (!item.recipeId) return;

  const recipe = recipes.find((entry) => entry.id === item.recipeId);
  if (!recipe) return;
  if (state.player.learnedRecipeIds.includes(recipe.id)) {
    addLog(
      state,
      'system',
      t('game.crafting.alreadyKnown', { recipe: recipe.name }),
    );
    return;
  }

  state.player.learnedRecipeIds.push(recipe.id);
  state.player.learnedRecipeIds.sort();
  addLog(
    state,
    'system',
    t('game.crafting.learnRecipe', { recipe: recipe.name }),
  );
}

export function describeRequirement(requirement: RecipeRequirement) {
  return `${requirement.quantity} ${requirement.name}`;
}

export function getRecipeRequiredStructure(
  recipe: Pick<RecipeDefinition, 'skill'>,
): StructureType {
  if (recipe.skill === Skill.Cooking) return 'camp';
  if (recipe.skill === Skill.Smelting) return 'furnace';
  return 'workshop';
}

export function recipeUsesItemKey(
  recipe: Pick<RecipeDefinition, 'ingredients' | 'fuelOptions'>,
  itemKey: string,
) {
  return [...recipe.ingredients, ...(recipe.fuelOptions ?? [])].some(
    (requirement) => requirement.itemKey === itemKey,
  );
}

export function professionRecipeOutputBonus(
  skill: SkillName,
  level: number,
) {
  if (skill !== Skill.Cooking && skill !== Skill.Smelting) return 0;
  return Math.max(0, Math.floor((level - 1) / 5));
}

export function getRecipeOutput(
  recipe: Pick<RecipeDefinition, 'output' | 'skill'>,
  skillLevel = 1,
): Item {
  return {
    ...recipe.output,
    quantity:
      recipe.output.quantity +
      professionRecipeOutputBonus(recipe.skill, skillLevel),
  };
}

function matchesRequirement(item: Item, requirement: RecipeRequirement) {
  return (
    item.quantity >= requirement.quantity &&
    (requirement.itemKey
      ? item.itemKey === requirement.itemKey
      : item.name === requirement.name)
  );
}

const RECIPE_REQUIREMENT_SCALE = 10;
const RECIPE_FUEL_SCALE = 1;
const COOKING_RECIPE_REQUIREMENT_SCALE = 1;
const SMELTING_RECIPE_REQUIREMENT_SCALE = 1;
const DEFAULT_COOKING_FUEL_OPTIONS: RecipeRequirement[] = [
  { itemKey: 'coal', name: 'Coal', quantity: 1 },
  { itemKey: 'logs', name: 'Logs', quantity: 2 },
  { itemKey: 'sticks', name: 'Sticks', quantity: 8 },
];

function scaleRequirements(
  requirements: RecipeRequirement[],
  multiplier: number,
) {
  return requirements.map((requirement) => ({
    ...requirement,
    quantity: requirement.quantity * multiplier,
  }));
}

const RAW_RECIPE_BOOK_RECIPES_BASE: RecipeDefinition[] = [
  {
    id: 'cook-cooked-fish',
    name: 'Cooked Fish',
    description: 'Cook raw fish over a small fire.',
    skill: Skill.Cooking,
    output: makeCookedFish(),
    ingredients: [{ itemKey: 'raw-fish', name: 'Raw Fish', quantity: 1 }],
    fuelOptions: DEFAULT_COOKING_FUEL_OPTIONS,
  },
  {
    id: 'smelt-copper-ingot',
    name: 'Copper Ingot',
    description: 'Refine a copper ore haul into a workable ingot.',
    skill: Skill.Smelting,
    output: buildItemFromConfig('copper-ingot'),
    ingredients: [{ itemKey: 'copper-ore', name: 'Copper Ore', quantity: 1 }],
    fuelOptions: DEFAULT_COOKING_FUEL_OPTIONS,
  },
  {
    id: 'smelt-tin-ingot',
    name: 'Tin Ingot',
    description: 'Smelt soft tin ore into a workable ingot for finer crafting.',
    skill: Skill.Smelting,
    output: buildItemFromConfig('tin-ingot'),
    ingredients: [{ itemKey: 'tin-ore', name: 'Tin Ore', quantity: 1 }],
    fuelOptions: DEFAULT_COOKING_FUEL_OPTIONS,
  },
  {
    id: 'smelt-iron-ingot',
    name: 'Iron Ingot',
    description: 'Smelt raw iron ore down into an ingot fit for crafting.',
    skill: Skill.Smelting,
    output: buildItemFromConfig('iron-ingot'),
    ingredients: [{ itemKey: 'iron-ore', name: 'Iron Ore', quantity: 1 }],
    fuelOptions: DEFAULT_COOKING_FUEL_OPTIONS,
  },
  {
    id: 'smelt-gold-ingot',
    name: 'Gold Ingot',
    description:
      'Refine bright gold ore into an ingot suited to precise metalwork.',
    skill: Skill.Smelting,
    output: buildItemFromConfig('gold-ingot'),
    ingredients: [{ itemKey: 'gold-ore', name: 'Gold Ore', quantity: 1 }],
    fuelOptions: DEFAULT_COOKING_FUEL_OPTIONS,
  },
  {
    id: 'smelt-platinum-ingot',
    name: 'Platinum Ingot',
    description:
      'Drive the furnace hotter and refine platinum ore into a pale ingot.',
    skill: Skill.Smelting,
    output: buildItemFromConfig('platinum-ingot'),
    ingredients: [{ itemKey: 'platinum-ore', name: 'Platinum Ore', quantity: 1 }],
    fuelOptions: DEFAULT_COOKING_FUEL_OPTIONS,
  },
  {
    id: 'cook-trail-ration',
    name: 'Trail Ration',
    description: 'A packed meal of fish and herbs for long roads.',
    skill: Skill.Cooking,
    output: buildItemFromConfig('trail-ration'),
    ingredients: [
      { itemKey: 'cooked-fish', name: 'Cooked Fish', quantity: 1 },
      { itemKey: 'herbs', name: 'Herbs', quantity: 1 },
    ],
    fuelOptions: DEFAULT_COOKING_FUEL_OPTIONS,
  },
  {
    id: 'cook-water-flask',
    name: 'Water Flask',
    description: 'Boil water clean and bottle it for the march ahead.',
    skill: Skill.Cooking,
    output: buildItemFromConfig('water-flask'),
    ingredients: [{ itemKey: 'herbs', name: 'Herbs', quantity: 1 }],
    fuelOptions: DEFAULT_COOKING_FUEL_OPTIONS,
  },
  ...HARVEST_COOKING_RECIPES,
  ...GENERATED_CRAFTING_RECIPES,
];

const RAW_RECIPE_BOOK_RECIPES: RecipeDefinition[] =
  RAW_RECIPE_BOOK_RECIPES_BASE.map((recipe) => ({
    ...recipe,
    ingredients: scaleRequirements(
      recipe.ingredients,
      recipe.skill === Skill.Cooking
        ? COOKING_RECIPE_REQUIREMENT_SCALE
        : recipe.skill === Skill.Smelting
          ? SMELTING_RECIPE_REQUIREMENT_SCALE
          : RECIPE_REQUIREMENT_SCALE,
    ),
    fuelOptions: recipe.fuelOptions
      ? scaleRequirements(recipe.fuelOptions, RECIPE_FUEL_SCALE)
      : undefined,
  }));

export const RECIPE_BOOK_RECIPES: RecipeDefinition[] =
  RAW_RECIPE_BOOK_RECIPES.map((recipe) => ({
    ...recipe,
    name:
      (recipe.output.itemKey
        ? getGeneratedCraftingLore(recipe.output.itemKey)?.name
        : undefined) ?? t(`game.recipe.${recipe.id}.name`),
    description:
      (recipe.output.itemKey
        ? getGeneratedCraftingLore(recipe.output.itemKey)?.description
        : undefined) ?? t(`game.recipe.${recipe.id}.description`),
    ingredients: recipe.ingredients.map((ingredient) => ({
      ...ingredient,
      name: ingredient.itemKey
        ? (getItemConfigByKey(ingredient.itemKey)?.name ?? ingredient.name)
        : ingredient.name,
    })),
    fuelOptions: recipe.fuelOptions?.map((option) => ({
      ...option,
      name: option.itemKey
        ? (getItemConfigByKey(option.itemKey)?.name ?? option.name)
        : option.name,
    })),
  }));

export const RECIPE_BY_OUTPUT_ITEM_KEY = Object.freeze(
  Object.fromEntries(
    RECIPE_BOOK_RECIPES.flatMap((recipe) =>
      recipe.output.itemKey ? [[recipe.output.itemKey, recipe]] : [],
    ),
  ) satisfies Record<string, RecipeDefinition>,
);
