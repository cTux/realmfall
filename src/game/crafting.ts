import { makeCookedFish, makeCraftedItem } from './inventory';
import { t } from '../i18n';
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

export function hasAllRequirements(
  inventory: Item[],
  requirements: RecipeRequirement[],
) {
  return requirements.every((requirement) =>
    inventory.some(
      (item) =>
        item.name === requirement.name && item.quantity >= requirement.quantity,
    ),
  );
}

export function pickSatisfiedRequirement(
  inventory: Item[],
  requirements: RecipeRequirement[],
) {
  return requirements.find((requirement) =>
    inventory.some(
      (item) =>
        item.name === requirement.name && item.quantity >= requirement.quantity,
    ),
  );
}

export function consumeRequirements(
  inventory: Item[],
  requirements: RecipeRequirement[],
) {
  requirements.forEach((requirement) => {
    const itemIndex = inventory.findIndex(
      (item) =>
        item.name === requirement.name && item.quantity >= requirement.quantity,
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

const RAW_RECIPE_BOOK_RECIPES: RecipeDefinition[] = [
  {
    id: 'cook-cooked-fish',
    name: 'Cooked Fish',
    description: 'Cook raw fish over a small fire.',
    skill: 'cooking',
    output: makeCookedFish(),
    ingredients: [{ name: 'Raw Fish', quantity: 1 }],
    fuelOptions: [
      { name: 'Coal', quantity: 1 },
      { name: 'Logs', quantity: 2 },
      { name: 'Sticks', quantity: 8 },
    ],
  },
  {
    id: 'craft-weapon',
    name: 'Camp Spear',
    description: 'A rough spear suited to the long roads between Shards.',
    skill: 'crafting',
    output: makeCraftedItem(
      'crafted-weapon',
      'weapon',
      'weapon',
      'Camp Spear',
      {
        power: 3,
        defense: 0,
        maxHp: 0,
      },
    ),
    ingredients: [
      { name: 'Iron Chunks', quantity: 2 },
      { name: 'Sticks', quantity: 2 },
    ],
  },
  {
    id: 'craft-offhand',
    name: 'Hide Buckler',
    description: 'A hide-wrapped buckler built to catch desperate blows.',
    skill: 'crafting',
    output: makeCraftedItem(
      'crafted-offhand',
      'armor',
      'offhand',
      'Hide Buckler',
      {
        power: 0,
        defense: 2,
        maxHp: 1,
      },
    ),
    ingredients: [
      { name: 'Leather Scraps', quantity: 3 },
      { name: 'Logs', quantity: 1 },
    ],
  },
  {
    id: 'craft-head',
    name: 'Patchwork Hood',
    description:
      'A stitched hood that keeps ash, rain, and cinders off your face.',
    skill: 'crafting',
    output: makeCraftedItem('crafted-head', 'armor', 'head', 'Patchwork Hood', {
      power: 0,
      defense: 1,
      maxHp: 1,
    }),
    ingredients: [
      { name: 'Cloth', quantity: 2 },
      { name: 'Leather Scraps', quantity: 2 },
    ],
  },
  {
    id: 'craft-chest',
    name: 'Settler Vest',
    description:
      'A layered vest worn by settlers who expect hard weather and harder work.',
    skill: 'crafting',
    output: makeCraftedItem('crafted-chest', 'armor', 'chest', 'Settler Vest', {
      power: 0,
      defense: 2,
      maxHp: 1,
    }),
    ingredients: [
      { name: 'Cloth', quantity: 4 },
      { name: 'Leather Scraps', quantity: 4 },
      { name: 'Iron Chunks', quantity: 1 },
    ],
  },
  {
    id: 'craft-hands',
    name: 'Work Gloves',
    description:
      'A practical pair of gloves for rope, tools, and rough salvage.',
    skill: 'crafting',
    output: makeCraftedItem('crafted-hands', 'armor', 'hands', 'Work Gloves', {
      power: 0,
      defense: 1,
      maxHp: 1,
    }),
    ingredients: [
      { name: 'Leather Scraps', quantity: 3 },
      { name: 'Cloth', quantity: 1 },
    ],
  },
  {
    id: 'craft-legs',
    name: 'Trail Leggings',
    description: 'Tough leggings meant for brush, stone, and broken roads.',
    skill: 'crafting',
    output: makeCraftedItem('crafted-legs', 'armor', 'legs', 'Trail Leggings', {
      power: 0,
      defense: 1,
      maxHp: 1,
    }),
    ingredients: [
      { name: 'Cloth', quantity: 3 },
      { name: 'Leather Scraps', quantity: 2 },
    ],
  },
  {
    id: 'craft-feet',
    name: 'Field Boots',
    description:
      'Sturdy boots made to keep moving when the ground turns cruel.',
    skill: 'crafting',
    output: makeCraftedItem('crafted-feet', 'armor', 'feet', 'Field Boots', {
      power: 0,
      defense: 1,
      maxHp: 1,
    }),
    ingredients: [
      { name: 'Leather Scraps', quantity: 3 },
      { name: 'Sticks', quantity: 1 },
    ],
  },
  {
    id: 'craft-ring-left',
    name: 'Copper Loop',
    description: 'A simple copper loop dusted with faint Aether residue.',
    skill: 'crafting',
    output: makeCraftedItem(
      'crafted-ring-left',
      'artifact',
      'ringLeft',
      'Copper Loop',
      {
        power: 1,
        defense: 0,
        maxHp: 1,
      },
    ),
    ingredients: [
      { name: 'Copper Ore', quantity: 2 },
      { name: 'Aether Dust', quantity: 1 },
    ],
  },
  {
    id: 'craft-ring-right',
    name: 'Copper Band',
    description: 'A hammered copper band that hums with a trace of Aether.',
    skill: 'crafting',
    output: makeCraftedItem(
      'crafted-ring-right',
      'artifact',
      'ringRight',
      'Copper Band',
      {
        power: 1,
        defense: 0,
        maxHp: 1,
      },
    ),
    ingredients: [
      { name: 'Copper Ore', quantity: 2 },
      { name: 'Aether Dust', quantity: 1 },
    ],
  },
  {
    id: 'craft-amulet',
    name: 'Charm Necklace',
    description:
      'A warding charm strung for travelers who sleep near the wilds.',
    skill: 'crafting',
    output: makeCraftedItem(
      'crafted-amulet',
      'artifact',
      'amulet',
      'Charm Necklace',
      {
        power: 0,
        defense: 1,
        maxHp: 2,
      },
    ),
    ingredients: [
      { name: 'Iron Chunks', quantity: 1 },
      { name: 'Aether Dust', quantity: 2 },
    ],
  },
  {
    id: 'craft-cloak',
    name: 'Wayfarer Cloak',
    description:
      'A weathered cloak for crossing cold winds and stranger skies.',
    skill: 'crafting',
    output: makeCraftedItem(
      'crafted-cloak',
      'artifact',
      'cloak',
      'Wayfarer Cloak',
      {
        power: 0,
        defense: 1,
        maxHp: 1,
      },
    ),
    ingredients: [
      { name: 'Cloth', quantity: 3 },
      { name: 'Aether Dust', quantity: 1 },
    ],
  },
  {
    id: 'craft-relic',
    name: 'Hearth Totem',
    description:
      'A steady relic meant to hold a little warmth against the Fracture.',
    skill: 'crafting',
    output: makeCraftedItem(
      'crafted-relic',
      'artifact',
      'relic',
      'Hearth Totem',
      {
        power: 1,
        defense: 0,
        maxHp: 3,
      },
    ),
    ingredients: [
      { name: 'Coal', quantity: 1 },
      { name: 'Aether Dust', quantity: 3 },
      { name: 'Logs', quantity: 1 },
    ],
  },
];

export const RECIPE_BOOK_RECIPES: RecipeDefinition[] =
  RAW_RECIPE_BOOK_RECIPES.map((recipe) => ({
    ...recipe,
    name: t(`game.recipe.${recipe.id}.name`),
    description: t(`game.recipe.${recipe.id}.description`),
  }));
