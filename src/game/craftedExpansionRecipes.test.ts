import { describe, expect, it } from 'vitest';
import { CRAFTED_EXPANSION_RECIPES } from './craftedExpansionRecipes';

describe('crafted expansion recipes', () => {
  it('uses concise shared descriptions for expansion recipe families', () => {
    expect(
      CRAFTED_EXPANSION_RECIPES.find(
        (recipe) => recipe.id === 'craft-ashen-blade',
      )?.description,
    ).toBe('Tempered blade for shard-road skirmishes.');
    expect(
      CRAFTED_EXPANSION_RECIPES.find(
        (recipe) => recipe.id === 'craft-warden-cloak',
      )?.description,
    ).toBe('Weather cloak for rain, soot, and drifting ash.');
  });
});
