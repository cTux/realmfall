import { describe, expect, it } from 'vitest';
import { HARVEST_COOKING_RECIPES } from './harvestCookingRecipesTestkit';

describe('harvest cooking recipes', () => {
  it('keeps raw requirement tables canonical and name-free', () => {
    HARVEST_COOKING_RECIPES.forEach((recipe) => {
      recipe.ingredients.forEach((ingredient) => {
        expect(ingredient.name).toBeUndefined();
      });
      recipe.fuelOptions?.forEach((fuel) => {
        expect(fuel.name).toBeUndefined();
      });
    });
  });
});
