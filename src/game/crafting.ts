import { makeCookedFish, makeCraftedItem } from './inventory';
import { t } from '../i18n';
import { EquipmentSlotId } from './content/ids';
import { getItemConfigByKey } from './content/items';
import { Skill } from './types';
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

function matchesRequirement(item: Item, requirement: RecipeRequirement) {
  return (
    item.quantity >= requirement.quantity &&
    (requirement.itemKey
      ? item.itemKey === requirement.itemKey
      : item.name === requirement.name)
  );
}

const RAW_RECIPE_BOOK_RECIPES: RecipeDefinition[] = [
  {
    id: 'cook-cooked-fish',
    name: 'Cooked Fish',
    description: 'Cook raw fish over a small fire.',
    skill: Skill.Cooking,
    output: makeCookedFish(),
    ingredients: [{ itemKey: 'raw-fish', name: 'Raw Fish', quantity: 1 }],
    fuelOptions: [
      { itemKey: 'coal', name: 'Coal', quantity: 1 },
      { itemKey: 'logs', name: 'Logs', quantity: 2 },
      { itemKey: 'sticks', name: 'Sticks', quantity: 8 },
    ],
  },
  {
    id: 'craft-weapon',
    name: 'Camp Spear',
    description: 'A rough spear suited to the long roads between Shards.',
    skill: Skill.Crafting,
    output: makeCraftedItem(
      'crafted-weapon',
      EquipmentSlotId.Weapon,
      'camp-spear',
      {
        power: 3,
        defense: 0,
        maxHp: 0,
      },
    ),
    ingredients: [
      { itemKey: 'iron-chunks', name: 'Iron Chunks', quantity: 2 },
      { itemKey: 'sticks', name: 'Sticks', quantity: 2 },
    ],
  },
  {
    id: 'craft-offhand',
    name: 'Hide Buckler',
    description: 'A hide-wrapped buckler built to catch desperate blows.',
    skill: Skill.Crafting,
    output: makeCraftedItem(
      'crafted-offhand',
      EquipmentSlotId.Offhand,
      'hide-buckler',
      {
        power: 0,
        defense: 2,
        maxHp: 1,
      },
    ),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 3 },
      { itemKey: 'logs', name: 'Logs', quantity: 1 },
    ],
  },
  {
    id: 'craft-head',
    name: 'Patchwork Hood',
    description:
      'A stitched hood that keeps ash, rain, and cinders off your face.',
    skill: Skill.Crafting,
    output: makeCraftedItem(
      'crafted-head',
      EquipmentSlotId.Head,
      'patchwork-hood',
      {
        power: 0,
        defense: 1,
        maxHp: 1,
      },
    ),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 2 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 2 },
    ],
  },
  {
    id: 'craft-chest',
    name: 'Settler Vest',
    description:
      'A layered vest worn by settlers who expect hard weather and harder work.',
    skill: Skill.Crafting,
    output: makeCraftedItem(
      'crafted-chest',
      EquipmentSlotId.Chest,
      'settler-vest',
      {
        power: 0,
        defense: 2,
        maxHp: 1,
      },
    ),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 4 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 4 },
      { itemKey: 'iron-chunks', name: 'Iron Chunks', quantity: 1 },
    ],
  },
  {
    id: 'craft-hands',
    name: 'Work Gloves',
    description:
      'A practical pair of gloves for rope, tools, and rough salvage.',
    skill: Skill.Crafting,
    output: makeCraftedItem(
      'crafted-hands',
      EquipmentSlotId.Hands,
      'work-gloves',
      {
        power: 0,
        defense: 1,
        maxHp: 1,
      },
    ),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 3 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
    ],
  },
  {
    id: 'craft-legs',
    name: 'Trail Leggings',
    description: 'Tough leggings meant for brush, stone, and broken roads.',
    skill: Skill.Crafting,
    output: makeCraftedItem(
      'crafted-legs',
      EquipmentSlotId.Legs,
      'trail-leggings',
      {
        power: 0,
        defense: 1,
        maxHp: 1,
      },
    ),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 3 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 2 },
    ],
  },
  {
    id: 'craft-feet',
    name: 'Field Boots',
    description:
      'Sturdy boots made to keep moving when the ground turns cruel.',
    skill: Skill.Crafting,
    output: makeCraftedItem(
      'crafted-feet',
      EquipmentSlotId.Feet,
      'field-boots',
      {
        power: 0,
        defense: 1,
        maxHp: 1,
      },
    ),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 3 },
      { itemKey: 'sticks', name: 'Sticks', quantity: 1 },
    ],
  },
  {
    id: 'craft-ring-left',
    name: 'Copper Loop',
    description: 'A simple copper loop dusted with faint Aether residue.',
    skill: Skill.Crafting,
    output: makeCraftedItem(
      'crafted-ring-left',
      EquipmentSlotId.RingLeft,
      'copper-loop',
      {
        power: 1,
        defense: 0,
        maxHp: 1,
      },
    ),
    ingredients: [
      { itemKey: 'copper-ore', name: 'Copper Ore', quantity: 2 },
      { itemKey: 'arcane-dust', name: 'Aether Dust', quantity: 1 },
    ],
  },
  {
    id: 'craft-ring-right',
    name: 'Copper Band',
    description: 'A hammered copper band that hums with a trace of Aether.',
    skill: Skill.Crafting,
    output: makeCraftedItem(
      'crafted-ring-right',
      EquipmentSlotId.RingRight,
      'copper-band',
      {
        power: 1,
        defense: 0,
        maxHp: 1,
      },
    ),
    ingredients: [
      { itemKey: 'copper-ore', name: 'Copper Ore', quantity: 2 },
      { itemKey: 'arcane-dust', name: 'Aether Dust', quantity: 1 },
    ],
  },
  {
    id: 'craft-amulet',
    name: 'Charm Necklace',
    description:
      'A warding charm strung for travelers who sleep near the wilds.',
    skill: Skill.Crafting,
    output: makeCraftedItem(
      'crafted-amulet',
      EquipmentSlotId.Amulet,
      'charm-necklace',
      {
        power: 0,
        defense: 1,
        maxHp: 2,
      },
    ),
    ingredients: [
      { itemKey: 'iron-chunks', name: 'Iron Chunks', quantity: 1 },
      { itemKey: 'arcane-dust', name: 'Aether Dust', quantity: 2 },
    ],
  },
  {
    id: 'craft-cloak',
    name: 'Wayfarer Cloak',
    description:
      'A weathered cloak for crossing cold winds and stranger skies.',
    skill: Skill.Crafting,
    output: makeCraftedItem(
      'crafted-cloak',
      EquipmentSlotId.Cloak,
      'wayfarer-cloak',
      {
        power: 0,
        defense: 1,
        maxHp: 1,
      },
    ),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 3 },
      { itemKey: 'arcane-dust', name: 'Aether Dust', quantity: 1 },
    ],
  },
  {
    id: 'craft-relic',
    name: 'Hearth Totem',
    description:
      'A steady relic meant to hold a little warmth against the Fracture.',
    skill: Skill.Crafting,
    output: makeCraftedItem(
      'crafted-relic',
      EquipmentSlotId.Offhand,
      'hearth-totem',
      {
        power: 1,
        defense: 0,
        maxHp: 3,
      },
    ),
    ingredients: [
      { itemKey: 'coal', name: 'Coal', quantity: 1 },
      { itemKey: 'arcane-dust', name: 'Aether Dust', quantity: 3 },
      { itemKey: 'logs', name: 'Logs', quantity: 1 },
    ],
  },
];

export const RECIPE_BOOK_RECIPES: RecipeDefinition[] =
  RAW_RECIPE_BOOK_RECIPES.map((recipe) => ({
    ...recipe,
    name: t(`game.recipe.${recipe.id}.name`),
    description: t(`game.recipe.${recipe.id}.description`),
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
