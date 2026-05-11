import React from 'react';
import { createSkillRecord } from '@realmfall/core/game/skillRecords';
import { Skill } from '@realmfall/core/game/stateTypes';
import { RecipeBookWindowContent } from './components/RecipeBookWindow/RecipeBookWindowContent';
import { mountUi } from './uiTestHelpers';
import recipeStyles from './components/RecipeBookWindow/styles.module.scss';

type RecipeBookWindowContentProps = React.ComponentProps<
  typeof RecipeBookWindowContent
>;
type RecipeBookRecipe = NonNullable<
  RecipeBookWindowContentProps['recipes']
>[number];
type RecipeOverride = Omit<Partial<RecipeBookRecipe>, 'output'> & {
  output?: Partial<RecipeBookRecipe['output']>;
};

export const DEFAULT_RECIPE_SKILL_LEVELS = createSkillRecord(
  () => 1,
) satisfies RecipeBookWindowContentProps['recipeSkillLevels'];

const defaultRecipeBookProps = {
  currentStructure: 'camp',
  recipeSkillLevels: DEFAULT_RECIPE_SKILL_LEVELS,
  recipes: [],
  inventoryCountsByItemKey: {},
  preferredSkill: null,
  materialFilterItemKey: null,
  onResetMaterialFilter: () => {},
  onCraft: () => {},
  onToggleFavoriteRecipe: () => {},
} satisfies RecipeBookWindowContentProps;

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
  overrides: Partial<RecipeBookWindowContentProps> = {},
) {
  return mountUi(
    <div className={recipeStyles.window}>
      <div className={recipeStyles.windowBody}>
        <RecipeBookWindowContent {...defaultRecipeBookProps} {...overrides} />
      </div>
    </div>,
  );
}
