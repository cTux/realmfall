import { describe, expect, it, vi } from 'vitest';

describe('game content i18n bootstrap order', () => {
  it('resolves item, recipe, structure, and enemy text after i18n loads', async () => {
    vi.resetModules();

    const i18n = await import('../../i18n');
    const { buildItemFromConfig } = await import('./items');
    const { RECIPE_BOOK_RECIPES } = await import('../crafting');
    const { getEnemyConfig } = await import('./enemies');
    const { getStructureConfig } = await import('./structures');

    await i18n.loadI18n();

    expect(buildItemFromConfig('trail-ration').name).toBe('Trail Ration');

    const recipe = RECIPE_BOOK_RECIPES.find(
      (entry) => entry.id === 'cook-aubergine-meat-skillet',
    );

    expect(recipe?.name).toBe('Aubergine Meat Skillet');
    expect(recipe?.description).toBe(
      'A rich skillet of meat, aubergine, and tomato.',
    );
    expect(getStructureConfig('camp').title).toBe('Campfire');
    expect(getEnemyConfig('stag')?.name).toBe('Stag');
  }, 15000);
});
