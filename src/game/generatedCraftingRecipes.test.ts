import { describe, expect, it } from 'vitest';
import { GENERATED_ICON_POOLS } from './content/generatedEquipment';
import { CRAFTABLE_ICON_ITEM_CONFIGS } from './content/generatedCraftingEquipment';
import { GENERATED_CRAFTING_RECIPES } from './generatedCraftingRecipes';
import { Skill } from './types';

describe('generated crafting recipes', () => {
  it('keeps one crafting recipe and one base item for every equippable icon variation', () => {
    const totalIconVariations = Object.values(GENERATED_ICON_POOLS).reduce(
      (total, icons) => total + icons.length,
      0,
    );

    expect(CRAFTABLE_ICON_ITEM_CONFIGS).toHaveLength(totalIconVariations);
    expect(GENERATED_CRAFTING_RECIPES).toHaveLength(totalIconVariations);
    expect(
      GENERATED_CRAFTING_RECIPES.every(
        (recipe) => recipe.skill === Skill.Crafting,
      ),
    ).toBe(true);
    expect(
      GENERATED_CRAFTING_RECIPES.every(
        (recipe) =>
          recipe.output.itemKey &&
          recipe.id === `craft-${recipe.output.itemKey}`,
      ),
    ).toBe(true);
  });

  it('uses lore-based names instead of numbered placeholder labels', () => {
    expect(
      CRAFTABLE_ICON_ITEM_CONFIGS.find(
        (config) => config.key === 'icon-helmet-01',
      )?.name,
    ).toBe('Ashwake Greathelm');
    expect(
      GENERATED_CRAFTING_RECIPES.find(
        (recipe) => recipe.id === 'craft-icon-sword-01',
      )?.name,
    ).toBe('Shardwake Blade');
    expect(
      GENERATED_CRAFTING_RECIPES.every(
        (recipe) => !/\b\d{2}\b/.test(recipe.name),
      ),
    ).toBe(true);
  });
});
