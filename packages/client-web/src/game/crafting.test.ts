import { describe, expect, it } from 'vitest';
import {
  describeRequirement,
  getRecipeRequiredStructure,
  getRecipeSkillForStructure,
  hasAllRequirements,
  RECIPE_BOOK_RECIPES,
} from './craftingTestkit';
import { Skill, type Item, type RecipeRequirement } from './types';

function buildInventoryItem(
  overrides: Partial<Item> & Pick<Item, 'id' | 'name' | 'quantity'>,
): Item {
  return {
    tier: 1,
    rarity: 'common',
    power: 0,
    defense: 0,
    maxHp: 0,
    healing: 0,
    hunger: 0,
    ...overrides,
  };
}

describe('crafting requirements', () => {
  it('rejects malformed name-only requirements at runtime', () => {
    const inventory = [
      buildInventoryItem({
        id: 'coal-1',
        itemKey: 'coal',
        name: 'Coal',
        quantity: 4,
      }),
    ];
    const malformedRequirements = [
      { name: 'Coal', quantity: 1 } as RecipeRequirement,
    ];

    expect(hasAllRequirements(inventory, malformedRequirements)).toBe(false);
  });

  it('derives requirement labels from localized item data', () => {
    const fishRecipe = RECIPE_BOOK_RECIPES.find(
      (recipe) => recipe.id === 'cook-cooked-fish',
    );
    if (!fishRecipe?.fuelOptions?.[0]) {
      throw new Error('Expected cooked fish recipe fuel requirements.');
    }

    expect(describeRequirement(fishRecipe.fuelOptions[0])).toBe('1 Coal');
  });
});

describe('crafting stations', () => {
  it('keeps recipe station lookups aligned with structure capabilities', () => {
    expect(getRecipeRequiredStructure({ skill: Skill.Hand })).toBeNull();
    expect(getRecipeRequiredStructure({ skill: Skill.Cooking })).toBe('camp');
    expect(getRecipeRequiredStructure({ skill: Skill.Smelting })).toBe(
      'furnace',
    );
    expect(getRecipeRequiredStructure({ skill: Skill.Crafting })).toBe(
      'workshop',
    );

    expect(getRecipeSkillForStructure('camp')).toBe(Skill.Cooking);
    expect(getRecipeSkillForStructure('furnace')).toBe(Skill.Smelting);
    expect(getRecipeSkillForStructure('workshop')).toBe(Skill.Crafting);
    expect(getRecipeSkillForStructure('town')).toBeNull();
  });
});
