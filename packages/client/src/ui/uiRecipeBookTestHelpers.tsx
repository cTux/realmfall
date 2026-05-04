import React from 'react';
import { DEFAULT_WINDOWS } from '../app/constants';
import { createSkillRecord } from '../game/skillRecords';
import { Skill } from '../game/types';
import { RecipeBookWindow } from './components/RecipeBookWindow';
import { mountUi } from './uiTestHelpers';

type RecipeBookWindowProps = React.ComponentProps<typeof RecipeBookWindow>;
type RecipeBookRecipe = NonNullable<RecipeBookWindowProps['recipes']>[number];
type RecipeOverride = Omit<Partial<RecipeBookRecipe>, 'output'> & {
  output?: Partial<RecipeBookRecipe['output']>;
};

export const DEFAULT_RECIPE_SKILL_LEVELS = createSkillRecord(
  () => 1,
) satisfies RecipeBookWindowProps['recipeSkillLevels'];

const defaultRecipeBookProps = {
  position: DEFAULT_WINDOWS.recipes,
  onMove: () => {},
  currentStructure: 'camp',
  recipeSkillLevels: DEFAULT_RECIPE_SKILL_LEVELS,
  recipes: [],
  inventoryCountsByItemKey: {},
  preferredSkill: null,
  materialFilterItemKey: null,
  onResetMaterialFilter: () => {},
  onCraft: () => {},
  onToggleFavoriteRecipe: () => {},
} satisfies RecipeBookWindowProps;

export function createRecipe(overrides: RecipeOverride = {}): RecipeBookRecipe {
  const baseRecipe: RecipeBookRecipe = {
    id: 'craft-town-knife',
    name: 'Town Knife',
    description: 'Workshop recipe',
    skill: Skill.Crafting,
    learned: true,
    favorite: false,
    output: {
      id: 'crafted-town-knife',
      itemKey: 'town-knife',
      name: 'Town Knife',
      quantity: 1,
      tier: 1,
      rarity: 'common',
      power: 2,
      defense: 0,
      maxHp: 0,
      healing: 0,
      hunger: 0,
    },
    ingredients: [],
  };

  return {
    ...baseRecipe,
    ...overrides,
    output: {
      ...baseRecipe.output,
      ...overrides.output,
    },
    ingredients: overrides.ingredients ?? baseRecipe.ingredients,
    ...(overrides.fuelOptions === undefined
      ? {}
      : { fuelOptions: overrides.fuelOptions }),
  };
}

export function mountRecipeBook(
  overrides: Partial<RecipeBookWindowProps> = {},
) {
  return mountUi(
    <RecipeBookWindow {...defaultRecipeBookProps} {...overrides} />,
  );
}
