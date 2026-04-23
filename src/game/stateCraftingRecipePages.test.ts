import {
  activateInventoryItem,
  createGame,
  getGoldAmount,
  getTileAt,
  sellInventoryItem,
  takeTileItem,
  useItem,
} from './state';
import { GameTag } from './content/tags';
import { getRecipeBookEntries } from './state';
import { findResolvedEnemyRecipeDrop } from './stateCraftingTestHelpers';

describe('game state crafting recipe pages', () => {
  it('learns a dropped recipe page when used', () => {
    const game = createGame(3, 'recipe-use-seed');
    const originalLearnedRecipeIds = game.player.learnedRecipeIds;
    game.player.inventory.push({
      id: 'recipe-craft-weapon',
      recipeId: 'craft-icon-axe-01',
      name: 'Recipe: Axe 01',
      quantity: 1,
      tier: 1,
      rarity: 'uncommon',
      power: 0,
      defense: 0,
      maxHp: 0,
      healing: 0,
      hunger: 0,
    });

    const learned = useItem(game, 'recipe-craft-weapon');

    expect(learned.player.learnedRecipeIds).toContain('craft-icon-axe-01');
    expect(learned.player.learnedRecipeIds).not.toBe(originalLearnedRecipeIds);
    expect(
      learned.player.inventory.some(
        (item) => item.id === 'recipe-craft-weapon',
      ),
    ).toBe(false);
  });

  it('does not consume an already learned recipe page when used', () => {
    const game = createGame(3, 'recipe-known-seed');
    game.player.learnedRecipeIds = ['craft-icon-axe-01'];
    game.player.inventory.push({
      id: 'recipe-craft-weapon-known',
      recipeId: 'craft-icon-axe-01',
      name: 'Recipe: Axe 01',
      quantity: 1,
      tier: 1,
      rarity: 'uncommon',
      power: 0,
      defense: 0,
      maxHp: 0,
      healing: 0,
      hunger: 0,
    });

    const unchanged = useItem(game, 'recipe-craft-weapon-known');

    expect(unchanged.player.learnedRecipeIds).toEqual(['craft-icon-axe-01']);
    expect(
      unchanged.player.inventory.some(
        (item) => item.id === 'recipe-craft-weapon-known',
      ),
    ).toBe(true);
    expect(unchanged.logs[0]?.text).toContain('already know');
  });

  it('routes inventory activation for learned recipe pages through the use path', () => {
    const game = createGame(3, 'recipe-activation-seed');
    game.player.learnedRecipeIds = ['craft-icon-axe-01'];
    game.player.inventory.push({
      id: 'recipe-craft-weapon-activate',
      recipeId: 'craft-icon-axe-01',
      name: 'Recipe: Axe 01',
      quantity: 1,
      tier: 1,
      rarity: 'uncommon',
      power: 0,
      defense: 0,
      maxHp: 0,
      healing: 0,
      hunger: 0,
    });

    const unchanged = activateInventoryItem(
      game,
      'recipe-craft-weapon-activate',
    );

    expect(unchanged.player.learnedRecipeIds).toEqual(['craft-icon-axe-01']);
    expect(
      unchanged.player.inventory.some(
        (item) => item.id === 'recipe-craft-weapon-activate',
      ),
    ).toBe(true);
    expect(unchanged.logs[0]?.text).toContain('already know');
  });

  it('sells recipe pages in town for elevated value', () => {
    const game = createGame(3, 'sell-recipe-page-seed');
    game.tiles['0,0'] = {
      ...getTileAt(game, { q: 0, r: 0 }),
      structure: 'town',
    };
    game.player.inventory.push({
      id: 'recipe-craft-weapon-sell',
      recipeId: 'craft-icon-axe-01',
      icon: 'recipe.svg',
      name: 'Recipe: Axe 01',
      tags: [GameTag.ItemResource, GameTag.ItemRecipe],
      quantity: 1,
      tier: 2,
      rarity: 'uncommon',
      power: 0,
      defense: 0,
      maxHp: 0,
      healing: 0,
      hunger: 0,
      thirst: 0,
    });

    const sold = sellInventoryItem(game, 'recipe-craft-weapon-sell');

    expect(
      sold.player.inventory.some(
        (item) => item.id === 'recipe-craft-weapon-sell',
      ),
    ).toBe(false);
    expect(getGoldAmount(sold.player.inventory)).toBe(40);
    expect(sold.logs[0]?.text).toContain('Recipe: Axe 01');
    expect(sold.logs[0]?.text).toContain('40 gold');
  });

  it('unlocks the matching recipe book entry after looting and using an enemy recipe page', () => {
    const dropped = findResolvedEnemyRecipeDrop('recipe-loot-use-seed', 400);

    expect(dropped).not.toBeNull();

    const recipePage = getTileAt(dropped!.resolved, {
      q: 2,
      r: 0,
    }).items.find((item) => item.recipeId === dropped!.recipeId);
    expect(recipePage).toBeDefined();
    expect(recipePage?.itemKey).toBe('recipe-book');
    expect(recipePage?.icon).toBeTruthy();

    const looted = takeTileItem(dropped!.resolved, recipePage!.id);
    const learned = useItem(looted, recipePage!.id);

    expect(learned.player.learnedRecipeIds).toContain(dropped!.recipeId);
    expect(
      getRecipeBookEntries(learned.player.learnedRecipeIds).some(
        (entry) => entry.id === dropped!.recipeId && entry.learned,
      ),
    ).toBe(true);
  });
});
